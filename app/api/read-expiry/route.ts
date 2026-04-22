import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

const PROMPT = `この商品ラベルの画像から消費期限・賞味期限・有効期限・使用期限を読み取ってください。

【重要】
- 「消費期限」「賞味期限」「有効期限」「EXP」「Best Before」「Use By」と記載された日付を探してください
- 令和表記は西暦に変換してください（令和8年=2026年、R8=2026年）
- 2桁年は20XX年として解釈してください（26年=2026年）
- 日付が複数ある場合は、最も近い（最も早い）有効期限を返してください

【回答形式】
必ず「YYYY-MM」形式のみで返してください（例: 2026-08）。
日付が読み取れない場合のみ「不明」と返してください。
説明や余分な文字は一切不要です。`;

// Gemini が返したテキストから YYYY-MM を抽出（フォールバック用）
function extractYearMonth(text: string): string | null {
  // YYYY-MM 形式がそのまま含まれる場合
  const direct = text.match(/\b(20[2-3]\d)-(\d{2})\b/);
  if (direct) return `${direct[1]}-${direct[2]}`;

  // 全角数字 → 半角
  let s = text.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

  // 令和変換
  s = s.replace(/令和\s*(\d{1,2})\s*年?/g, (_, y) => String(2018 + parseInt(y)));
  s = s.replace(/\bR\.?\s*(\d{1,2})\b/gi, (_, y) => String(2018 + parseInt(y)));
  s = s.replace(/年/g, '-').replace(/月/g, '');

  // 4桁年
  const m4 = s.match(/(20[2-3]\d)\s*[-./]\s*(\d{1,2})/);
  if (m4) {
    const year = parseInt(m4[1]);
    const month = parseInt(m4[2]);
    if (month >= 1 && month <= 12) return `${year}-${String(month).padStart(2, '0')}`;
  }

  // 2桁年
  const m2 = s.match(/\b([2-3]\d)\s*[-./・]\s*(\d{1,2})\b/);
  if (m2) {
    const year = 2000 + parseInt(m2[1]);
    const month = parseInt(m2[2]);
    if (year >= 2024 && year <= 2040 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: 'no image' }, { status: 400 });

  if (!GEMINI_KEY) {
    console.error('[read-expiry] GEMINI_API_KEY が未設定');
    return NextResponse.json({ error: 'api key missing' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            ],
          }],
          generationConfig: {
            maxOutputTokens: 20,
            temperature: 0,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[read-expiry] Gemini error:', res.status, errBody.slice(0, 300));
      return NextResponse.json({ error: 'gemini api error' }, { status: 500 });
    }

    const data = await res.json();
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    console.log('[read-expiry] Gemini raw:', rawText);

    if (!rawText || rawText === '不明') {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    // YYYY-MM 形式ならそのまま使用
    const directMatch = rawText.match(/^(20[2-3]\d)-(0[1-9]|1[0-2])$/);
    if (directMatch) {
      return NextResponse.json({ date: rawText });
    }

    // それ以外は抽出を試みる
    const date = extractYearMonth(rawText);
    if (date) {
      return NextResponse.json({ date });
    }

    console.warn('[read-expiry] date parse failed:', rawText);
    return NextResponse.json({ error: 'not found' }, { status: 404 });

  } catch (e) {
    console.error('[read-expiry] exception:', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
