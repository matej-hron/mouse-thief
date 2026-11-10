# Pixel Arcade

Pixel-art games to play alone or with a friend, on a phone or a computer. **Play:** https://matej-hron.github.io/mouse-thief/

The arcade (`index.html`) is the start screen: swipe (or scroll, or drag the slider on the right) through the games and pick one, and set **your name and avatar** (EDIT): all the games use them.
**SEARCH** finds a game by name or word ("ball", "plane"...) and filters by category: ACTION, RACING, SPORTS, RUNNING,
PLANES, ONLINE, 2 PLAYERS (keys: `/` opens it; controller: X, LB / RB change the category). Installed, the app is called
**Pixel Arcade**, with a blue cat on black as its icon. The browser tab's icon is **your avatar** (and so is the icon
when you add the arcade to an iPhone's home screen after setting your avatar).
The **controller button** next to the ★ counter turns phones into game controllers for a big screen (see below).
In every game the pause button is two thick bars and the sound button a speaker (a red cross when the sound is off).
The **SETTINGS** button (the gear next to it; Y on a controller) has the **sound volume for all the games** (OFF / LOW /
MEDIUM / HIGH), full screen, your name and avatar, and the phone controllers.

| Game | |
|---|---|
| **Mouse Thief** (`thief.html`) | You stole the cat's mouse "just for fun". She did not find it funny. Run! |
| **Pixel GP** (`racer.html`) | A pixel open-wheel racer that looks 3D: race 5 rivals, drive freely, or race a friend online. |
| **Pixel Heist** (`heist.html`) | A low-poly 3D city: rob 5 places, each harder and richer, and escape the police. Rob the bank to win. |
| **Pixel Pong** (`pong.html`) | Table tennis seen from above, with power-ups: play a bot, a random player, a friend online, or two players on one phone. |
| **Pixel Football** (`football.html`) | Retro side-on football, six a side. Run your club: a league, a squad, training, a transfer market. Play and trade with friends online. |
| **Pixel Hoops** (`hoops.html`) | Arcade basketball that looks 3D: pull back and let go to shoot. Every basket is +2 points. |
| **Pixel Wings** (`wings.html`) | An air battle seen from above: bomb the island air base or defend it, sink the enemy carrier, or dogfight. With bots, 2 on one screen, or up to 6 online. |
| **Pixel Sky Run** (`skyrun.html`) | Parkour on the roofs of planes flying above the clouds. Jump, slide, switch planes, and don't let the officer catch you. |
| **Deep Catch** (`fish.html`) | Catch rare fish, avoid obstacles and upgrade your fishing equipment. Start with a wooden rod and work up to the legendary rod. |
| **Pixel Skate** (`skate.html`) | Skateboard racing through the city: race 5 rivals or a friend online, ollie, flip, grab, spin and grind. Tricks earn coins for new tricks and abilities. |
| **Pixel Ski** (`ski.html`) | A fast downhill adventure: 10 mountains with ramps, cliffs, boosts and an avalanche, flips, 3 stars per run, a shop full of abilities. Race a friend online. |
| **Pixel Box Fight** (`boxfight.html`) | Boxing in the ring: fight a bot, a friend online, or two players on one phone, with free power-ups. Win a fight: ★5. |
| **Pixel Bike Run** (`bike.html`) | Mountain biking over sunset hills in pixel silhouettes: flips and wheelies earn money for new bikes and abilities. 8 trails, free ride, race a friend online. |
| **Pixel Cook** (`cook.html`) | Cook meals to order with your own hands (drag, pour, roll, sprinkle), 1 minute for one meal: start with a cafe shop, then buy an ice cream shop, a pizza and a burger restaurant, a sushi bar and a luxury restaurant. With a tutorial. |
| **Pixel Runs** (`runs.html`) | Parkour over the rooftops: jump, slide, run up walls, ride zip lines and bounce through five city districts. Combos, missions, ranks, upgrades and runners to unlock. |

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
- **Planes:** fighters are fast and turn tightly (2 machine guns with 40 rounds: they come back slowly when you stop
  firing, and an empty gun takes 3 s to reload, so aim first and fire short bursts; bots do the same). Bombers are slow and tough, drop bombs
  (4 at a time, one comes back every 8 s; the bomb lands a bit ahead of the plane) and have a rear gunner that shoots
  at enemy fighters by itself. A hurt plane smokes.
- **Pilots and bots:** every human picks a role (ATTACK BOMBER, ATTACK FIGHTER, DEFENSE FIGHTER; in a dogfight RED or BLUE),
  so friends can fly together or against each other. Bots fill every other seat. SIZE (small / normal / big) and the bots'
  level (easy / normal / hard) are set before the battle. Shot down? You're back in 4 seconds (defenders come back on a
  reserve airstrip at the far end of the island, away from the targets; every new plane is protected, with a blinking
  ring, while it takes off and for 3 s after) (attack bombers have 2
  spare planes per human bomber pilot, then you fly a fighter).
