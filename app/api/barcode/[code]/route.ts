import { NextResponse } from 'next/server';

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const url = new URL('https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801');
    url.searchParams.set('format', 'json');
    url.searchParams.set('applicationId', RAKUTEN_APP_ID!);
    url.searchParams.set('accessKey', RAKUTEN_ACCESS_KEY!);
    url.searchParams.set('productCode', code);

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    const data = await res.json();
    const product = data.Products?.[0]?.Product;
    if (product) {
      const rawName: string = product.productName || product.brandName || '';
      const name = rawName.trim().slice(0, 30);
      if (name) return NextResponse.json({ name });
    }
  } catch {
    // fall through
  }
  return NextResponse.json({ name: '不明' });
}
