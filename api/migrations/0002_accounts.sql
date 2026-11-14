CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  shape TEXT,
  color INTEGER,
  csalt TEXT,
  ssalt TEXT,
  pw TEXT,
  rsalt TEXT,
  rssalt TEXT,
  rpw TEXT,
  created TEXT,
  seen TEXT
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  player TEXT NOT NULL,
  created TEXT
);
CREATE INDEX sessions_player ON sessions (player);
CREATE TABLE scores (
  player TEXT,
  board TEXT,
  value REAL,
  updated TEXT,
  PRIMARY KEY (player, board)
);
CREATE INDEX scores_board_value ON scores (board, value);
CREATE TABLE login_fail (
  name_key TEXT PRIMARY KEY,
  count INTEGER,
  since INTEGER
);
