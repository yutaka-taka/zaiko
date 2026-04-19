import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const rawName: string =
        data.product.product_name_ja ||
        data.product.product_name ||
        '';
      const name = rawName.trim().slice(0, 30) || '不明';
      return NextResponse.json({ name });
    }
  } catch {
    // fall through
  }
  return NextResponse.json({ name: '不明' });
}
