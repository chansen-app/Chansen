/*  Labb: brittiska jobb med låga ingångskrav
 *
 *  Samma idé som Chansen, fast mot Storbritannien. Hämtar annonser från
 *  Adzunas API, som täcker brittiska jobbsajter inklusive regeringens
 *  Find a Job.
 *
 *  Ligger i mappen labb och publiceras aldrig.
 *
 *  Kör med:   node .\labb\hamta-uk.js
 *  Resultat:  labb/ukjobb.json och labb/ukjobb.js
 *
 *  VIKTIG SKILLNAD MOT SVERIGE OCH NORGE
 *  Adzuna ger bara de första 500 tecknen av annonstexten. Kraven i en
 *  jobbannons står nästan alltid längre ned än så. Den svenska metoden,
 *  att läsa hela texten och sortera bort hinder, går alltså inte att
 *  använda här.
 *
 *  Därför är metoden omvänd: vi söker efter annonser som själva skriver
 *  att erfarenhet inte krävs eller att upplärning ges, och kontrollerar
 *  sedan i rubrik och utdrag att det verkligen står så. Adzunas egen
 *  frassökning är inte exakt, den ger till exempel träff på "experience
 *  required" när man söker på "no experience required".
 *
 *  Nyckel:
 *  Registrera gratis på developer.adzuna.com. Lägg app_id och app_key
 *  som Secrets på GitHub med namnen ADZUNA_ID och ADZUNA_KEY.
 */

const fs = require("fs");

const BAS = "https://api.adzuna.com/v1/api/jobs/gb/search";
const PER_SIDA = 50;          // Adzunas tak
const SIDOR = 2;              // per sökning, håller anropen nere
const PAUS_MS = 1500;         // provkontot är hårt strypt, ta det lugnt

// ── Sökningar. Varje sökning kostar ett anrop per sida. ──────────────
const SOKNINGAR = [
  "no experience required", "no experience necessary", "no experience needed",
  "full training provided", "training will be provided", "entry level",
  "trainee", "apprentice", "warehouse operative", "kitchen porter",
  "retail assistant", "cleaner", "care assistant", "delivery driver"
];

// ── Måste stå i rubrik eller utdrag, annars kommer jobbet inte med ───
const POSITIVA = [
  /\bno\s+(?:previous\s+)?experience\s+(?:is\s+)?(?:required|necessary|needed)\b/i,
  /\bexperience\s+(?:is\s+)?not\s+(?:required|necessary|needed|essential)\b/i,
  /\bfull\s+training\s+(?:is\s+)?(?:provided|given)\b/i,
  /\btraining\s+will\s+be\s+provided\b/i,
  /\bwe\s+will\s+train\s+you\b/i,
  /\bon[-\s]the[-\s]job\s+training\b/i,
  /\bentry[-\s]level\b/i,
  /\btrainee\b/i,
  /\bno\s+experience\b/i
];

