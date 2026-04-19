import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = 'hnd1'; // Tokyo — Yahoo Shopping API is Japan-only

const YAHOO_APP_ID = process.env.YAHOO_APP_ID;
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;

async function fetchYahoo(code: string): Promise<string> {
  const url = new URL('https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch');
  url.searchParams.set('appid', YAHOO_APP_ID!);
  url.searchParams.set('jan_code', code);
  url.searchParams.set('results', '1');
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  const data = await res.json() as { hits?: Array<{ name: string }> };
  return data.hits?.[0]?.name?.trim().slice(0, 30) ?? '';
}

async function fetchRakuten(code: string): Promise<string> {
  const url = new URL('https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801');
  url.searchParams.set('format', 'json');
  url.searchParams.set('applicationId', RAKUTEN_APP_ID!);
  url.searchParams.set('accessKey', RAKUTEN_ACCESS_KEY!);
  url.searchParams.set('productCode', code);
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  const data = await res.json() as { Products?: Array<{ Product: { productName?: string; brandName?: string } }> };
  const p = data.Products?.[0]?.Product;
  return (p?.productName ?? p?.brandName ?? '').trim().slice(0, 30);
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const yahoo = await fetchYahoo(code);
    if (yahoo) return NextResponse.json({ name: yahoo });
  } catch { /* fall through */ }
  try {
    const rakuten = await fetchRakuten(code);
    if (rakuten) return NextResponse.json({ name: rakuten });
  } catch { /* fall through */ }
  return NextResponse.json({ name: '不明' });
}