- **GUNNERS** (air raid, alone or online, not on a split screen): pick GUNNER in the battle setup. Every bomber has two
  turrets: the **REAR GUN** (on top, behind the wings, looking back over the twin tail) and the **NOSE GUN** (in the glass
  nose, looking ahead). Both are drawn in 3D (`gunner.js`, three.js, at the game's pixel size). Switch to the other gun
  any time if nobody mans it: C (or E, or right click), the SWITCH button on a phone, Y on a controller.
  **Co-op:** online, gunners ride in the bombers of friends who picked ATTACK BOMBER: the rear guns first, then the nose
  guns, then bots' bombers (the setup shows who sits where: "STEPAK REAR OF ..."). So one pilot and two gunners is a
  full crew. The pilot flies top-down as usual (his gunners are listed under his health; the automatic rear gunner
  only shoots while nobody mans the rear gun); gunners see PILOT and the other gun's name. With no friend's bomber
  free, a bot flies yours (at the back of the raid, which starts closer to the island).
  Fighters dive in from above or climb at you from below, and some swing out ahead for a head-on pass (more often when
  someone mans the nose gun). Red brackets mark the fighters you can see, arrows at the edge the ones you can't, and
  a green diamond shows where to aim so your bullets meet the closest one (the sight turns green: FIRE!). The twin guns
  overheat: fire short bursts or they jam for 2 s (each turret has its own heat). If your bomber goes down you move to
  another bomber of the raid (back into your friend's as soon as he is flying again). Online, a gunner's phone flies
  his own bullets and decides what they hit, on what he sees (the host checks the hit makes sense), so the network
  delay doesn't spoil the aim.
  Aim: mouse (click to lock it, Esc pauses), arrows / WASD + Space, drag on a phone + FIRE, or a controller's stick + A.
  For this, every plane also has a height: bombers cruise lower than fighters, and the top-down game is unchanged.
- **Controls:** keys: arrows or WASD to steer, up / down = faster / slower, Space to fire (or drop bombs / torpedoes), P pauses.
  Phone: drag anywhere to point where to fly; hold + / − (above the FIRE button) for speed.
  Every battle starts with a short reminder of the controls for your device.
  Controller: left stick points where to fly, A or RT fires, LB / RB slower / faster.
- **Camera:** NORTH UP (the map stays put) or PLANE UP (your plane always points up and the world turns around it;
  steering is then left / right on every device, and on a phone you drag left or right of where you put your finger).
  Switch it on the title screen, in the pause menu, or with C during a battle. In plane up the minimap becomes a round
  navigation map around you that turns with you (N marks north).
- **2 PLAYERS, 1 SCREEN:** split screen. Player 1: WASD + Space, player 2: arrows + Enter (or two controllers; on a
  phone each one uses their half).
- **Online:** up to 6 players. One creates a game and gets a 4-letter code, the others join with it. The host's device runs
  the battle; the others send their controls and draw what the host sends (~0.1 s behind, smoothed).
  If a player leaves, a bot takes over their plane.
- **Intro** (the first time the game starts, and the INTRO button on the title screen; tap to skip): a narrator, then
  Captain Hawk and the Rookie talk on the radio about the battle for the Pixel Archipelago, while the camera flies over
  a raid and the carrier fleets playing out live. The voices are made by `tools/radio/intro.py`.
- **FLIGHT SCHOOL** (title screen; offered the first time you play): 7 short lessons, and the instructor flies with
  you and talks on the radio: 1. take-off (push the throttle), 2. turning (fly through rings), 3. speed (stay close to
  the instructor while he slows down and speeds up), 4. guns (3 drones), 5. bombing (practice targets with the bomb
  sight), 6. torpedo (a moving target ship), 7. a first dogfight against an easy enemy. A banner says what to do with
  your device's controls. ★5 for each lesson the first time, ★1 after that.
- **Help for bombers and torpedo planes:** blinking yellow markers with names on every target (or enemy ship) still
  standing, a **bomb sight** (where your bombs will land; green with DROP! when it's on a target), a **torpedo sight**
  (the torpedo's path; green with FIRE! when it will meet the moving ship), the distance on the target arrow, blinking
  targets on the minimap, and a briefing on the radio at the start.
- **Radio:** pilots and command talk to their own side over the radio (bottom left, with a voice): bombers starting
  their run, bombs or torpedo away, targets destroyed, "taking fire, need fighter cover!" (the nearest fighter answers
  and comes; a HELP arrow and a blinking box show you where), "bandit on my tail!", "I'm hit, going down!", the carrier
  being hit, one minute left. Bots have callsigns (EAGLE, LANCER, VIPER, HAMMER, SHARK, DOLPHIN), humans use their name.
  The voices are recorded with the free [Piper](https://github.com/rhasspy/piper) voices and filtered to sound like
  an old radio (`radio/*.mp3`, about 0.5 MB; `tools/radio/` makes them, the lines are in `tools/radio/lines.py`); VOICE OFF (title screen or pause menu) gives wordless radio chatter instead.
  Big news (a target destroyed, a ship hit or sunk, one minute left) flashes in the middle of the screen.
- **Stats:** your kills and how often you were shot down are under your health during a battle; your career (battles,
  wins, planes shot down, times shot down, medals) is on the title screen.
- **After the battle, a scene** (tap to go on; SCENES ON / OFF on the title screen): win and your pilot gets a medal
  from the general (BRONZE STAR, SILVER WINGS for 2+ kills or hits, ACE PILOT for 5+ kills) with a fanfare and confetti;
  lose and there's a memorial stone with your name, flowers, a flag at half mast and a missing-man fly-over (good news:
  you parachuted out). Both show your stats.
- **After a battle:** REMATCH starts the same battle again, SWAP SIDES swaps every pilot's side and starts it,
  SETUP goes back to the lobby.
- **Stars:** a win ★8, every kill ★1 (up to 10), every target you destroy or ship hit ★2.

## Pixel Hoops

Arcade basketball. It's drawn flat in 2D, but the court, the hoop and the ball are in 3D and the camera looks over your
player's shoulder at the hoop, with everything drawn in perspective, so it looks 3D (like Pixel GP). **Every basket is +2 points.**

- **Shooting:** put your finger (or the mouse) anywhere, pull down like a slingshot and let go. Pull further for a
  harder throw, and sideways to aim the other way (a small wobble sideways doesn't count). The power bar next to your
  player has a **green zone** (about half a pull): let go in it and the throw has just the right power, from any spot.
  The dots show where the ball starts to go. You can have a few balls in the air at once.
- **The camera:** after every shot you get a new spot somewhere around the hoop, and the camera glides around the
  court to stand behind you again. The crowd jumps when you score.
- **TIME ATTACK:** 60 seconds, as many baskets as you can. The more you make, the further away you shoot from,
  and in the last 30 seconds the hoop slides slowly left and right (your throw aims where it will be). 10 points = ★1 into the arcade wallet.
- **FREE SHOOT:** no clock and a longer aiming line, just shoot. Your baskets and shooting % are counted.
- No rim or backboard touched = **SWISH!** Three in a row and you're **ON FIRE**.
- P or Escape pauses.

## Deep Catch

A fishing game seen from the side: you sit in your boat, the hook sinks into the deep sea.

- **Fishing:** CAST, and the hook sinks to the bottom of the sea. Steer it left and right: drag your finger (the hook
  follows it), arrows / A D, or the stick. Touch a fish and it bites, and the hook reels up to the boat (REEL UP, Space
  or A brings an empty hook back early). A fish on the hook fights and pulls it sideways; the rarer and bigger the fish,
  the harder. Back at the boat the fish goes into your cooler.
- **Obstacles:** jellyfish, old boots, sea urchins, sharks and sea mines (deeper down: more sharks and mines). Each hit
  hurts your line (the hearts); with none left the line snaps and the fish gets away. A big fish on the hook is easier to bump.
- **Your cooler and the FISH MARKET:** caught fish aren't sold right away: they go into your **cooler** (15 fish; bigger
  coolers in the shop hold 40, 100 or 300). Sell them at the **MARKET**, where every kind of fish has a price that
  changes **every 10 minutes**, like a stock: x0.3 at a bad time, up to x3 at a great one. Each fish has a chart of its
  last 4 hours, the price now and how much it went up or down since the last change, and a countdown to the next prices. SELL 1 sells
  your best one of that kind, SELL ALL all of them, SELL EVERYTHING the whole cooler. The prices come from the clock,
  so they're the same on every device. Cooler full? The catch screen lets you sell that fish right away or throw it back.
- **Rarity:** BAD FISH (worth 1-3 coins), RARE, SUPER RARE, EPIC, MYTHIC and LEGENDARY (500-750 coins), before the market price.
  Rarer fish swim deeper and faster, and they sparkle. Epic ★1, mythic ★2, legendary ★5 into the arcade wallet.
- **THE MASSIVE ONE:** once in every 20 minutes (the same moment for everyone, from the clock) an absolutely massive
  **ORCA** or **WHALE** swims through the sea for 2½ minutes, in whatever world you're in. It's worth 1500-2500 coins
  (times the world's money, and it never sells below x0.8 at the market) and ★10. It's huge, easy to hook and very hard to land:
  it pulls hard, reels in slowly and is big enough to bump into things. A banner says where it is and how long it stays,
  the depth gauge blinks where it swims, and the title and fishing screens count down to the next one. One per 20 minutes.
- **Variants:** a few fish come in rare colours, worth a lot more: **ALBINO** (5% of fish, x2), **SHADOW** (3%, x3)
  and **SHINY GOLD** (1.5%, x6, it glitters). Any fish can be one, even the massive orca or whale. The fish book marks
  the variants you've caught with little coloured squares.
- **Sizes:** every fish has a random size: TINY (x0.5 money), SMALL (x0.75), NORMAL, BIG (x1.5), HUGE (x2.2) or GIANT
  (x3.5, rare). Bigger fish look bigger, weigh more (shown in kg), sell for more and pull harder.
- **Worlds:** unlock deeper seas with coins. Deeper = more money for every fish and more **luck**, but more obstacles and
  faster sharks. Luck multiplies every rarity chance of your rod and the chance of the rare colours (a 0% stays 0%,
  and nothing goes over 95%); the shop shows your rod's chances in the world you're in.
  The hook sinks and reels faster in deeper worlds.

  | World | Depth | Money | Luck | Unlock |
  |---|---|---|---|---|
  | Sunny Bay | 90 m | x1 | x0.75 | (start) |
  | Coral Reef | 150 m | x2 | x1 | 5000 |
  | Frozen Sea | 220 m | x4 | x1.25 | 30000 |
  | Volcano Deep | 300 m | x7 | x1.5 | 150000 |
  | The Abyss | 400 m | x12 | x1.8 | 600000 |

- **Rods:** the rod decides which fish swim around you. Each rarity's chance is tried from the rarest down, and
  if none comes up it's a bad fish (these are the chances at luck x1; the world's luck changes them):

  | Rod | Price | Legendary | Mythic | Epic | Super rare | Rare |
  |---|---|---|---|---|---|---|
  | Wooden | (you start with it) | 0% | 5% | 10% | 40% | 70% |
  | Steel | 6000 | 8% | 15% | 25% | 30% | 40% |
  | Iron | 50000 | 15% | 25% | 30% | 20% | 30% |
  | Legendary | 250000 | 30% | 35% | 40% | 50% | 60% |

- **★ Exchange** (on the title screen and in the market): swap the arcade's ★ stars (shared with all the games) for
  coins, ★1 = 50 coins, or buy stars with coins, 250 coins = ★1.
- **Shop:** buy and equip rods, faster **reels** (1500 / 12000 / 80000), stronger **lines**: 3, 4 or 6 hits
  (1200 / 10000 / 70000) and bigger **coolers**: 40, 100 or 300 fish (3000 / 25000 / 150000).
  **Hooks** catch several fish in one cast: DOUBLE HOOK (2 fish, 8000), TRIPLE HOOK (3, 40000), MEGA RIG (5, 200000).
  With more hooks the line keeps going after a bite and only reels up by itself once every hook has a fish (REEL UP
  brings it back sooner; a massive one takes the whole line). Each fish gets its own catch card. More fish on the line
  pull harder and are easier to bump into things.
- **Fish book:** all 32 fish (5 of each rarity plus the massive orca and whale, on 2 pages), how many of each you caught and the biggest one.
- P or Escape pauses. Coins, gear, worlds and the fish book are saved on the device.

## Pixel Skate

Skateboard racing, seen from the side, on a city sidewalk. Race 5 rivals (ZIGGY, LOLA, DUKE, PIP and MAX RAD) to the finish line.

- **Controls:** hold PUSH (→ / D, controller RT) to push and go faster, ← / A brakes. JUMP (Space / ↑, A) jumps (an ollie); with
  DOUBLE JUMP press it again in the air. In the air: **FLIP** (J), **GRAB** (K), **SPIN** (L) (controller X, Y, B).
  BOOST (E / Shift, RB), TIME WARP (Q, LB). Every action has a button with a pixel icon at the bottom of the screen (tap them on a phone; a tap anywhere else is a jump too). FLIP, GRAB and SPIN show the icon of the trick you picked in the shop.
- **Tricks pay:** land a trick and you get coins, a burst of speed and BOOST. Several tricks (and grinds) in one jump are
  a **combo**: the points are multiplied by the number of tricks. Land in the middle of a trick (or hit a cone or a bench)
  and you **bail**: you fall and lose speed.
- **The street:** cones and benches to ollie over, kickers (ramps that launch you), funboxes, rails and benches to
  **grind** (land on them from above), green boost pads and coins (2 each).
- **SKATE SHOP:** buy tricks with coins, 10 of each kind (two pages: PAGE 2 has TRIPLE FLIP, ROCKET AIR, CORK 720, the 1440 SPIN and more), and pick the one each button does. Better tricks score more but
  take longer, so they need bigger air. **Abilities:** FAST WHEELS (top speed), SUPER JUMP, NITRO (stronger boost),
  COIN MAGNET, DOUBLE JUMP, NO-BAIL SHIELD, TIME WARP. **SHIELD** (no bails for 6 s), **MAGNET** (all coins fly to you
  for 8 s) and **WARP** (your rivals slow down for 4 s) are buttons with icons at the top right of the race, used 1-3 times
  a race by level (keys R, F, Q; controller DOWN, LT, LB). The abilities that always work (fast wheels, super jump,
  double jump, nitro) show as little icons under your place.
- **Tracks:** CITY STREETS (1200 m, easy), SUNSET PARK (1600 m) and NEON NIGHT (2000 m, hard). Finish in the top 3 to
  unlock the next one. Prize for the place (more on harder tracks); ★3 for a win, ★2 for 2nd, ★1 for 3rd.
- **RACE A FRIEND:** online. CREATE GAME gives a 4-letter code, your friend joins with it (both need the same version).
  The host picks the track (all 3 are open online). You see your friend's skater and their tricks; first to the finish
  wins (win: 120 coins and ★3, lose: 40 coins and ★1). The host can start a REMATCH or pick ANOTHER TRACK.
- **FREE SKATE:** an endless skatepark with no rivals: skate and do whatever you want. Every 400 coins in a session = ★1 (up to ★3).
  Time warp there is slow motion.
- Coins, tricks, abilities and best places are saved on your phone.

## Pixel Bike Run

Mountain biking, seen from the side, over layered pixel silhouettes of hills at sunset (and misty pines, a golden
meadow, autumn, night, snow, a volcano and the aurora). The bike is a little physics model (two wheels and the rider,
held together by springs), so it rolls, bounces, wheelies and flips for real.

- **Controls:** touch: GAS (big green) and BRAKE (red) on the right, LEAN BACK and LEAN FORWARD on the left (a thumb can
  slide between buttons), NITRO above GAS. Keys: ↑ / W gas, ↓ / S brake, ← → / A D lean, Space nitro, P pause.
  Controller: left stick lean, RT / A gas, LT / B brake, X nitro.
- **Tricks pay money:** lean in the air to flip: a BACKFLIP $100, a FRONTFLIP $130, a DOUBLE pays 4x, a TRIPLE 9x. Land
  with both wheels at once for a PERFECT landing (x1.5). WHEELIE (lean back with gas: it holds at its balance point)
  $15 every half second, BIG AIR, and $10 notes along the trail. Landing tricks in a row builds a COMBO (+25% each).
  Land on your head and you crash.
- **TRAILS:** 8 trails (600-1370 m), each harder: kickers, gaps to fly over (fall in and you crash), cliff drops,
  tables, rollers and climbs. Finish one to open the next. 3 stars each: finish, earn the trick money goal, beat par.
  New stars pay ★1; finishing pays a bonus.
- **FREE RIDE (farm money):** an endless trail; a crash just puts you back at the last checkpoint. QUIT banks your money.
- **BIKE SHOP:** BIKES: TRAIL BIKE, BMX (flips fast), ENDURO, FAT BIKE (grip, climbs), DOWNHILL (speed), ROCKET, GOLDEN
  BIKE. ABILITIES: POWER PEDALS, FLIP SPIN, TRICK CASH (+20% a level), NITRO, SECOND CHANCE (keep going after a crash on
  a trail), MONEY MAGNET.
- **RACE A FRIEND** (online): CREATE GAME gives a 4-letter code, your friend joins with it (same version). The host picks
  the trail (all open online). You see your friend as a ghost; a crash puts you back at the last checkpoint. First to
  the finish wins ($500 and ★2; the other gets $200). REMATCH or OTHER TRAIL.

## Pixel Cook

You are the chef. A customer walks in and orders (say, a pizza with mozzarella); the order ticket pops up on the left
with the meal and every step. The ingredients are on the shelf on the right, and you cook with your own hands on the
table in the middle. **You have 1 minute for one meal**, and the faster you are, the bigger the tip.

- **Your hands:** DRAG an ingredient from the shelf onto the meal. Some things you keep moving: rub the ROLL PIN over
  the dough until it is flat, spread the SAUCE, pour the MILK, squeeze the KETCHUP, and sprinkle toppings (mozzarella,
  salami, cocoa, truffle...) piece by piece: they land where your finger is, so every pizza is your own.
- **Cooking:** drag the CUP to the coffee machine, the PATTY to the grill, the STEAK to the pan, or the whole PIZZA
  into the oven. A bar runs from RAW to BURNT: tap anywhere in the green zone (the gold middle is PERFECT, a bigger
  tip). Too late and it is burnt (or the coffee spills): make a new one.
- **Serving:** drag the finished meal to the customer. Drag it to the BIN to start over.
- **Money:** every meal pays its price and a tip. A wrong ingredient or burnt food makes the tip smaller. Too slow
  (1 minute) and the customer leaves; three of those and you close early. A shift is 4-8 customers and pays ★1
  (★2 with every meal served and no mistakes). Finishing shifts puts new meals on the menu. Meals in a row without a
  mistake build a STREAK (+10% tip each, up to +50%), and every meal gets a rating of 1-3 stars on its ticket.
- **RESTAURANTS** (6, each much dearer than the last): the CAFE SHOP (coffee, cappuccino, croissants and muffins),
  the ICE CREAM SHOP ($250: bake the cone, stack the scoops, add syrup, sprinkles and a cherry), the PIZZA RESTAURANT
  ($900, pizzas made from new dough), the BURGER RESTAURANT ($2400: stacked in the order on the ticket), the SUSHI BAR
  ($6000: nori, rice from the rice cooker, fish, roll it up with the mat) and the LUXURY RESTAURANT ($15000: steak,
  lobster, truffle pasta and golden cake on a plate, $240-500).
- **UPGRADES** (for all your restaurants): KITCHEN TIMER (a longer green zone), TURBO STOVE (cooks faster), TIP JAR
  (+25% tips a level), FANCY MENU (+15% prices a level), and the GOLDEN CHEF HAT for the richest chef in town.
- **Learning by doing (no pages to read):** new players make their first coffee with a coach: a chef bear who says one
  or two words (PUT IT IN! WAIT... NOW! TAP! POUR! SERVE IT!) while a hand shows the move, with the clock stopped. The
  coach also helps with the first order in every new restaurant.
- **COOKING SCHOOL:** every meal of your restaurants as a recipe in pictures. LEARN one and you cook it with the coach
  and no clock; you get a medal and the meal's price the first time.
- **REAL LIFE:** the school also teaches real cooking. Every meal has a REAL RECIPE sheet in big print, a few steps on a
  page (what you need, each step with
  its real time and temperature: a pizza bakes 8-12 minutes at 250 C, a burger patty 3-4 minutes a side, sushi rice
  simmers 12-15 minutes...), and while you cook a lesson a REAL LIFE line shows the fact for the step you are doing.
- **Controls:** touch or mouse: drag. Keys: any key takes it out of the oven, P pause. Controller: the stick moves
  a hand, hold A to grab and let go to drop, A takes it out of the oven.

## Pixel Runs

Parkour over the rooftops, seen from the side. Your runner (with your avatar's head) runs alone and gets faster; you
only choose when to jump and when to slide.

- **Controls:** touch: a round JUMP button on the right (hold for a higher, longer jump) and a SLIDE button on the left
  (in the air: a dive); the whole half of the screen around each button counts, so you cannot miss. Keys: Space / ↑ / W jump, ↓ / S slide, P pause. Controller: A jump, B slide.
- **Moves:** jump at a wall (the yellow marks) and you RUN UP it. Land on a box to STOMP it. Slide under SLIDE / DUCK
  signs. ZIP LINES carry you over the wide streets, pink TRAMPOLINES throw you high. A jump from the very last step and
  a landing on the very edge pay extra.
- **COMBO:** moves done one after another (within 2 s) multiply their points, up to x9.
- **The city changes every 500 m:** SUNSET CITY, NEON NIGHT, SNOW TOWN, STORM FRONT, DAWN HARBOR, and round again, faster.
- **MISSIONS:** three at a time (run 500 m in one run, slide under 15 signs, make a x4 combo...). A finished mission
  pays coins and is replaced by a harder one; every 3 missions raise your RANK (ROOKIE up to CITY LEGEND, ★2 each).
- **Power-ups on the roofs:** MAGNET, SHIELD (one free crash), COINS X2.
- **SHOP:** UPGRADES (DOUBLE JUMP, POWER TIME, HEAD START with a shield, LONG ARMS) and 7 RUNNERS with their own trail. Everyone starts as the
  ALL WHITE runner: white from head to toe, with your avatar's head in white.
- **Crash or fall:** once a run you can KEEP RUNNING for 60 coins. A run pays ★1 for every 250 m.
- **The first run** teaches by doing: the next move is named and time runs slower near it.

## Pixel Box Fight

Boxing in the ring, seen from the side. Your avatar is your boxer's head. Knock the other boxer out (or have more
health when the 45 seconds run out): **best of 3 rounds**.

- **Fight a bot** (easy, normal or the mega bot), a **friend online** (one makes a game and gets a 4-letter code, the
  other joins with it), or **2 players on this phone** (each player has their own half of the screen).
- **Controls:** ◀ ▶ move, PUNCH, hold BLOCK (a block stops almost all of a punch). Keys: A D move, W punch, S block,
  1 2 3 4 power-ups (2 players: player 2 uses the arrows, up = punch, down = block, and 7 8 9 0). Controller: stick
  moves, A / RT punch, B / LT block, X Y LB RB power-ups.
- **Power-ups are free** (like in Pixel Pong): landing punches (and blocking) fills the yellow bar, and it also fills
  slowly by itself. UPPERCUT (2): your next punch is a big uppercut that breaks through a block. DASH (2): rush in and
  punch. SHIELD (3): no damage for 4 seconds. STUN (4): the other boxer sees stars and can't move for a moment.
- **Stars:** win a fight against a bot or a friend online: ★5. Lose: you lose nothing (and win nothing).
  2 players on one phone is just for fun (no stars).

## Pixel Ski

A fast downhill skiing adventure, seen from behind the skier: the slope is drawn in perspective and really drops away
in front of you (the valley far below). **Survive to the bottom:** hit a tree, a rock, a snowman, a log, a gate pole,
another skier, a snowball or the red safety net, fall in a crevasse, land a flip on your head or let the avalanche catch
you, and the run is over.

- **Controls** (pixel versions of a phone ski game's): the slider at the bottom left **steers**; the standing slider on
  the right sets your **speed** (up: tuck, faster; down: brake); the **JUMP** button next to it jumps (a tap in the
  middle of the screen jumps too). **In the air, JUMP again does a FLIP**: land it for coins (more flips in one jump pay
  much more) and a burst of speed; land in the middle of one and you crash. TURBO and SLOW-MO buttons (from the shop)
  sit above the steering slider. Keys: ← → / A D steer, ↑ / W tuck, ↓ / S brake, Space jump / flip, E turbo, Q slow-mo,
  P pause. Controller: left stick, A jump, RT tuck, LT / B brake, X turbo, Y slow-mo, START pause.
- **Fast:** you push off at 70+ KM/H and never drop below that unless you brake; tuck down the steep bits for 150-250
  KM/H. Speed lines, camera shake on hard landings, ski tracks in the snow.
- **10 mountains, 3 runs each** (GREEN, RED, BLACK; later mountains are bigger and harder). Every mountain has its own
  downhill thing, and they all have some of everything: SNOWY MEADOW (big ramps), PINE FOREST (fallen trees),
  NIGHT RACE (boost pads), FROZEN LAKE (ice sheets), SUNSET RIDGE (cliff drops), BLIZZARD PASS (rolling snowballs),
  ICE CANYON (ice and cliffs), VOLCANO SLOPE (lava boulders), AURORA PEAK (big jumps and boosts), THE SUMMIT (avalanche!).
  - **Big ramps** throw you high in the air past a line of coins in the sky. **Boost pads** (yellow) shoot you forward.
    **Cliff drops**: the slope falls away and you fly. **Jump lines**: a row of ramps, then a crevasse to fly over.
    **Ice sheets**: slippery and very fast. **Snowballs / lava boulders** roll across the slope.
  - **The avalanche** chases you on every BLACK run and on all of THE SUMMIT: it stays ~150 m behind and catches you
    if you slow down (brake, deep snow, a crash saved by the helmet).
- **3 stars per run:** get down, grab 60% of the coins, beat the PAR time (shown under the clock). Every new star pays
  ★1 and coins. 90 stars in all: 30 unlock the STAR skis, 60 the CROWN.
- **DAILY BONUS:** your first finish of the day pays double coins.
- Finish GREEN to open RED, RED to open BLACK, BLACK to open the next mountain. Best times are saved.
- **SKI SHOP:** UPGRADES (FAST SKIS, PUSH START, SHARP EDGES, BIG AIR, COIN MAGNET), ABILITIES (SUPER JUMP: jump over
  snowmen; DOUBLE JUMP; TRICK MASTER: faster flips, more coins; TURBO; SLOW-MO; HARD HELMET: survive crashes) and LOOKS
  (ski and helmet colors, up to RAINBOW, CHROME, and the star rewards).
- **RACE A FRIEND** (online): CREATE GAME gives a 4-letter code, your friend joins with it (both need the same version).
  The host picks the mountain and the run (all of them are open online). You both ski the same run and see each other
  (a ghost: you can't collide), with your friend's place on the progress bar and how far ahead or behind they are.
  First to the bottom wins (★2 and 60 coins; the loser gets 25 coins); crash and you're out, and if you both crash,
  whoever got further wins. The host can start a REMATCH or pick ANOTHER RUN. No pausing online.

## First of the month update

Only on the **1st of every month** (January 1, February 1, ... December 1): the first time you open the arcade that
day, the **FIRST OF THE MONTH UPDATE** pops up and gives everyone a free **COW** avatar (press OKAY, then pick it in
EDIT). On any other day there's no update. The gift is `MONTHLY_GIFT` in `index.html`; gift avatars are in
`GIFT_SHAPES` in `common.js` and only show in the avatar picker once you have them.

## Pixel Sky Run

Three lines of planes fly side by side above the clouds. You are a boy doing parkour along their roofs, and an officer is
chasing you. It's drawn flat in 2D, but the camera sits behind you and everything is drawn in perspective, so it looks 3D.

- **Controls:** swipe LEFT / RIGHT to jump to the next plane over, UP to jump, DOWN to slide (in the air DOWN dives
  back down). Keyboard: arrows or WASD (Space jumps). A game controller works too.
- **Planes:** each line of planes has gaps between them: jump them, or you fall (with a parachute). The tail fin at the
  start of a plane you vault over by yourself. The game gets faster the longer you run.
- **Obstacles on the roofs:** suitcase crates (jump over them or land on top), red and white bars (slide under them) and
  big cargo boxes (switch planes, running into one ends the run).
- **The officer:** hit a crate or a bar, or bump into something from the side, and you stumble: he catches up and stays close
  for 5 seconds ("CAREFUL!"). Stumble again while he's close and he catches you.
- **Power-ups on the roofs:** JETPACK (fly high above the planes over a line of coins), MAGNET (pulls coins in), 2X COINS.
- **Coins and UPGRADES:** coins are saved; spend them in UPGRADES to make each power-up last longer (4 levels).
  Every 400 m is ★1 into the arcade wallet.
- P or Escape pauses.

## Game controllers

Every game works with a game controller (Xbox and others): on an Xbox open the arcade in the Edge browser, or connect a
controller to a PC or a phone. In the menus the stick or d-pad picks a button, A presses it, B goes back. No help box
pops up by itself; **VIEW** shows what each button does in that game. On an Xbox the arcade goes full screen at the first click, because Edge only hands the controller to web games in full screen (otherwise the stick moves a mouse pointer).
`common.js` has the shared layer (`PX.Pad`): it turns the controller into the game's keyboard keys and moves between menu buttons.

### Your phone as a controller

Play on an Xbox, a TV or a computer, with phones as the controllers (up to 4):

1. On the big screen open the arcade, press the **controller button** next to the ★ (or RB on a controller) and
   **SHOW CODE**. It shows a 4-letter code and a QR code.
2. On the phone open the arcade, press the same button and **BE A CONTROLLER** (`pad.html`), and type the code
   (or just scan the QR code).
3. Pick a game on the big screen (with the phone). Every game shows **its own buttons** on the phone, with what each
   one does (Pixel GP: steer, GAS, BRAKE, NITRO, SHIELD; Pixel Wings: stick, FIRE, SLOWER / FASTER; Mouse Thief:
   JUMP, SLIDE and the abilities...), and in the menus a d-pad with OK / BACK. The ❚❚ button pauses.

The phones stay connected when the big screen changes game (they reconnect by themselves in a second or two), and
the first phone is controller 1 (a real controller on the Xbox becomes the next one). Each phone keeps its number when
the game changes, whichever phone reconnects first (a phone that isn't back yet keeps its place for 10 seconds), and a
phone can't end up connected twice. How it works: the big screen
gets a PeerJS id from the code (`PX.Remote` in `common.js`, kept in the tab's `sessionStorage`), each phone sends
what's pressed, and the phone appears in `navigator.getGamepads()` like any controller, so every game works with it.
The screen tells the phone which buttons to show: each game's `PX.Pad.setup({ phone: { stick, dpad, touch, buttons } })`
(`touch`: a touch pad instead of the stick; the game reads where the finger is as `touch` { x, y } in `onPlay`).
Needs an internet connection on both (the same free PeerJS server as online play). The QR code is made by
`vendor/qrcode.js` (qrcode-generator, MIT). PeerJS itself is kept in `vendor/peerjs.min.js` (MIT), with two CDNs as backups.
If the phone can't reach the server or can't link to the screen, it says so (with what to try) and keeps retrying.

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
- Move your bat by dragging anywhere (keyboard: WASD or arrows; two players: WASD and arrows). With a phone as the
  controller for a big screen, the phone's left side is a **touch pad**, a little map of where your bat can go: touch a spot and the bat goes
  there, just like playing on a tablet (the power-ups are the buttons on the right). Where the ball hits the bat
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
- **Hold GAS to drive** (↑ / W, the on-screen GAS, or A / RT on a controller): the car doesn't move until you do, and
  rolls slower when you let go. Steer with ← / → (or the on-screen < >), brake with ↓ / Space (or BRAKE).
- **Gestures (phone):** drag a finger left or right anywhere on the screen (not on a button) to steer: the further you
  drag, the harder you turn. A quick swipe up fires NITRO, a swipe down raises the SHIELD.
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

When releasing a new version, bump `CACHE` in `sw.js` and the game's `VERSION` (`thief.html` / `racer.html` / `pong.html` / `football.html` / `wings.html` / `skyrun.html` / `fish.html` / `skate.html` / `ski.html` / `boxfight.html` / `bike.html` / `cook.html` / `runs.html`; online play checks it).
