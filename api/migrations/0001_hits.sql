CREATE TABLE hits_daily (
  day TEXT NOT NULL,
  page TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page)
);
CREATE TABLE hits_uniq (
  day TEXT NOT NULL,
  page TEXT NOT NULL,
  vid TEXT NOT NULL,
  PRIMARY KEY (day, page, vid)
);
CREATE TABLE hits_country (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country)
);
