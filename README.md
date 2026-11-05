# Pixel Arcade

Pixel-art games to play alone or with a friend, on a phone or a computer. **Play:** https://matej-hron.github.io/mouse-thief/

The arcade (`index.html`) is the start screen: swipe (or scroll, or drag the slider on the right) through the games and pick one, and set **your name and avatar** (EDIT): all the games use them.

| Game | |
|---|---|
| **Mouse Thief** (`thief.html`) | You stole the cat's mouse "just for fun". She did not find it funny. Run! |
| **Pixel GP** (`racer.html`) | A pixel open-wheel racer that looks 3D: race 5 rivals, drive freely, or race a friend online. |
| **Pixel Heist** (`heist.html`) | A low-poly 3D city: rob 5 places, each harder and richer, and escape the police. Rob the bank to win. |
| **Pixel Pong** (`pong.html`) | Table tennis seen from above, with power-ups: play a bot, a random player, a friend online, or two players on one phone. |
| **Pixel Football** (`football.html`) | Retro side-on football, six a side. Run your club: a league, a squad, training, a transfer market. Play and trade with friends online. |
| **Pixel Hoops** (`hoops.html`) | Arcade basketball: pull back and let go to shoot. Every basket is +2 points. |
| **Pixel Wings** (`wings.html`) | An air battle seen from above: bomb the island air base or defend it, sink the enemy carrier, or dogfight. With bots, 2 on one screen, or up to 6 online. |

## Pixel Wings

An air battle seen from above. Your plane always flies forward: you steer it and set its speed. Each player's camera
follows their own plane, with a minimap in the corner and arrows pointing at what matters (your next target, the nearest bomber).

- **AIR RAID:** the attack (red) flies bombers and fighters in from the west at the island air base. The bombers must
  destroy the 6 targets (2 hangars, fuel depot, radar, control tower, ammo dump); their fighters escort them.
  The defense (blue) starts on the ground: fighters take off from the runway one after another and must shoot the
  bombers down, or hold out for 4 minutes. AA guns on the island fire flak at the raid. Bombs also wreck planes still
  waiting on the ground. While the hangars stand, they send out new fighters every 30 s. Lose the radar and the
  defense's minimap only shows enemies close by.
- **CARRIERS:** two fleets on open sea, each a carrier and two destroyers zig-zagging north and south. Sink the enemy
  carrier (or hurt it more in 4 minutes). Planes take off from the carrier's deck, and so do you after being shot down;
  a hurt carrier gets its planes up more slowly. Every ship has AA guns. **Torpedo planes** carry one torpedo (a new one
  every 6 s) that run straight through the water: aim ahead of the ship. Bombers can hit ships too (good against the
  destroyers). Half of each side's fighter bots guard their carrier, the other half escort their torpedo planes and bombers.
- **DOGFIGHT:** red fighters against blue fighters; everyone comes back after being shot down. First team to the
  kill target (10 / 15 / 25 by size), or most kills after 3 minutes, wins.
- **Planes:** fighters are fast and turn tightly (2 machine guns). Bombers are slow and tough, drop bombs
  (4 at a time, one comes back every 8 s; the bomb lands a bit ahead of the plane) and have a rear gunner that shoots
  at enemy fighters by itself. A hurt plane smokes.
- **Pilots and bots:** every human picks a role (ATTACK BOMBER, ATTACK FIGHTER, DEFENSE FIGHTER; in a dogfight RED or BLUE),
  so friends can fly together or against each other. Bots fill every other seat. SIZE (small / normal / big) and the bots'
  level (easy / normal / hard) are set before the battle. Shot down? You're back in 4 seconds (attack bombers have 2
  spare planes per human bomber pilot, then you fly a fighter).
- **Controls:** keys: arrows or WASD to steer, up / down = faster / slower, Space to fire (or drop bombs / torpedoes), P pauses.
  Phone: drag anywhere to point where to fly; hold + / − (above the FIRE button) for speed.
  Every battle starts with a short reminder of the controls for your device.
  Controller: left stick points where to fly, A or RT fires, LB / RB slower / faster.
