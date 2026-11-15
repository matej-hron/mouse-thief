-- One cloud save per player: every game's progress as one opaque blob the arcade packs (gzip + base64, or JSON).
-- rev goes up by one with every save, so a phone can tell whether another phone saved since it last looked.
CREATE TABLE saves (
  player TEXT PRIMARY KEY,
  rev INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated TEXT NOT NULL
);
