import { NextResponse } from 'next/server';

const YAHOO_APP_ID = process.env.YAHOO_APP_ID;

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const url = new URL('https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch');
    url.searchParams.set('appid', YAHOO_APP_ID!);
    url.searchParams.set('jan_code', code);
    url.searchParams.set('results', '1');

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    const data = await res.json();
    const hit = data.hits?.[0];
    if (hit?.name) {
      const name = (hit.name as string).trim().slice(0, 30);
      return NextResponse.json({ name });
    }
  } catch {
    // fall through
  }
  return NextResponse.json({ name: '不明' });
}