- **2 PLAYERS, 1 SCREEN:** split screen. Player 1: WASD + Space, player 2: arrows + Enter (or two controllers; on a
  phone each one uses their half).
- **Online:** up to 6 players. One creates a game and gets a 4-letter code, the others join with it. The host's device runs
  the battle; the others send their controls and draw what the host sends (~0.1 s behind, smoothed).
  If a player leaves, a bot takes over their plane.
- **After a battle:** REMATCH starts the same battle again, SWAP SIDES swaps every pilot's side and starts it,
  SETUP goes back to the lobby.
- **Stars:** a win ★8, every kill ★1 (up to 10), every target you destroy or ship hit ★2.

## Pixel Hoops

Arcade basketball, seen from the side. **Every basket is +2 points.**

- **Shooting:** put your finger (or the mouse) anywhere, pull back like a slingshot and let go. The dots show where the
  ball starts to go, the bar over your player shows the power. You can have a few balls in the air at once.
- **TIME ATTACK:** 60 seconds, as many baskets as you can. The more you make, the further away you shoot from,
  and in the last 30 seconds the hoop moves up and down. 10 points = ★1 into the arcade wallet.
- **FREE SHOOT:** no clock and a longer aiming line, just shoot. Your baskets and shooting % are counted.
- No rim or backboard touched = **SWISH!** Three in a row and you're **ON FIRE**.
- P or Escape pauses.

## Game controllers

Every game works with a game controller (Xbox and others): on an Xbox open the arcade in the Edge browser, or connect a
controller to a PC or a phone. In the menus the stick or d-pad picks a button, A presses it, B goes back. The first time you
use a controller a little help box shows what each button does in that game; **Y** in the menus shows it again. On an Xbox the arcade goes full screen at the first click, because Edge only hands the controller to web games in full screen (otherwise the stick moves a mouse pointer).
`common.js` has the shared layer (`PX.Pad`): it turns the controller into the game's keyboard keys and moves between menu buttons.

## Pixel Football

A retro football game seen from the side, six a side, plus running your own club.

- **The match:** you control the player with the arrow over his head; control jumps to whoever is nearest the ball.
  With the ball: **PASS** (to the teammate you face) and **SHOOT** (hold to power up, let go to shoot; hold up or down to aim).
  Without it: **TACKLE** (a sliding tackle) and **SWITCH**. Running into the player with the ball can win it too.
  Keepers save (or not), the ball hits posts, and there are throw-ins, corners and goal kicks.
- **Controls:** phone: drag on the left to run; on the right, anywhere: **tap = pass** (without the ball: switch player),
  **swipe = shoot that way**, a faster swipe shoots harder (without the ball: a sliding tackle that way). The old buttons
  are still there: MY CLUB > PHONE > BUTTONS (or in the pause menu). Computer: arrows or WASD, X = pass,
  Z or Space = shoot, P = pause. Two players on one keyboard: WASD + C / V and arrows + . / (or K / L).
- **Game controllers** (Xbox and others; on an Xbox open the arcade in the Edge browser, or connect a controller to a PC or phone):
  left stick or d-pad runs, A = pass / tackle, B or X = shoot (hold for power) / switch, START = pause.
  In the menus the stick moves between buttons, A presses, B goes back. In 2 PLAYERS the second controller is player 2.
- **Your club:** a squad of 6 to 12 players with stats (pace, shooting, passing, defending, keeping), an age, a potential
  and a value. The top 6 in SQUAD play (GK, 2 defenders, 2 midfielders, 1 forward). Young players improve as they play;
  you can also pay to TRAIN players (3 sessions per round). Name your club and pick its kit in MY CLUB.
