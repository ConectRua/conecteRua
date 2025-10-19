INSERT INTO "users" ("username", "email", "password", "email_verified", "verification_token")
VALUES (
  'admin',
  'admin@conecterua.org',
  '050112650e95a974eceb74df3d7d517aebcdd21a5a341780b2f24a83256ff389842a670a26386c821b4f8d65553ec1474ca4651459def956b2310081b560ef8a.0123456789abcdef0123456789abcdef',
  true,
  NULL
)
ON CONFLICT ("username") DO UPDATE
SET
  "email" = EXCLUDED."email",
  "password" = EXCLUDED."password",
  "email_verified" = true,
  "verification_token" = NULL,
  "updated_at" = NOW();
