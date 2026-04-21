import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

type Candidate = { date: string; priority: number };

function parseExpiryDate(raw: string): string | null {
  // 全角数字 → 半角
  let s = raw.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

  // 令和カレンダー変換: 令和8年 → 2026, R8 → 2026
  s = s.replace(/令和\s*(\d{1,2})\s*年?/g, (_, y) => String(2018 + parseInt(y)));
  s = s.replace(/\bR\.?\s*(\d{1,2})\b/gi, (_, y) => String(2018 + parseInt(y)));

  // 年月漢字 → スラッシュ
  s = s.replace(/年/g, '/').replace(/月/g, '');

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  const add = (year: number, month: number, priority: number) => {
    if (year < 2024 || year > 2040 || month < 1 || month > 12) return;
    const date = `${year}-${String(month).padStart(2, '0')}`;
    if (!seen.has(date)) {
      seen.add(date);
      candidates.push({ date, priority });
    }
  };

  let m: RegExpExecArray | null;

  // パターン1: 4桁年 + 区切り + 月（日付付きも可）例: 2026.04 / 2026/04 / 2026-04 / 2026 04
  const p4 = /(20[2-3]\d)\s*[.\-/・\s]\s*(\d{1,2})(?:\s*[.\-/]\s*\d{1,2})?/g;
  while ((m = p4.exec(s)) !== null) {
    add(parseInt(m[1]), parseInt(m[2]), 4);
  }

  // パターン2: 月 + 区切り + 4桁年（逆順）例: 04/2026
  const p4r = /\b(\d{1,2})\s*[.\-/]\s*(20[2-3]\d)\b/g;
  while ((m = p4r.exec(s)) !== null) {
    add(parseInt(m[2]), parseInt(m[1]), 3);
  }

  // パターン3: 2桁年 + 区切り + 月（日付付きも可）例: 26.04 / 26/04 / 26-04 / 26・04
  const p2 = /(?<!\d)([2-3]\d)\s*[.\-/・]\s*(\d{1,2})(?:\s*[.\-/]\s*\d{1,2})?(?!\d)/g;
  while ((m = p2.exec(s)) !== null) {
    const yr = parseInt(m[1]);
    const mo = parseInt(m[2]);
    if (yr >= 24 && yr <= 40) add(2000 + yr, mo, 3);
  }

  // パターン4: 2桁年 + スペース + 2桁月（OCRがスペースを挿入した場合）例: 26 04
  const p2sp = /(?<!\d)([2-3]\d)\s{1,4}(\d{2})(?!\d)/g;
  while ((m = p2sp.exec(s)) !== null) {
    const yr = parseInt(m[1]);
    const mo = parseInt(m[2]);
    if (yr >= 24 && yr <= 40 && mo >= 1 && mo <= 12) add(2000 + yr, mo, 2);
  }

  // パターン5: OCRがスペースを数字間に挿入した4桁年 例: "2 026.04" "20 26/04"
  const p4sp = /\b(2\s*0\s*[2-3]\s*\d)\s*[.\-/]\s*(\d{1,2})\b/g;
  while ((m = p4sp.exec(s)) !== null) {
    const year = parseInt(m[1].replace(/\s/g, ''));
    add(year, parseInt(m[2]), 3);
  }

  if (candidates.length === 0) return null;

  // 優先度でソート
  candidates.sort((a, b) => b.priority - a.priority);

  // 消費/賞味/有効期限キーワードに近い候補をさらに優先
  const expiryRe = /消費期限|賞味期限|有効期限|使用期限|EXP|Best\s*Before|Use\s*By/i;
  const lines = raw.split(/[\n\r]+/);
  for (let i = 0; i < lines.length; i++) {
    if (expiryRe.test(lines[i])) {
      const context = lines.slice(Math.max(0, i - 1), i + 3).join(' ');
      for (const c of candidates) {
        const [y, mo] = c.date.split('-');
        const shortY = y.slice(2);
        if (context.includes(y) || context.includes(shortY) || context.includes(mo)) {
          return c.date;
        }
      }
    }
  }

  return candidates[0].date;
}

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          // DOCUMENT_TEXT_DETECTION: 印刷物テキストに最適化（TEXT_DETECTIONより精度高）
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints: ['ja', 'en'] },
        }],
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'vision api error' }, { status: 500 });
  }

  const data = await response.json();
  const fullText: string =
    data.responses?.[0]?.fullTextAnnotation?.text ??
    data.responses?.[0]?.textAnnotations?.[0]?.description ??
    '';

  if (!fullText) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const date = parseExpiryDate(fullText);
  if (!date) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ date });
}
