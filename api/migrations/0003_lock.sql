-- The lock starts when the 10th attempt is recorded and lasts 15 minutes (0 = not locked).
ALTER TABLE login_fail ADD COLUMN locked_until INTEGER NOT NULL DEFAULT 0;