// ── Hinder. Står något av dessa åker annonsen ut. ────────────────────
const STOPP = [
  /\b\d+\+?\s*(?:years?|yrs?)(?:'|’)?\s+(?:of\s+)?experience\b/i,
  /\bexperience\s+(?:is\s+)?(?:required|essential)\b/i,
  /\bmust\s+have\s+experience\b/i,
  /\bproven\s+(?:track\s+record|experience)\b/i,
  /\bdegree\b/i, /\bdegree[-\s]educated\b/i, /\bgraduate\b/i,
  /\bnvq\s*(?:level\s*)?[2-5]\b/i, /\bhnd\b/i, /\bhnc\b/i,
  /\bqualified\b/i, /\bqualification\s+(?:is\s+)?(?:required|essential)\b/i,
  /\bregistered\s+(?:nurse|midwife)\b/i, /\bnmc\b/i, /\bgphc\b/i,
  /\bcscs\s+card\b/i, /\bcpcs\b/i, /\bgas\s+safe\b/i, /\b18th\s+edition\b/i,
  /\bhgv\b/i, /\bcpc\b/i, /\bforklift\s+licen[cs]e\b/i, /\bcounterbalance\b/i,
  /\bdriving\s+licen[cs]e\s+(?:is\s+)?essential\b/i,
  /\bsia\s+licen[cs]e\b/i, /\bteaching\s+qualification\b/i,
  /\bcommission\s+only\b/i, /\buncapped\s+commission\b/i,

  /* Kurser som säljs som jobb. I Storbritannien annonseras ofta
     "placement programmes" där man betalar för en utbildning och lovas
     praktik efteråt. Det är inte ett jobb och hör inte hemma här.   */
  /\bplacement\s+program(?:me)?\b/i, /\bbootcamp\b/i,
  /\btraining\s+academy\b/i, /\bcourse\s+fee\b/i,
  /\bself[-\s]funded\b/i, /\btuition\b/i, /\benrol(?:l)?\b/i,
  /\bqualify\s+then\s+work\b/i, /\bguaranteed\s+interview\b/i,
  /\bself[-\s]employed\b/i, /\bott?e\b/i
];

// ── Yrken som alltid kräver utbildning eller behörighet ──────────────
const YRKESSTOPP = [
  "nurse", "midwife", "doctor", "gp ", "pharmacist", "dentist",
  "physiotherapist", "radiographer", "solicitor", "accountant",
  "engineer", "architect", "surveyor", "electrician", "plumber",
  "gas engineer", "welder", "teacher", "lecturer", "social worker",
  "developer", "analyst", "consultant", "manager", "director",
  "supervisor", "head of", "lead ", "senior ", "specialist",

  /* Den som lär ut behöver själv kunna yrket. Utan de här kom
     "Electrical Trainer (Full Training Provided)" igenom, alltså en
     tjänst som utbildare och inte ett instegsjobb.                  */
  "trainer", "assessor", "tutor", "instructor", "coach",
  "practitioner", "officer", "coordinator", "administrator",

  /* Säljjobb utan fast lön är precis det Chansen sorterar bort i
     Sverige. Här ser vi bara 500 tecken av annonsen och kan alltså inte
     kontrollera lönen, så hela sorten hålls utanför tills vi vet mer. */
  "sales", "seller", "promotions", "promoter", "fundraiser",
  "brand ambassador", "canvasser", "door to door", "field rep",
  "business development", "recruitment consultant"
];

// Kategorier hos Adzuna som av samma skäl hålls utanför
const KATEGORISTOPP = ["Sales Jobs", "PR, Advertising & Marketing Jobs"];

// ── Sådant som är värt att veta men inte stoppar annonsen ────────────
const FLAGGOR = [
  [/\bdbs\s+(?:check|clearance)\b/i, "kräver DBS-kontroll"],
  [/\bown\s+(?:car|transport|vehicle)\b/i, "kräver egen bil"],
  [/\bdriving\s+licen[cs]e\b/i, "nämner körkort"],
  [/\bnight\s+shift\b/i, "nattarbete"],
  [/\bzero\s+hours?\b/i, "nolltimmarsavtal"],
  [/\bweekend\b/i, "helgarbete"]
];

/* Under 18 i Storbritannien
   Reglerna sätts av varje kommun, och många jobb kräver arbetstillstånd
   från skolan. Det går inte att avgöra ur en annons, så alla jobb här
   markeras som 18 år. En riktig version skulle behöva hantera detta. */
const MINSTA_ALDER = 18;

function sov(ms){ return new Promise(k => setTimeout(k, ms)); }

function rensa(t){
  return String(t || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function nyckel(){
  const id = (process.env.ADZUNA_ID || "").trim();
  const key = (process.env.ADZUNA_KEY || "").trim();
  if (!id || !key) {
    throw new Error("Saknar nyckel. Lägg ADZUNA_ID och ADZUNA_KEY som Secrets på GitHub.");
  }
  return { id, key };
}

/* Provkontot svarar ibland 503 när man frågar för tätt. Ett nytt försök
   efter en paus brukar räcka, annars hoppar vi över den sökningen.   */
async function hamtaMedForsok(fras, sida, n){
  for (let forsok = 1; forsok <= 3; forsok++){
    try {
      return await hamta(fras, sida, n);
    } catch (e){
      if (forsok === 3) throw e;
      console.log("  försöker igen om " + (forsok * 3) + " sekunder (" + e.message + ")");
      await sov(forsok * 3000);
    }
  }
}

async function hamta(fras, sida, n){
  const url = BAS + "/" + sida
    + "?app_id=" + encodeURIComponent(n.id)
    + "&app_key=" + encodeURIComponent(n.key)
    + "&results_per_page=" + PER_SIDA
    + "&what_phrase=" + encodeURIComponent(fras)
    + "&max_days_old=14"
    + "&content-type=application/json";
  const svar = await fetch(url, { headers: { Accept: "application/json" } });
  if (!svar.ok) throw new Error("Status " + svar.status + " för sökningen " + fras);
  return svar.json();
}

function bedom(titel, text, kategori){
  const t = (titel || "").toLowerCase();
  const allt = titel + " " + text;

  if (KATEGORISTOPP.indexOf(kategori) > -1){
    return { ut: "kategorin hålls utanför: " + kategori };
  }

  for (const yrke of YRKESSTOPP){
    if (t.includes(yrke)) return { ut: "yrket hålls utanför: " + yrke.trim() };
  }
  for (const r of STOPP){
    const m = allt.match(r);
    if (m) return { ut: "hinder: " + m[0] };
  }

  // Minst ett positivt tecken krävs, eftersom vi bara ser början av texten
  const skal = [];
  let p = 0;
  for (const r of POSITIVA){
    const m = allt.match(r);
    if (m){ p += 4; skal.push("+4 " + m[0].toLowerCase()); break; }
  }
  if (!p) return { ut: "inget som säger att erfarenhet inte krävs" };

  const flaggor = [];
  for (const [r, text2] of FLAGGOR){
    if (r.test(allt)) flaggor.push(text2);
  }
  return { p: p + (flaggor.length ? 0 : 2), skal, flaggor };
}

async function kor(){
  const n = nyckel();
  const funna = new Map();
  let anrop = 0;

  for (const fras of SOKNINGAR){
    for (let sida = 1; sida <= SIDOR; sida++){
      let d;
      try {
        d = await hamtaMedForsok(fras, sida, n); anrop++;
      } catch (e){
        console.log("Hoppar över:", e.message); break;
      }
      for (const r of (d.results || [])){
        if (!r || !r.id) continue;
        /* Adzuna hämtar från flera jobbsajter, så samma annons dyker upp
           med olika id. Nyckeln blir titel plus arbetsgivare i stället. */
        const nyckel = ((r.title || "") + "|" + ((r.company || {}).display_name || ""))
          .toLowerCase().replace(/\s+/g, " ").trim();
        if (!funna.has(nyckel)) funna.set(nyckel, r);
      }
      await sov(PAUS_MS);
    }
    console.log(SOKNINGAR.indexOf(fras) + 1 + "/" + SOKNINGAR.length
      + "  " + fras.padEnd(26) + funna.size + " annonser hittills");
  }

  const jobb = [];
  let bort = 0;
  for (const r of funna.values()){
    const titel = rensa(r.title);
    const text = rensa(r.description);
    const dom = bedom(titel, text, (r.category || {}).label || "");
    if (dom.ut){ bort++; continue; }

    const plats = (r.location || {}).display_name || "";
    jobb.push({
      titel,
      arbetsgivare: (r.company || {}).display_name || "",
      ort: plats.split(",")[0].trim(),
      omrade: plats,
      omfattning: r.contract_time === "part_time" ? "Part time"
                : r.contract_time === "full_time" ? "Full time" : "",
      anstallningsform: r.contract_type || "",
      kategori: (r.category || {}).label || "",
      beskrivning: text.slice(0, 400),
      lank: r.redirect_url || "",
      lon: (r.salary_min && !r.salary_is_predicted)
        ? Math.round(r.salary_min) + (r.salary_max && r.salary_max !== r.salary_min
            ? " till " + Math.round(r.salary_max) : "")
        : "",
      lonUppskattad: !!r.salary_is_predicted,
      publicerad: r.created || "",
      poang: dom.p,
      skal: dom.skal,
      flaggor: dom.flaggor,
      minstaAlder: MINSTA_ALDER,
      chansniva: dom.p >= 6 ? "hog" : "medel"
    });
  }

  jobb.sort((a, b) => b.poang - a.poang);
  const tid = new Date().toISOString();

  if (!fs.existsSync("labb")) fs.mkdirSync("labb");
  fs.writeFileSync("labb/ukjobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("labb/ukjobb.js",
    'const UK_HAMTAD = "' + tid + '";\n' +
    "const UKJOBB = " + JSON.stringify(jobb) + ";");

  console.log("");
  console.log("Anrop: " + anrop + ". Hittade " + funna.size
    + " annonser, " + jobb.length + " kvar, " + bort + " bortsorterade.");
  console.log("De tio bästa:");
  for (const j of jobb.slice(0, 10)){
    console.log("  " + String(j.poang).padStart(2) + "  "
      + j.titel.slice(0, 44).padEnd(46) + j.ort.slice(0, 18));
  }
}

kor().catch(e => { console.error("AVBRYTER:", e.message); process.exit(1); });
