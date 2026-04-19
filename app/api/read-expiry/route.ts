import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
          },
          {
            type: 'text',
            text: '画像から有効期限・消費期限・賞味期限を探してYYYY-MM形式で返してください。年と月のみ。見つからない場合は"NONE"。他の文字は不要。',
          },
        ],
      },
    ],
  });

  const text = ((message.content[0] as { type: string; text: string }).text ?? '').trim();
  const match = text.match(/(\d{4})-(\d{2})/);

  if (!match) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ date: match[0] });
}
