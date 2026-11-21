#!/usr/bin/env python3
"""Builds shorts/ (the Weird History Toons gallery: shorts/index.html and one page per video) from SHORTS below.
usage: python3 tools/shorts/build.py   (run from the repo root; the videos and posters are in shorts/media/<slug>.mp4/.jpg)
Add a video: put <slug>.mp4 (1080x1920, H.264, +faststart) and <slug>.jpg (poster) in shorts/media/, add an entry, run it."""
import html, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2] / "shorts"

SHORTS = [
    {
        "slug": "pig-war", "title": "The Pig War", "year": "1859", "place": "San Juan Island, Pacific Northwest",
        "teaser": "America and Britain nearly went to war over a pig that ate some potatoes.",
        "body": [
            ("p", "In 1859 nobody was sure who owned San Juan Island, between Vancouver Island and what is now Washington State. A treaty had set the border along the water channel between the US and British territory, but there were two channels, one on each side of the island, and the US and Britain each claimed the one that gave them the island. British sheep farmers and a few dozen American settlers lived there side by side."),
            ("p", "On 15 June 1859 an American farmer, Lyman Cutlar, found a pig digging up his potato patch, and shot it. The pig belonged to the Hudson's Bay Company, a British company whose farm on the island was run by Charles Griffin. Cutlar offered to pay for the pig, but the two men argued, and British officials threatened to arrest him."),
            ("h", "Soldiers, warships... and no war"),
            ("p", "The American settlers asked for protection, and the US Army sent Captain George Pickett with 64 soldiers. The British answered with warships; soon there were three of them in the bay, with far more men and guns than the Americans had. But the senior British naval officer refused to open fire, and nobody wanted to start a war over a pig. Officials in Washington and London were shocked to hear what had grown out of it."),
            ("p", "The US sent General Winfield Scott to calm things down. Both sides agreed to share the island, each keeping a small camp of about 100 soldiers at opposite ends. The joint occupation lasted 12 years, and the two camps got on well: they visited each other and held sports competitions."),
            ("p", "In 1871 the two countries asked the German Kaiser, Wilhelm I, to decide. In 1872 he chose the channel that gave the San Juan Islands to the United States. The British marines left that year and the last American troops left in 1874. The only casualty of the Pig War was the pig."),
        ],
        "sources": [
            ("The Pig War (US National Park Service, San Juan Island National Historical Park)", "https://www.nps.gov/sajh/learn/historyculture/the-pig-war.htm"),
            ("Lyman Cutlar Homestead (US National Park Service)", "https://www.nps.gov/places/lyman-cutlar-homestead.htm"),
            ("Lyman Cutlar touches off the Pig War, 15 June 1859 (HistoryLink)", "https://www.historylink.org/File/5037"),
            ("The Pig War (The Canadian Encyclopedia)", "https://www.thecanadianencyclopedia.ca/en/article/pig-war"),
            ("Boar war (Smithsonian Magazine)", "https://www.smithsonianmag.com/history/boar-war-75236932/"),
            ("Pig War (1859) (Wikipedia)", "https://en.wikipedia.org/wiki/Pig_War_(1859)"),
        ],
    },
    {
        "slug": "pea-escape", "title": "The Prisoner Who Escaped With Peas", "year": "Legend", "place": "Somewhere, sometime",
        "teaser": "Dry peas, a crack in the wall, a cup of water, and guards who laughed. A legend, and the real science behind it.",
        "body": [
            ("p", "This one is a legend. The story goes that a prisoner saved the dry peas from his dinner every day, pushed them into a crack in his cell wall and kept them wet with his drinking water. The guards thought he had lost his mind. But the peas swelled, the crack grew, and one morning the wall gave way and he walked out."),
            ("p", "We could not find any record of a real prisoner who did this: no name, no prison, no date. It is a good story, not a documented escape. Peas also do not multiply into thousands when they get wet, they only swell."),
            ("h", "What is true"),
            ("p", "Swelling seeds really are strong. Dry seeds soak up water and expand, and if they are packed into a closed space they push outwards with great force. Anatomists used this for centuries to take skulls apart without breaking them: they filled a skull with dried peas, beans or grain, added water, and let the swelling seeds slowly push the bones apart along their joints. A 2014 study even compared which seeds work fastest and found dried chickpeas beat mung beans."),
            ("p", "A real escape that is close to the legend was reported in newspapers in 1902: a prisoner in Iquique, Chile, where buildings were made of sun-dried clay, saved his drinking water every day, used it to soften a spot in his cell wall, dug through with a splinter of wood and escaped. No peas, but the same patient idea."),
            ("p", "So: wet peas can split things apart. Whether anyone ever used them to break out of prison, nobody can prove."),
        ],
        "sources": [
            ("Descartes and \"skull blasting\" with peas and seeds (IFLScience)", "https://www.iflscience.com/ren-descartes-was-a-victim-of-skull-blasting-and-the-skull-in-paris-is-a-fraud-researchers-suggest-65602"),
            ("Escapes that prisoners have made, Lyttelton Times, 15 December 1902 (Papers Past)", "https://paperspast.natlib.govt.nz/newspapers/LT19021215.2.7"),
            ("Prison escape (Wikipedia)", "https://en.wikipedia.org/wiki/Prison_escape"),
        ],
    },
    {
        "slug": "pink-prison", "title": "The Prison That Turned Pink", "year": "1979", "place": "Seattle, USA",
        "teaser": "A navy jail painted a cell bubblegum pink to calm angry prisoners. Did it work?",
        "body": [
            ("p", "In 1979 a researcher named Alexander Schauss persuaded the officers running a U.S. Navy correctional facility in Seattle to try an experiment: paint some of the holding cells pink and watch how the prisoners behaved."),
            ("p", "The idea came from his own earlier tests. In one, young men stared at either a deep blue card or a bright pink one, and almost all of them tested weaker after looking at the pink. Schauss called the shade P-618 and claimed it lowered heart rate, pulse and breathing compared with other colours."),
            ("p", "The colour was named Baker-Miller pink after the two officers, Gene Baker and Ron Miller. They reported that angry prisoners calmed down after about fifteen minutes in the pink cell. The news spread: psychiatric wards, police stations and holding cells were painted the same shade. By 2015 roughly one in five prisons and police stations in Switzerland had at least one pink cell, and there were pink cells in the US, the UK and Austria too."),
            ("h", "The twist"),
            ("p", "When Schauss repeated his experiments a few years later, the calming effect did not show up, and a test in a real pink cell found no difference. In 2014 a team led by psychologist Oliver Genschow ran the first carefully controlled study in real detention cells and found that pink cells did not reduce aggression compared with grey ones. The researchers noted their study had only 59 people, so a very small effect could have been missed."),
            ("p", "So the pink cells were real, but the evidence that they calm anyone down is weak. The early reports may have come from the surprise of a new colour, or from what the guards hoped to see."),
        ],
        "sources": [
            ("Baker–Miller pink (Wikipedia)", "https://en.wikipedia.org/wiki/Baker%E2%80%93Miller_pink"),
            ("Are prisoners calmer when their cells are painted pink? (BPS Research Digest)", "https://digest.bps.org.uk/2014/12/02/are-prisoners-calmer-when-their-cells-are-painted-pink"),
            ("Can pink really pacify? (Salon / The Conversation)", "https://www.salon.com/2018/09/29/can-pink-really-pacify_partner/"),
            ("What does the color pink do to you? (Psychology Today)", "https://www.psychologytoday.com/nz/blog/your-personal-renaissance/201809/what-does-the-color-pink-do-you"),
            ("Why Baker-Miller pink is in so many prison cells (IFLScience)", "https://www.iflscience.com/the-strange-reason-why-baker-miller-pink-came-to-be-painted-in-so-many-prison-cells-82438"),
            ("Genschow et al. (2014), Psychology, Crime & Law, doi:10.1080/1068316X.2014.989172", "https://doi.org/10.1080/1068316X.2014.989172"),
        ],
    },
    {
        "slug": "poyais", "title": "The Man Who Invented a Country", "year": "1822", "place": "London, Central America, Paris",
        "teaser": "A Scottish soldier sold land, money and bonds for a kingdom that did not exist.",
        "body": [
            ("p", "Gregor MacGregor was a Scottish soldier who had fought in the South American wars of independence. Back in Britain in 1821, he announced that he was the Cazique, a kind of prince, of Poyais: a rich and healthy land on the coast of what is now Honduras, with a capital, a bank and British settlers already living there."),
            ("p", "None of it was true. MacGregor printed Poyais banknotes, sold land and officers' posts, published a guidebook praising the country, and raised money in London with Poyais government bonds. Settlers swapped their real savings for his worthless Poyais dollars."),
            ("p", "In 1822 and early 1823 two ships, the Honduras Packet and the Kennersley Castle, carried around 250 emigrants to Poyais. They found only jungle and swamp. Without shelter or supplies, many caught tropical diseases; about two thirds of them died. The survivors were rescued and taken to British Honduras (Belize), and only about 50 ever got back to Britain."),
            ("h", "He got away with it"),
            ("p", "By the time the news reached London, MacGregor had moved to France and started the same scheme again. He was arrested and tried in Paris in 1826, but he was acquitted and only one of his associates was convicted. He kept trying smaller Poyais schemes in Britain for years."),
            ("p", "In 1839 he moved to Venezuela, where he was given a general's pension for his service in the war of independence. He died in Caracas on 4 December 1845 and was buried with full military honours. He was never convicted for Poyais."),
        ],
        "sources": [
            ("Gregor MacGregor (Wikipedia)", "https://en.wikipedia.org/wiki/Gregor_MacGregor"),
            ("The con man who invented his own country (History.com)", "https://www.history.com/articles/the-con-man-who-invented-his-own-country"),
            ("The craziest scam: Gregor MacGregor creates his own country (Britannica)", "https://www.britannica.com/story/the-craziest-scam-gregor-macgregor-creates-his-own-country"),
            ("Gregor MacGregor, Prince of Poyais (Historic UK)", "https://www.historic-uk.com/HistoryUK/HistoryofScotland/Gregor-MacGregor-Prince-Of-Poyais/"),
            ("Gregor MacGregor (Undiscovered Scotland)", "https://undiscoveredscotland.co.uk/usbiography/mac/gregormacgregor.html"),
        ],
    },
    {
        "slug": "eiffel-tower-scam", "title": "The Man Who Sold the Eiffel Tower", "year": "1925", "place": "Paris, France",
        "teaser": "A con man sold the Eiffel Tower for scrap metal. Then he came back to sell it again.",
        "body": [
            ("p", "In 1925 Paris newspapers wrote about how expensive the Eiffel Tower was to maintain. It had been built as a temporary attraction in 1889, and many Parisians still thought it was ugly. A con man called Victor Lustig saw an opportunity."),
            ("p", "Posing as a government official, he wrote on forged letterhead to six scrap-metal dealers and invited them to a meeting at a smart hotel. There he told them, in strict secrecy, that the city could no longer afford the tower and would sell its roughly 7,300 tonnes of iron for scrap."),
            ("p", "Lustig picked the dealer who seemed keenest, André Poisson, a newcomer who wanted to make his name in Paris. He hinted that a poorly paid official might need a little extra to make the deal go through, so Poisson paid for the tower and a bribe on top. Lustig left for Austria with the money."),
            ("h", "Twice"),
            ("p", "Poisson was so embarrassed that he never went to the police. About six months later Lustig returned and tried the same trick on a new group of dealers. This time the target went to the police, and Lustig had to flee. He was later arrested in the United States for counterfeiting and died in prison in 1947."),
            ("p", "Most of what we know comes from later accounts, so details such as the exact amount Poisson paid differ from source to source."),
        ],
        "sources": [
            ("Victor Lustig (Wikipedia)", "https://en.wikipedia.org/wiki/Victor_Lustig"),
            ("Who sold the Eiffel Tower? (official Eiffel Tower website)", "https://www.toureiffel.paris/en/news/history-and-culture/who-sold-eiffel-tower"),
            ("The smoothest con man that ever lived (Smithsonian Magazine)", "https://www.smithsonianmag.com/history/the-smoothest-con-man-that-ever-lived-29861908/"),
            ("How Victor Lustig sold the Eiffel Tower, twice (Mental Floss)", "https://www.mentalfloss.com/crime/smooth-operator-how-victor-lustig-sold-eiffel-tower"),
            ("Selling the Eiffel Tower (ISRI)", "https://isri.org/scrap-articles/selling-the-eiffel-tower"),
        ],
    },
    {
        "slug": "emu-war", "title": "The War Australia Lost to Birds", "year": "1932", "place": "Western Australia",
        "teaser": "Three soldiers, two machine guns, ten thousand bullets, twenty thousand emus.",
        "body": [
            ("p", "In 1932 about 20,000 emus moved into the wheat farms of Western Australia, eating crops and trampling them. Many of the farmers were ex-soldiers, and they asked the government for machine guns."),
            ("p", "The Defence Minister, Sir George Pearce, sent Major G. P. W. Meredith of the Royal Australian Artillery with two soldiers, two Lewis guns and 10,000 rounds of ammunition. Rain delayed the start, and the operation began on 2 November 1932."),
            ("p", "It went badly. The emus split into small groups and ran out of range. In one ambush a gun jammed after only about a dozen birds had been shot. A gun mounted on a truck could not aim on the rough ground, and the truck could not keep up with the birds. By 8 November about 2,500 rounds had been fired, and estimates of the birds killed ranged from 50 to 500. The soldiers were called back."),
            ("h", "Round two"),
            ("p", "Farmers asked for help again, and Meredith returned on 13 November. When the operation ended on 10 December he reported 986 emus killed, with almost 10,000 rounds used, about ten bullets per bird. He compared the emus to tanks because they kept going after being hit."),
            ("p", "The emu population barely changed, and the episode became known as the Emu War: the war Australia lost to birds."),
        ],
        "sources": [
            ("Emu War (Wikipedia)", "https://en.wikipedia.org/wiki/Emu_War"),
            ("Emu War (Britannica)", "https://www.britannica.com/topic/Emu-War"),
            ("Looking back: Australia's Emu Wars (Australian Geographic)", "https://www.australiangeographic.com.au/?p=23036"),
            ("When Australia went to war with emus, and lost (National Geographic)", "https://www.nationalgeographic.com/history/article/australian-emu-war-history"),
            ("The Great Emu War (Scientific American)", "https://www.scientificamerican.com/blog/running-ponies/the-great-emu-war-in-which-some-large-flightless-birds-unwittingly-foiled-the-australian-army/"),
        ],
    },
]

