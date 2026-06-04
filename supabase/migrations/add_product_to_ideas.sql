ALTER TABLE ideas ADD COLUMN IF NOT EXISTS product TEXT NOT NULL DEFAULT 'tst';
CREATE INDEX IF NOT EXISTS ideas_product_idx ON ideas(product);
