ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;

UPDATE "users"
SET "is_admin" = true
WHERE "username" = 'admin';
