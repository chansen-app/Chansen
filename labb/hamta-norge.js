/*  Labb: norska jobb med låga ingångskrav
 *
 *  Samma idé som Chansen, fast mot Norge. Hämtar annonser från NAV:s
 *  öppna flöde, sorterar bort dem med hårda krav och poängsätter resten.
 *
 *  Ligger i mappen labb och publiceras aldrig. GitHub Pages tar bara det
 *  som ligger i mappen docs.
 *
 *  Kör med:   node .\labb\hamta-norge.js
 *  Resultat:  labb/norgejobb.json och labb/norgejobb.js
 *
 *  Om nyckeln:
 *  NAV kräver en nyckel. Skriptet hämtar automatiskt den publika
 *  testnyckeln, som roterar med jämna mellanrum. Vill man köra på riktigt
 *  mejlar man nav.team.arbeidsplassen@nav.no med namn och kontaktuppgifter
 *  och får en egen. Lägg den i så fall i miljövariabeln NAV_TOKEN.
 *
 *  Om villkoren:
 *  NAV kräver att annonser som blivit inaktiva tas bort, och att
 *  kontaktuppgifter inte visas för inaktiva annonser. Därför sparas bara
 *  aktiva annonser, och kontaktuppgifter sparas aldrig alls.
 *
 *  OBS: ordfiltret nedan är ett första utkast. Det är skrivet efter hur
 *  norska annonser brukar formuleras, men det behöver gås igenom av någon
 *  som verkligen kan norska innan det kan användas på riktigt.
 */

const fs = require("fs");

const BAS = "https://pam-stilling-feed.nav.no";
const DAGAR_BAKAT = 2;          // hur långt bak i flödet vi börjar
const MAX_SIDOR = 4;            // varje sida rymmer 1000 poster
const MAX_DETALJER = 400;       // hur många annonser vi hämtar texten för
const PAUS_MS = 120;            // paus mellan anrop, för att vara snäll

// ── Yrken som alltid kräver utbildning eller auktorisation ────────────
const YRKESSTOPP = [
  "sykepleier", "vernepleier", "helsefagarbeider", "lege", "tannlege",
  "fysioterapeut", "ergoterapeut", "psykolog", "jordmor", "farmasøyt",
  "barnehagelærer", "pedagogisk leder", "lærer", "adjunkt", "lektor",
  "elektriker", "rørlegger", "tømrer", "sveiser", "anleggsmaskinfører",
  "revisor", "advokat", "jurist", "ingeniør", "sivilingeniør", "arkitekt",
  "veterinær", "bioingeniør", "radiograf", "optiker", "kiropraktor",
  "regnskapsfører", "systemutvikler", "utvikler", "arkitekt"
];

// ── Ord i texten som gör att annonsen åker ut direkt ──────────────────
const STOPPORD = [
  /\bfagbrev\b/, /\bsvennebrev\b/, /\bautorisasjon\b/, /\bpolitiattest\b/,
  /\bsertifikat\b/, /\btruckførerbevis\b/, /\bmaskinførerbevis\b/,
  /\bklasse\s*(?:b|c|d|ce|c1|d1)\b/, /\bkl\.\s*\d\b/,
  /\d+\s*(?:års|år)\s+erfaring/, /\bminimum\s+\d+\s*års?\b/,
  /\bminst\s+\d+\s*års?\b/, /\bflere\s+års\s+erfaring\b/,
  /\blang\s+erfaring\b/, /\bsolid\s+erfaring\b/, /\bbred\s+erfaring\b/,
  /\bbachelor\b/, /\bmaster\b/, /\bhøyskole\b/, /\bhøgskole\b/,
  /\buniversitet\b/, /\bfullført\s+utdanning\b/, /\bfullført\s+videregående\b/,
  /\bkrav\s+om\s+utdanning\b/, /\bhelsefaglig\s+utdanning\b/,
  /\bpedagogisk\s+utdanning\b/, /\bprovisjonslønn\b/, /\bkun\s+provisjon\b/
];

