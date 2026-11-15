-- Push subscriptions: one row per phone (browser) that turned notifications on, for the player logged in there.
CREATE TABLE push_subs (
  endpoint TEXT PRIMARY KEY,
  player TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created TEXT
);
CREATE INDEX push_subs_player ON push_subs (player);
