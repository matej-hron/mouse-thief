/** Remove a player and everything keyed to them: failed-login counter, scores, sessions, push subscriptions. */
export const deletePlayer = (db: D1Database, id: string) =>
  db.batch([
    db.prepare('DELETE FROM login_fail WHERE name_key = (SELECT name_key FROM players WHERE id = ?)').bind(id),
    db.prepare('DELETE FROM scores WHERE player = ?').bind(id),
    db.prepare('DELETE FROM sessions WHERE player = ?').bind(id),
    db.prepare('DELETE FROM push_subs WHERE player = ?').bind(id),
    db.prepare('DELETE FROM players WHERE id = ?').bind(id),
  ]);