- **Computer level:** EASY, NORMAL or HARD, picked before each match. The computer's team runs slower, thinks slower, passes
  and shoots less accurately and tackles less on easier levels (EASY also helps your keeper and tackles a bit). EASY pays
  60% of the match money, HARD 130%.
- **League:** 8 clubs, 14 rounds. A win pays $1,500, a draw $700, a loss $300 (plus ★ into the arcade wallet).
  Prize money at the end of the season ($20,000 for the title, plus a trophy and ★50); then everyone gets a year older.
- **Transfers:** a new list of players for sale after every round (or pay $300 for a new list). Sell your players for 75% of their value.
- **Online:** a friend with a code, or a random player. In the lobby: PLAY A MATCH (your real squads against each other)
  or TRADE PLAYERS: pick players on both sides plus money, send the offer, the other player accepts or says no.
  There is no server, so trades only happen while both phones are connected, and each phone trusts the other.
- **2 players on this phone:** you play your club, player 2 picks a league club.

## Pixel Pong

Table tennis seen from above. Get the ball past the other bat to score; **first to 7 wins**.

- **Play a bot** (easy, normal or the mega bot), a **random player** online, a **friend online** (one makes a game and gets a
  4-letter code, the other joins with it), or **2 players on this phone** (each drags on their own half).
- Move your bat by dragging anywhere (keyboard: WASD or arrows; two players: WASD and arrows). Where the ball hits the bat
  aims it, and moving into the ball hits harder. The ball gets faster with every hit.
- **Power-ups**: every hit fills the yellow bar. SMASH (2): your next hit is super fast. CURVE (2): your next hit curves.
  BIG BAT (3): a bigger bat for 7 seconds. FREEZE (4): the other bat freezes for a moment. Keys 1 2 3 4 (player 2: 7 8 9 0).
- Wins pay ★ into the arcade wallet: 3 / 6 / 10 against the bots, 10 for winning online (2 for playing).
- Random players: the game looks for someone waiting in one of a few public "lobby" rooms, or waits in a free one.

## Pixel Heist

A 3D city crime story with blocky characters, real shadows and day turning into night. Max, the boss of a crew, gives you five jobs:

1. **Corner shop**: the cash ($500), on a sunny day.
2. **Jewelry store**: the diamonds ($8,000), in the afternoon, with a guard.
3. **Art museum**: the golden painting ($60,000), at sunset; the vault has a code.
4. **Gold shop**: the gold bars ($250,000), at dusk; code and lock.
5. **City bank**: the money ($1,000,000), at night, 5 guards and 5 police cars. Rob it and you're the new boss: **game complete**.

**A heist:** walk in through the front door, grab the bag, find the vault code on a yellow note (heists 3 to 5), type it on the
keypad, pick the lock pins (press when the line is in the green), fill the bag in the vault (half is enough, more is a bonus),
then get out before the police block the door and escape to the hideout (green light). Take any car in the street.

**The stun blaster:** people you zap fall down dizzy for 20 seconds, then get up angry and chase you. A shot in the air makes
everybody nearby put their hands up for 15 seconds. Shots, a wrong code or opening the vault set off the alarm; guards who see
you (their yellow light) do too. An angry person or a police car that catches you: **busted**.

**Controls:**
- Phone: the left stick (left half of the screen) only goes forward / back; the right stick (right half) turns you and the camera together (you always face where you look). In a car: left = gas / brake, right = steer. Buttons SHOOT, AIR, CAR/OUT, PICK.
- Computer: W/S to go forward / back, A/D (or the arrow keys) to turn, Space to shoot (and pick a pin), R to shoot in the air, E to get in or out of a car, digits for the code, P to pause.
- Music and sound effects each have an on/off button.

Every heist pays ★ into the shared arcade wallet. The 3D drawing uses [three.js](https://threejs.org) (MIT licence), kept in `vendor/`.

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

When releasing a new version, bump `CACHE` in `sw.js` and the game's `VERSION` (`thief.html` / `racer.html` / `pong.html` / `football.html` / `wings.html`; online play checks it).
