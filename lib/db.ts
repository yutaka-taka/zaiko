import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

export function getSQL() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!);
  }
  return _sql;
}

export async function initDB() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS stock_items (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(30) NOT NULL,
      expires_at DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
