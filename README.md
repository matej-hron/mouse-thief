# Mouse Thief

A tiny pixel-art endless runner. You stole the cat's mouse "just for fun". She did not find it funny.

**Play:** https://matej-hron.github.io/mouse-thief/

- Space / ↑ / tap: jump (again in the air: double jump, against a wall: wall-jump)
- ↓ / swipe down: slide
- 1-3: abilities (buy them in the shop)
- On phones: big on-screen JUMP / SLIDE buttons (or tap anywhere / swipe down)

New players get an interactive tutorial after the intro (replay it any time via HOW TO PLAY).

Single HTML file, no dependencies. Open `index.html` locally or serve via GitHub Pages.

## Multiplayer

MULTIPLAYER → CREATE GAME gives you a 4-letter code; your friend picks JOIN WITH A CODE and types it.
One of you is the thief, the other is the cat (swap any time). All abilities are free, limited only by cooldowns:

- Thief: jump / slide as usual, 1 FREEZE · 2 SPEED BOOST · 3 SHIELD
- Cat: tap / Space POUNCE · 1 SPRINT · 2 TRAP (spikes pop up ahead of the thief) · 3 ROAR (stops him for a moment)

Devices connect through the free PeerJS server and then talk directly (WebRTC). The thief's device runs the game,
so jumping never lags. Online play needs an internet connection.

## Install as an app (PWA)

The game is an installable Progressive Web App and works offline.

- **Android / Chrome / Edge:** open the link and tap **INSTALL APP** in the menu (or the browser's "Install app" / "Add to Home screen").
- **iPhone / iPad (Safari):** tap **Share → Add to Home Screen**.

When releasing a new version, bump `CACHE` in `sw.js` and `VERSION` in `index.html`.
