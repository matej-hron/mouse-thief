# Pixel Arcade

Pixel-art games to play alone or with a friend, on a phone or a computer. **Play:** https://matej-hron.github.io/mouse-thief/

The arcade (`index.html`) is the start screen: pick a game, and set **your name and avatar** (EDIT): all the games use them.

| Game | |
|---|---|
| **Mouse Thief** (`thief.html`) | You stole the cat's mouse "just for fun". She did not find it funny. Run! |
| **Pixel GP** (`racer.html`) | A pixel open-wheel racer that looks 3D: race 5 rivals, drive freely, or race a friend online. |
| **Pixel Heist** (`heist.html`) | A low-poly 3D city: rob 5 places, each harder and richer, and escape the police. Rob the bank to win. |

## Pixel Heist

A real 3D city (low-poly, drawn chunky like the other games), seen from behind your masked thief.

- **5 levels**, each one harder and with more expensive loot:
  1. Corner shop: the cash register ($500), on a sunny day, 1 police car.
  2. Jewelry store: the diamonds ($8,000), in the afternoon, 2 police cars.
  3. Art museum: the golden painting ($60,000), at sunset, 3 police cars and 2 guards.
  4. Gold shop: the gold bars ($250,000), at dusk, 4 police cars and 3 guards.
  5. **City bank**: the vault ($1,000,000), at night, 5 police cars and 4 guards. Rob the bank and you've **completed the game**.
- **A heist:** go to the yellow light, stand in the ring to grab the loot (that sets off the alarm), then get to your hideout
  (green light) before the police catch you. Half the loot is enough; staying longer gets you more, but the police get closer.
- **Cars:** get into any car (E, or the CAR button): your red sports car is parked by the hideout. Police rams break your car (CAR hearts).
- **Busted** if a police car gets you on foot, if they box your car in, or if a guard who saw you catches you.
  Guards walk around the building; don't step into their yellow light.
- Every heist pays ★ into the shared arcade wallet (more for more loot).
- Controls: WASD / arrows (up = forward, left/right = turn), E = car in/out, P = pause, M = music. On a phone: drag on the left half
  of the screen to move, and the CAR / OUT button. The music and the sound effects each have an on/off button.
- The 3D drawing uses [three.js](https://threejs.org) (MIT licence), kept in `vendor/`.

## Pixel GP

- **RACE:** you vs 5 rivals, 3 laps of the Pixel Ring. You start at the back of the grid.
- **FREE DRIVE:** no rivals, just drive and chase your best lap.
- **RACE A FRIEND:** CREATE GAME gives a 4-letter code, your friend joins with it (both phones need the same version).
  First over the line after 3 laps wins.
- Gas is automatic. Steer with ← / → (or the on-screen < >), brake with ↓ / Space (or BRAKE).
  The tight hairpin needs a brake; going off the road or hitting things slows you down.
- **Damage:** your car has 1 heart (ARMOR in the garage gives 2 or 3). Barrels, crates and cones on the road cost a heart, and so does crashing into
  trees, tire walls or billboards at speed. Oil slicks spin you around, wrenches repair a heart. No hearts left:
  **WRECKED!** (in a race with a friend, the friend wins). Obstacles change every race and come back every lap;
  a blinking SHARP TURN! warns you to brake.
- **Stars:** collect ★ on the road (once per race) and get a bonus for your place (1st ★15 … 6th ★2; online: win ★10,
  lose ★3). **The ★ wallet is shared** with Mouse Thief and shown in the arcade.
- **GARAGE:** abilities (NITRO and SHIELD buttons in the race, keys 1 / 2; ARMOR = 2-3 hearts; GRIP = less sliding in
  curves; MAGNET = grab stars from further away), 6 car designs and 12 paint colors (or your avatar's color).
- **Sound:** its own chiptune racing tune, a calmer one in the menus; the note button (title or pause menu) switches music off. The engine sound is **off** by default; the little car button next to it switches it on.
- Your car has your avatar's color unless you paint it. Best lap, best race and wins are saved on your phone.

---

## Mouse Thief

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
- **Your name:** SETTINGS → NAME (a nickname, 2–10 letters). Friends see it in multiplayer and on the leaderboard.
- **Leaderboard** (menu): you and every friend you've played online with, by most stars and by longest run. No server:
  phones swap names, stars and best times whenever they meet in multiplayer.
- **Mouse skins:** SHOP → SKINS, last page: dress up the mouse you carry (white, brown, zombie, robot, ninja, rainbow, golden).
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

Each game is a single HTML file (plus the shared `common.js`), no dependencies. Serve the folder via GitHub Pages.

## Multiplayer

MULTIPLAYER → CREATE GAME gives you a 4-letter code; your friend picks JOIN WITH A CODE and types it.
Pick a mode when creating the game (and change it any time in the lobby). All abilities are free, limited only by cooldowns.

**Thief vs cat:** one of you is the thief, the other is the cat (swap any time). The thief wins by surviving 60 seconds.

- Thief: jump / slide as usual, 1 FREEZE · 2 SPEED BOOST · 3 SHIELD
- Cat: tap / Space POUNCE · 1 SPRINT · 2 TRAP (spikes pop up ahead of the thief) · 3 ROAR (stops him for a moment)

**Bets:** in the lobby, set a bet with − / +; both players must tap I AGREE (same amount, enough stars). The bets
go in the pot when the round starts and the winner takes both. Leaving in the middle of a round counts as losing.
No betting in developer mode.

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

When releasing a new version, bump `CACHE` in `sw.js` and the game's `VERSION` (`thief.html` / `racer.html`; online play checks it).