E = html.escape
CSS = """
  :root { --bg: #0d0b13; --card: #1a1724; --ink: #f4f1ea; --dim: #a9a3b8; --accent: #ffd400; --pink: #ff91af; }
  * { box-sizing: border-box; }
  html { background: var(--bg); }
  body { margin: 0; color: var(--ink); font: 18px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  a { color: var(--accent); }
  header { padding: 28px 20px 8px; max-width: 1100px; margin: 0 auto; }
  .logo { font: 900 34px/1.1 ui-monospace, Menlo, Consolas, monospace; letter-spacing: 0.04em; text-transform: uppercase;
          color: #fff; text-shadow: 3px 3px 0 #111, -2px -2px 0 #111, 2px -2px 0 #111, -2px 2px 0 #111, 5px 6px 0 rgba(0,0,0,.6); margin: 0; }
  .logo span { color: #bfe3ff; }
  .sub { color: var(--dim); margin: 6px 0 0; }
  .back { display: inline-block; margin: 0 0 12px; font: bold 14px ui-monospace, Menlo, monospace; text-transform: uppercase; letter-spacing: .08em; text-decoration: none; }
  main { max-width: 1100px; margin: 0 auto; padding: 12px 20px 48px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
  .card { display: block; background: var(--card); border: 3px solid #111; box-shadow: 5px 5px 0 #000; color: var(--ink); text-decoration: none; transition: transform .12s; }
  .card:hover, .card:focus { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 #000; }
  .card img { display: block; width: 100%; aspect-ratio: 9 / 16; object-fit: cover; border-bottom: 3px solid #111; }
  .card div { padding: 10px 12px 14px; }
  .card h2 { font: 800 18px/1.25 system-ui, sans-serif; margin: 0 0 4px; }
  .meta { font: bold 13px ui-monospace, Menlo, monospace; color: var(--accent); text-transform: uppercase; letter-spacing: .06em; }
  .card p { color: var(--dim); font-size: 15px; line-height: 1.4; margin: 6px 0 0; }
  .story { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 36px; align-items: start; }
  .story video { width: 100%; aspect-ratio: 9 / 16; background: #000; border: 3px solid #111; box-shadow: 6px 6px 0 #000; position: sticky; top: 16px; }
  article h1 { font: 900 34px/1.15 system-ui, sans-serif; margin: 4px 0 14px; }
  article h2 { font: 800 22px/1.2 system-ui, sans-serif; margin: 28px 0 8px; color: var(--pink); }
  article p { margin: 0 0 14px; max-width: 64ch; }
  .sources { margin-top: 30px; padding-top: 14px; border-top: 2px solid #2c2838; font-size: 15px; }
  .sources h2 { color: var(--dim); font-size: 16px; text-transform: uppercase; letter-spacing: .08em; }
  .sources li { margin: 4px 0; }
  footer { text-align: center; color: var(--dim); font-size: 14px; padding: 24px; }
  @media (max-width: 760px) { .story { grid-template-columns: 1fr; } .story video { position: static; max-width: 420px; margin: 0 auto; } .logo { font-size: 26px; } article h1 { font-size: 28px; } }
"""


