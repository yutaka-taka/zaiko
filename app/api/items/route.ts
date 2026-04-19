import { NextResponse } from 'next/server';
import { getSQL, initDB } from '@/lib/db';

export async function GET() {
  await initDB();
  const sql = getSQL();
  const rows = await sql`SELECT id, name, expires_at FROM stock_items ORDER BY name ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await initDB();
  const sql = getSQL();
  const { name, expires_at } = await req.json();
  if (!name || !expires_at) {
    return NextResponse.json({ error: '商品名と有効期限は必須です' }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO stock_items (name, expires_at) VALUES (${name}, ${expires_at})
    RETURNING id, name, expires_at
  `;
  return NextResponse.json(row, { status: 201 });
}
