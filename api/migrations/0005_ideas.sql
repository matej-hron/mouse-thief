-- IDEAS: feature requests written in the arcade by players with an account. Public, with a status the owner sets.
CREATE TABLE ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player TEXT NOT NULL,
  title TEXT NOT NULL,
  title_key TEXT NOT NULL,                     -- letters and digits only, for spotting the same idea twice
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'untriaged',    -- untriaged | accepted | rejected | implemented
  reply TEXT NOT NULL DEFAULT '',              -- the owner's short answer (why rejected, which version has it)
  votes INTEGER NOT NULL DEFAULT 0,            -- other players' upvotes (the author can't vote for their own)
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);
CREATE INDEX ideas_status ON ideas (status, votes);
CREATE INDEX ideas_player ON ideas (player, created);
CREATE INDEX ideas_title_key ON ideas (title_key);
CREATE TABLE idea_votes (
  idea INTEGER NOT NULL,
  player TEXT NOT NULL,
  PRIMARY KEY (idea, player)
);
CREATE INDEX idea_votes_player ON idea_votes (player);
