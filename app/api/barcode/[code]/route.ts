import { NextResponse } from 'next/server';

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const url = new URL('https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601');
    url.searchParams.set('format', 'json');
    url.searchParams.set('applicationId', RAKUTEN_APP_ID!);
    url.searchParams.set('jan', code);
    url.searchParams.set('hits', '1');

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    const data = await res.json();
    if (data.Items?.[0]?.Item?.itemName) {
      const name = (data.Items[0].Item.itemName as string).trim().slice(0, 30);
      return NextResponse.json({ name });
    }
  } catch {
    // fall through
  }
  return NextResponse.json({ name: '不明' });
}