// ── Hinder som drar ned poängen, men inte sorterar bort ───────────────
const MINUSORD = [
  [/\berfaring\s+fra\b/, 3], [/\berfaring\s+med\b/, 3],
  [/\bønskelig\s+med\s+erfaring\b/, 2], [/\bførerkort\b/, 2],
  [/\bsertifikat\s+kl\b/, 2], [/\bkvalifikasjonskrav\b/, 2],
  [/\brelevant\s+utdanning\b/, 4], [/\bnattarbeid\b/, 1],
  [/\bturnus\b/, 1], [/\bhelgearbeid\b/, 1]
];

// ── Tecken på att arbetsgivaren lär upp ───────────────────────────────
const PLUSORD = [
  [/\bopplæring\s+(?:vil\s+)?(?:bli\s+)?gis?\b/, 5],
  [/\bvi\s+(?:gir|lærer)\s+deg\s+opp(?:læring)?\b/, 5],
  [/\bgod\s+opplæring\b/, 4], [/\bgrundig\s+opplæring\b/, 4],
  [/\bopplæring\s+på\s+(?:arbeidsplassen|stedet)\b/, 4],
  [/\bingen\s+(?:erfaring|forkunnskaper)\s+(?:er\s+)?(?:nødvendig|kreves|påkrevd)\b/, 6],
  [/\bdu\s+trenger\s+ikke\s+erfaring\b/, 6],
  [/\bingen\s+krav\s+til\s+erfaring\b/, 6],
  [/\bnybegynner\b/, 4], [/\bvi\s+ser\s+etter\s+deg\s+som\s+er\s+motivert\b/, 2],
  [/\bpersonlig\s+egnethet\s+vektlegges\b/, 3]
];

// ── Titlar som ofta har låga ingångskrav ─────────────────────────────
const TITELPLUS = [
  "butikk", "butikkmedarbeider", "salgsmedarbeider", "kassemedarbeider",
  "lager", "lagermedarbeider", "plukker", "pakker", "bud", "sjåfør",
  "renhold", "renholder", "vaskehjelp", "kantine", "kjøkkenassistent",
  "kjøkkenmedarbeider", "servitør", "servering", "barista", "resepsjonist",
  "assistent", "medarbeider", "medhjelper", "tilkallingshjelp", "vikar",
  "sesonghjelp", "ekstrahjelp", "ungdom", "sommerjobb", "vaktmester",
  "kundeservice", "kundebehandler", "produksjonsmedarbeider", "hjelpearbeider"
];

const TROSKEL = 2;              // under detta kommer annonsen inte med
const BAST_CHANS = 6;           // från detta räknas den som bäst chans

// ──────────────────────────────────────────────────────────────────────
function sov(ms) { return new Promise(k => setTimeout(k, ms)); }

async function nyckel() {
  if (process.env.NAV_TOKEN) return process.env.NAV_TOKEN.trim();
  const svar = await fetch(BAS + "/api/publicToken");
  const text = await svar.text();
  const rad = text.split("\n").map(r => r.trim()).filter(r => r.startsWith("ey"))[0];
  if (!rad) throw new Error("Hittade ingen nyckel i svaret från NAV.");
  return rad;
}

async function hamta(url, token, extra) {
  const svar = await fetch(url.startsWith("http") ? url : BAS + url, {
    headers: Object.assign({
      accept: "application/json",
      Authorization: "Bearer " + token
    }, extra || {})
  });
  if (!svar.ok) throw new Error("Status " + svar.status + " för " + url);
  return svar.json();
}

