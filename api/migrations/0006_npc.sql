-- Pixel Quest's talking characters (POST /v1/npc): how many answers a day, for everybody ('all') and for each player
-- ('ip:' and the hash of the day and the IP address). Old days are deleted by the nightly cleanup.
CREATE TABLE npc_usage (
  day TEXT NOT NULL,
  k TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, k)
);
