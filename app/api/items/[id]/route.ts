import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSQL();
  await sql`DELETE FROM stock_items WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
