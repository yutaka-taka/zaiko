import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

function parseExpiryDate(text: string): string | null {
  // 全角数字を半角に変換・年月の漢字をスラッシュに統一
  const normalized = text
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/年/g, '/')
    .replace(/月/g, '');

  const candidates: string[] = [];

  // 4桁年パターン: 2026/04, 2026.04, 2026-04, 2026 04（日付付きも可）
  const p4 = /(20[2-3]\d)[.\-/\s](\d{1,2})/g;
  let m: RegExpExecArray | null;
  while ((m = p4.exec(normalized)) !== null) {
    const mo = parseInt(m[2]);
    if (mo >= 1 && mo <= 12) {
      candidates.push(`${m[1]}-${String(mo).padStart(2, '0')}`);
    }
  }

  // 2桁年パターン: 26.04, 26/04（2024〜2040の範囲のみ）
  const p2 = /\b([2-3]\d)[.\-/](\d{2})\b/g;
  while ((m = p2.exec(normalized)) !== null) {
    const yr = parseInt(m[1]);
    const mo = parseInt(m[2]);
    if (yr >= 24 && yr <= 40 && mo >= 1 && mo <= 12) {
      candidates.push(`20${m[1]}-${m[2]}`);
    }
  }

  if (candidates.length === 0) return null;

  // 消費期限・賞味期限・有効期限に近い候補を優先
  if (candidates.length > 1) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (/[消賞有]/.test(line) && /期限/.test(line)) {
        for (const candidate of candidates) {
          const shortYear = candidate.slice(2, 4);
          if (line.includes(candidate.slice(0, 4)) || line.includes(shortYear)) {
            return candidate;
          }
        }
      }
    }
  }

  return candidates[0];
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
          features: [{ type: 'TEXT_DETECTION' }],
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
