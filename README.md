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
- **Boss fights:** every now and then the roof turns flat, the run stops and a boss drops in. Bosses take turns:
  **Bossy Cat** (swishes her tail), **Bossy Dog** (throws bones) and **Bossy Rat** (throws cheese). Low attack along the
  roof: **jump**. High attack at head height: **slide**. Survive 30 seconds to win (+10 ★ bonus, more for every next boss
  in the same run). First boss after 50 s, then 75 s of running between fights. The HUD counts down to the next boss.
  Also in the multiplayer race (same spot and same attacks for both thieves, no ★ bonus); not in thief vs cat or the tutorial.
- **Heaven (secret):** climb a slide bar all the way to the top (keep wall-jumping on it) and you end up in heaven:
  clouds to jump on, halos, pearly gates. After 50 seconds **Bossy Devil** attacks with fireballs. Beat him and choose:
  stay in heaven or go back to the roofs.
- **Shop abilities** have 4 upgrade tiers. New: **TRIPLE JUMP** (passive: one more air jump; tier 4 = quadruple jump,
  ★1100) and **LUCKY CLOVER** (passive: up to 3x more pickups). Tier 4: Freeze 2 uses (★270), Cat Slowdown rage only
  +5% (★350). Prices went up in 1.11; tiers you already bought stay yours.
- **Heaven** has little flying devils instead of pigeons.
- **Music shop** (SHOP → MUSIC): buy songs and pick one as the music for your runs (TRY to listen first; switch songs
  in the pause menu too): Sunny Days, Moonwalk Funk and Wub Wub (originals), Flight of the Bumblebee, Bach's Toccata,
  Ride of the Valkyries, Beethoven's 5th, Vivaldi's Summer storm, Dvořák's Going Home,
  In the Hall of the Mountain King, Can-Can,
  Korobeiniki, Ode to Joy, Jingle Bells (★300–450 each). Boss fights keep their own music (Bossy Devil fights to a faster Toccata).
- **Shields** are used up: buy them one by one (★50, up to 9); each one you raise is gone for good.
- **Skins:** buy new looks for your thief in SHOP → SKINS, or unlock MY SKIN (★150) and design your own
  (body color, eye color, stripes or spots).
- **Famous looks:** THE KING, POP DIVA, FOOTBALL STAR, ROCK STAR and MOVIE STAR skins (page 2 of SKINS).
- **PIXEL ART skin** (★150): paint every pixel of your thief yourself; the running, jumping and sliding poses follow your drawing.
- **Move the buttons:** SETTINGS → MOVE BUTTONS lets you drag JUMP, SLIDE and the superpowers wherever you like (RESET puts them back).
- **More dangers as you go:** from ~20 s **pigeons** fly at you (low: jump, at head height: slide); from ~30 s **flower pots**
  fall from above (watch the shadow) and smash into pieces you have to jump.
- **Pickups** (rare, in risky spots: over spikes, gaps, on towers): **❤ extra life** (when she catches you, she gets
  knocked away instead), **wings** (6 s of flying: tap to flap), **catnip** (the cat rolls around for a few seconds).
- **Trap hints:** hidden pop-up spikes are marked with a red X, invisible walls have a red outline. (No more fake floors.)
- **End scenes:** when she catches you, a short scene plays before the results, a different one each time:
  the cat jumping on your grave and meowing, lapping milk on it, peeing on it, napping on it, sharpening her claws
  on your tombstone, throwing a party, or winning Cat of the Year. Tap or press a key to skip; turn it off in
  SETTINGS → END SCENE.
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
