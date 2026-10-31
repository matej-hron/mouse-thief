# Mouse Thief

A tiny pixel-art endless runner. You stole the cat's mouse "just for fun". She did not find it funny.

**Play:** https://matej-hron.github.io/mouse-thief/

- Space / ↑ / tap: jump (again in the air: double jump, against a wall: wall-jump)
- ↓ / swipe down: slide
- 1-3: abilities (buy them in the shop)
- On phones: big on-screen JUMP / SLIDE buttons (or tap anywhere / swipe down)

New players get an interactive tutorial after the intro (replay it any time via HOW TO PLAY).

- **Worlds:** pick where the chase happens. City (night rooftops) is free; unlock Desert (★150, 8% harder),
  Savanna (★180, 16% harder) and Spain (★210, 24% harder). Harder means a faster cat. Multiplayer is not affected.
- **Night / day mode** (SETTINGS → MODE): dark menus and the city at night, or light menus and the city by day.
- **Day and night:** during a run time goes round: night, sunrise, day, sunset, night again (one cycle every 2 minutes).
  The sun and the moon cross the sky and the whole scene changes color. The city starts the way MODE says, other worlds start by day.
- **Boss fight:** every now and then the roof turns flat, the run stops and **Bossy Cat** drops in: a huge crowned cat that
  meows, spits and hisses and swishes her tail. Low tail along the roof: **jump**. High tail at head height: **slide**.
  Survive 30 seconds to beat her (+10 ★ bonus, more for every next boss in the same run). First boss after 50 s,
  then 75 s of running between fights. Not in multiplayer or the tutorial.
- **Skins:** buy new looks for your thief in SHOP → SKINS, or unlock MY SKIN (★150) and design your own
  (body color, eye color, stripes or spots).
- **Pause:** when you resume, a 3, 2, 1, GO! countdown gives you a moment to get ready.

Single HTML file, no dependencies. Open `index.html` locally or serve via GitHub Pages.

## Multiplayer

MULTIPLAYER → CREATE GAME gives you a 4-letter code; your friend picks JOIN WITH A CODE and types it.
Pick a mode when creating the game (and change it any time in the lobby). All abilities are free, limited only by cooldowns.

**Thief vs cat:** one of you is the thief, the other is the cat (swap any time). The thief wins by surviving 60 seconds.

- Thief: jump / slide as usual, 1 FREEZE · 2 SPEED BOOST · 3 SHIELD
- Cat: tap / Space POUNCE · 1 SPRINT · 2 TRAP (spikes pop up ahead of the thief) · 3 ROAR (stops him for a moment)

**Race of two thieves:** you both run the same roofs (built from a shared seed), each chased by your own cat.
Your friend shows up as the blue thief. Whoever survives longer wins.

Devices connect through the free PeerJS server and then talk directly (WebRTC). In thief vs cat the thief's device
runs the game, so jumping never lags; the cat's screen draws it ~0.1 s late and interpolates, so it moves smoothly.
In a race each phone runs its own thief. Online play needs an internet connection, and both phones must run the
same version (the game checks).

## Install as an app (PWA)

The game is an installable Progressive Web App and works offline.

- **Android / Chrome / Edge:** open the link and tap **INSTALL APP** in the menu (or the browser's "Install app" / "Add to Home screen").
- **iPhone / iPad (Safari):** tap **Share → Add to Home Screen**.

When releasing a new version, bump `CACHE` in `sw.js` and `VERSION` in `index.html`.