function rensa(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function poang(titel, text) {
  const t = (titel || "").toLowerCase();
  for (const yrke of YRKESSTOPP) {
    if (t.includes(yrke)) return { ut: "yrket kräver utbildning: " + yrke };
  }
  // Hindren kan stå i rubriken lika gärna som i texten, till exempel
  // "Sjåfør kl. 2 med sertifikat", så båda gås igenom.
  const allt = t + " " + text;
  for (const r of STOPPORD) {
    const m = allt.match(r);
    if (m) return { ut: "hinder: " + m[0] };
  }
  let p = 0;
  const skal = [];

  // En titel som brukar betyda låga ingångskrav ger poäng, precis som
  // på den svenska sidan. Annars faller nästan allt bort, eftersom
  // norska annonser sällan skriver ut att de lär upp.
  for (const ord of TITELPLUS) {
    if (t.includes(ord)) { p += 3; skal.push("+3 titel: " + ord); break; }
  }

  for (const [r, v] of PLUSORD) {
    if (r.test(text)) { p += v; skal.push("+" + v + " " + r.source.slice(0, 28)); }
  }
  let hinder = 0;
  for (const [r, v] of MINUSORD) {
    if (r.test(text)) { p -= v; hinder++; skal.push("-" + v + " " + r.source.slice(0, 28)); }
  }
  // Ingen hittad hindrande formulering alls är i sig ett gott tecken.
  if (hinder === 0) { p += 2; skal.push("+2 inga hinder i texten"); }
  return { p, skal };
}

async function kor() {
  const token = await nyckel();
  console.log("Nyckel hämtad.");

  const sedan = new Date(Date.now() - DAGAR_BAKAT * 86400000).toUTCString();
  let sida = "/api/v1/feed";
  const poster = new Map();      // uuid -> senaste posten, så dubbletter försvinner

  for (let i = 0; i < MAX_SIDOR && sida; i++) {
    const d = await hamta(sida, token, i === 0 ? { "If-Modified-Since": sedan } : null);
    for (const post of d.items || []) {
      const f = post._feed_entry || {};
      if (f.status !== "ACTIVE") { poster.delete(f.uuid); continue; }
      poster.set(f.uuid, post);
    }
    console.log("Sida " + (i + 1) + ": " + (d.items || []).length +
                " poster, " + poster.size + " aktiva hittills");
    sida = d.next_url || null;
    await sov(PAUS_MS);
  }

  const lista = [...poster.values()].slice(0, MAX_DETALJER);
  console.log("Hämtar texten för " + lista.length + " annonser.");

  const jobb = [];
  let bort = 0, fel = 0;
  for (const post of lista) {
    let a;
    try {
      a = (await hamta(post.url, token)).ad_content || {};
    } catch (e) { fel++; await sov(PAUS_MS); continue; }

    const text = rensa(a.description);
    const dom = poang(a.title, text);
    if (dom.ut) { bort++; await sov(PAUS_MS); continue; }
    if (dom.p < TROSKEL) { bort++; await sov(PAUS_MS); continue; }

    const plats = (a.workLocations || [])[0] || {};
    jobb.push({
      titel: a.title || "",
      arbetsgivare: (a.employer || {}).name || "",
      ort: plats.municipal || plats.city || "",
      fylke: plats.county || "",
      omfattning: a.extent || "",
      anstallningsform: a.engagementtype || "",
      beskrivning: rensa(a.description).slice(0, 400),
      lank: a.link || a.applicationUrl || "",
      sistaAnsokningsdag: a.applicationDue || "",
      publicerad: a.published || "",
      poang: dom.p,
      skal: dom.skal,
      chansniva: dom.p >= BAST_CHANS ? "hog" : "medel"
      // kontaktuppgifter sparas aldrig, enligt NAV:s villkor
    });
    await sov(PAUS_MS);
  }

  jobb.sort((a, b) => b.poang - a.poang);
  const tid = new Date().toISOString();

  if (!fs.existsSync("labb")) fs.mkdirSync("labb");
  fs.writeFileSync("labb/norgejobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("labb/norgejobb.js",
    'const NORGE_HAMTAD = "' + tid + '";\n' +
    "const NORGEJOBB = " + JSON.stringify(jobb) + ";");

  console.log("");
  console.log("Klart. " + jobb.length + " jobb kvar, " + bort +
              " bortsorterade, " + fel + " fel.");
  console.log("De tio bästa:");
  for (const j of jobb.slice(0, 10)) {
    console.log("  " + String(j.poang).padStart(3) + "  " +
                (j.titel || "").slice(0, 44).padEnd(46) +
                (j.ort || "").slice(0, 14));
  }
}

kor().catch(e => { console.error("AVBRYTER:", e.message); process.exit(1); });
