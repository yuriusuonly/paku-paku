-- Required extensions.
-- pgcrypto provides bcrypt helpers and UUID generation for local/hosted schemas.
create extension if not exists pgcrypto with schema extensions;