def page(title, desc, body, og_img=None):
    og = f'\n<meta property="og:image" content="https://pixelgames.online/shorts/{og_img}">' if og_img else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0d0b13">
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">{og}
<link rel="icon" type="image/png" sizes="32x32" href="../icons/favicon-32.png">
<title>{E(title)}</title>
<style>{CSS}</style>
</head>
<body>
{body}
<footer>Weird History Toons &middot; made by a son and his dad &middot; <a href="../">Pixel Games</a></footer>
</body>
</html>
"""


def header(back):
    return f"""<header>
{back}<p class="logo">Weird History <span>Toons</span></p>
<p class="sub">Short cartoons about strange true stories, and what really happened.</p>
</header>"""


def build():
    cards = []
    for s in SHORTS:
        cards.append(f"""<a class="card" href="{s['slug']}.html">
<img src="media/{s['slug']}.jpg" alt="" loading="lazy" width="540" height="960">
<div><span class="meta">{E(s['year'])} &middot; {E(s['place'])}</span><h2>{E(s['title'])}</h2><p>{E(s['teaser'])}</p></div>
</a>""")
        parts = []
        for kind, text in s["body"]:
            parts.append(f"<h2>{E(text)}</h2>" if kind == "h" else f"<p>{E(text)}</p>")
        srcs = "\n".join(f'<li><a href="{E(u)}" rel="noopener" target="_blank">{E(t)}</a></li>' for t, u in s["sources"])
        body = f"""{header('<a class="back" href="./">&larr; All shorts</a>')}
<main class="story">
<video src="media/{s['slug']}.mp4" poster="media/{s['slug']}.jpg" controls playsinline preload="metadata"></video>
<article>
<span class="meta">{E(s['year'])} &middot; {E(s['place'])}</span>
<h1>{E(s['title'])}</h1>
{chr(10).join(parts)}
<section class="sources"><h2>Sources</h2><ul>
{srcs}
</ul></section>
</article>
</main>"""
        (ROOT / f"{s['slug']}.html").write_text(page(f"{s['title']} | Weird History Toons", s["teaser"], body, f"media/{s['slug']}.jpg"))
    body = f"""{header('<a class="back" href="../">&larr; Pixel Games</a>')}
<main><div class="grid">
{chr(10).join(cards)}
</div></main>"""
    (ROOT / "index.html").write_text(page("Weird History Toons | Pixel Games", "Short cartoons about strange true stories, with the facts behind them.", body, f"media/{SHORTS[0]['slug']}.jpg"))
    print("built", len(SHORTS), "shorts")


if __name__ == "__main__":
    build()
