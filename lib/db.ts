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
      expires_at VARCHAR(7) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // DATE型のカラムをVARCHAR(7)にマイグレーション
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_items'
          AND column_name = 'expires_at'
          AND data_type = 'date'
      ) THEN
        ALTER TABLE stock_items
          ALTER COLUMN expires_at TYPE VARCHAR(7)
          USING TO_CHAR(expires_at, 'YYYY-MM');
      END IF;
    END $$;
  `;
}
