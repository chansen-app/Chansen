/*  Labb: brittiska jobb från Reed
 *
 *  Skillnaden mot hamta-uk.js, som använder Adzuna, är att Reed ger
 *  hela annonstexten. Därför kan den svenska metoden användas rakt av:
 *  läsa hela texten och sortera bort hinder, i stället för att leta
 *  efter annonser som själva påstår att erfarenhet inte krävs.
 *
 *  Ligger i mappen labb och publiceras aldrig, utom datafilen som
 *  skrivs till docs/labb så att prototypsidan kan läsa den.
 *
 *  Kör med:   node .\labb\hamta-reed.js
 *  Resultat:  labb/reedjobb.json och docs/labb/reed-jobb.js
 *
 *  Nyckel:
 *  Registrera gratis på reed.co.uk/developers/jobseeker. Lägg nyckeln
 *  som Secret på GitHub med namnet REED_KEY.
 *
 *  Reed använder basic-autentisering där nyckeln är användarnamnet och
 *  lösenordet är tomt.
 */

const fs = require("fs");

const SOK = "https://www.reed.co.uk/api/1.0/search";
const DETALJ = "https://www.reed.co.uk/api/1.0/jobs/";
const PER_SIDA = 100;          // Reeds tak
const MAX_DETALJER = 400;      // hur många hela texter vi hämtar
const PAUS_MS = 250;

/* Sökord som fångar instegsjobb. Reed söker i titel och beskrivning. */
const SOKNINGAR = [
  "warehouse operative", "kitchen porter", "cleaner", "care assistant",
  "retail assistant", "production operative", "delivery driver",
  "catering assistant", "support worker", "no experience"
];

/* ── hinder i annonstexten ──────────────────────────────────────────
   Nu när vi ser hela texten kan vi sortera bort som i Sverige.     */
const STOPP = [
  /\b\d+\+?\s*(?:years?|yrs?)(?:'|’)?\s+(?:of\s+)?experience\b/i,
  /(?<!\bno\s)(?<!\bnot\s)\bexperience\s+(?:is\s+)?(?:required|essential)\b/i,
  /\bminimum\s+of\s+\d+\s*(?:months?|years?)\b/i,
  /\bat\s+least\s+\d+\s*(?:months?|years?)\b/i,
  /\bproven\s+(?:track\s+record|experience)\b/i,
  /\bmust\s+have\s+experience\b/i,

  /\bdegree\b/i, /\bgraduate\b/i, /\bnvq\s*(?:level\s*)?[2-5]\b/i,
  /\bhnd\b/i, /\bhnc\b/i, /\bqualified\b/i,
  /\bqualification\s+(?:is\s+)?(?:required|essential)\b/i,
  /\bregistered\s+(?:nurse|midwife)\b/i, /\bnmc\b/i, /\bgphc\b/i,

  /\bcscs\s+card\b/i, /\bcpcs\b/i, /\bgas\s+safe\b/i, /\b18th\s+edition\b/i,
  /\bhgv\b/i, /\blgv\b/i, /\bclass\s*[12]\b/i, /\bcategory\s*[cd]\b/i,
  /\bforklift\s+licen[cs]e\b/i, /\breach\s+truck\b/i, /\bcounterbalance\b/i,
  /\bflt\b/i, /\bsia\s+licen[cs]e\b/i, /\bteaching\s+qualification\b/i,
  /\bdriving\s+licen[cs]e\s+(?:is\s+)?essential\b/i,

  /\bcommission\s+only\b/i, /\buncapped\s+commission\b/i,
  /\bself[-\s]employed\b/i, /\bott?e\b/i,
  /\bplacement\s+program(?:me)?\b/i, /\bbootcamp\b/i,
  /\bcourse\s+fee\b/i, /\bself[-\s]funded\b/i,
  /\bintern(?:ship)?\b/i, /\bvolunteer(?:ing)?\b/i, /\bunpaid\b/i,

  /\bbritish\s+army\b/i, /\bsoldier\b/i, /\barmed\s+forces\b/i,

  /\bdata\s+analysis\b/i, /\bcompliance\b/i, /\bstakeholders?\b/i,
  /\bkpis?\b/i, /\bpayroll\b/i
];

/* ── tecken på att arbetsgivaren lär upp ────────────────────────── */
const POSITIVA = [
  [/\bno\s+(?:previous\s+)?experience\s+(?:is\s+)?(?:required|necessary|needed)\b/i, 5],
  [/\bexperience\s+(?:is\s+)?not\s+(?:required|necessary|needed|essential)\b/i, 5],
  [/\bfull\s+training\s+(?:is\s+)?(?:provided|given)\b/i, 4],
  [/\btraining\s+will\s+be\s+provided\b/i, 4],
  [/\bwe\s+will\s+train\s+you\b/i, 4],
  [/\bon[-\s]the[-\s]job\s+training\b/i, 3],
  [/\bfull\s+induction\b/i, 2],
  [/\bentry[-\s]level\b/i, 2],
  [/\bno\s+experience\b/i, 3],
  [/\bwillingness\s+to\s+learn\b/i, 2],
  [/\bfriendly\s+team\b/i, 1]
];

const YRKESSTOPP = [
  "nurse", "midwife", "doctor", "pharmacist", "dentist", "physiotherapist",
  "solicitor", "accountant", "engineer", "architect", "surveyor",
  "electrician", "plumber", "welder", "teacher", "lecturer",
  "social worker", "developer", "analyst", "consultant", "manager",
  "director", "supervisor", "head of", "senior ", "specialist",
  "trainer", "assessor", "tutor", "instructor", "sales", "seller",
  "recruitment consultant", "vekter"
];

const FLAGGOR = [
  [/\bdbs\s+(?:check|clearance)\b/i, "kräver DBS-kontroll"],
  [/\bown\s+(?:car|transport|vehicle)\b/i, "kräver egen bil"],
  [/\bdriving\s+licen[cs]e\b/i, "nämner körkort"],
  [/\bnights?\b|\bnight\s+shifts?\b/i, "nattarbete"],
  [/\bzero\s+hours?\b/i, "nolltimmarsavtal"],
  [/\bweekend\b/i, "helgarbete"],
  [/\bcommission\b/i, "provision utöver lön"]
];

/* Reglerna för under 18 sätts av varje kommun i Storbritannien och
   kräver ofta arbetstillstånd från skolan. Det går inte att läsa ut
   ur en annons, så allt markeras som 18 år.                        */
const MINSTA_ALDER = 18;

// Minimilön per timme sedan 1 april 2026. Ses över varje april.
const MINLON = { vuxen: 12.71, ungdom: 10.85, under18: 8.00 };

const GILTIGA = ["Sales", "Customer service", "Retail", "Warehouse",
  "Transport and delivery", "Hospitality", "Cleaning", "Care", "Schools",
  "Construction", "Manufacturing", "Office", "Creative",
  "Animals and nature", "Other"];

const KATEGORIER = [
  [/retail|shop|store|sales assistant/i, "Retail"],
  [/warehouse|logistics|picker|packer|distribution/i, "Warehouse"],
  [/kitchen|chef|catering|hospitality|waiter|waitress|bar\b/i, "Hospitality"],
  [/care|support worker|healthcare|nursing home/i, "Care"],
  [/clean|housekeep|domestic/i, "Cleaning"],
  [/school|teaching assistant|nursery|childcare/i, "Schools"],
  [/labour|construction|site operative|builder/i, "Construction"],
  [/production|factory|assembly|manufacturing/i, "Manufacturing"],
  [/customer service|call cent|contact cent/i, "Customer service"],
  [/driver|delivery|courier|transport/i, "Transport and delivery"],
  [/admin|office|reception/i, "Office"],
  [/farm|animal|garden|groundskeep/i, "Animals and nature"]
];

function sov(ms){ return new Promise(k => setTimeout(k, ms)); }

function rensa(t){
  return String(t || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&pound;/gi, "£").replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}

function nyckel(){
  const k = (process.env.REED_KEY || "").trim();
  if (!k) throw new Error("Saknar nyckel. Lägg REED_KEY som Secret på GitHub.");
  // Reed vill ha nyckeln som användarnamn och tomt lösenord
  return "Basic " + Buffer.from(k + ":").toString("base64");
}

async function hamta(url, auth){
  const svar = await fetch(url, { headers: { Authorization: auth } });
  if (!svar.ok) throw new Error("Status " + svar.status + " för " + url.slice(0, 70));
  return svar.json();
}

function kategori(titel, text){
  const allt = titel + " " + text;
  for (const [r, namn] of KATEGORIER) if (r.test(allt)) return namn;
  return "Other";
}

/* Timlönen jämförd med minimilönen. Reed anger årslön, så vi räknar
   om vid behov. Under minimilönen för alla åldrar sorteras bort.   */
function lonOk(r, text){
  const min = Number(r.minimumSalary || 0);
  if (!min) return { ok: true, text: "", flagga: "lön ej angiven" };

  const timlon = /per hour|an hour|hourly|ph\b/i.test(text) || min < 500;
  const perTimme = timlon ? min : min / (52 * 37.5);

  if (perTimme < MINLON.under18 * 0.95) {
    return { ok: false, skal: "under minimilönen: " + perTimme.toFixed(2) };
  }
  return {
    ok: true,
    text: timlon ? "GBP " + min + " per hour"
                 : "GBP " + Math.round(min) + " per year",
    flagga: perTimme < MINLON.vuxen ? "under minimilönen för 21 år och äldre" : ""
  };
}

function bedom(titel, text){
  const t = (titel || "").toLowerCase();
  const allt = titel + " " + text;

  for (const yrke of YRKESSTOPP){
    if (t.includes(yrke)) return { ut: "yrket hålls utanför: " + yrke.trim() };
  }
  for (const r of STOPP){
    const m = allt.match(r);
    if (m) return { ut: "hinder: " + m[0] };
  }

  let p = 0;
  const skal = [];
  for (const [r, poang] of POSITIVA){
    const m = allt.match(r);
    if (m){ p += poang; skal.push("+" + poang + " " + m[0].toLowerCase()); }
  }
  if (p < 3) return { ut: "inget som tyder på att de lär upp" };

  const flaggor = [];
  for (const [r, txt] of FLAGGOR) if (r.test(allt)) flaggor.push(txt);

  return { p, skal: skal.slice(0, 4), flaggor };
}

async function kor(){
  const auth = nyckel();
  const funna = new Map();
  let anrop = 0;

  for (const fras of SOKNINGAR){
    const url = SOK + "?keywords=" + encodeURIComponent(fras)
      + "&resultsToTake=" + PER_SIDA + "&postedByDirectEmployer=false";
    let d;
    try { d = await hamta(url, auth); anrop++; }
    catch (e){ console.log("Hoppar över:", e.message); continue; }

    for (const r of (d.results || [])){
      if (!r || !r.jobId) continue;
      const n = ((r.jobTitle || "") + "|" + (r.employerName || "")).toLowerCase().trim();
      if (!funna.has(n)) funna.set(n, r);
    }
    console.log((SOKNINGAR.indexOf(fras) + 1) + "/" + SOKNINGAR.length + "  "
      + fras.padEnd(22) + funna.size + " annonser hittills");
    await sov(PAUS_MS);
  }

  /* Hela texten hämtas per annons. Det är det som gör Reed värdefullt,
     men också det som kostar anrop, så vi tar ett tak.              */
  const lista = [...funna.values()].slice(0, MAX_DETALJER);
  console.log("\nHämtar hela texten för " + lista.length + " annonser.");

  const jobb = [];
  let bort = 0, fel = 0;

  for (const r of lista){
    let d;
    try { d = await hamta(DETALJ + r.jobId, auth); anrop++; }
    catch (e){ fel++; await sov(PAUS_MS); continue; }

    const titel = rensa(d.jobTitle || r.jobTitle);
    const text = rensa(d.jobDescription || "");
    if (text.length < 120){ bort++; await sov(PAUS_MS); continue; }

    const dom = bedom(titel, text);
    if (dom.ut){ bort++; await sov(PAUS_MS); continue; }

    const lon = lonOk(r, text);
    if (!lon.ok){ bort++; await sov(PAUS_MS); continue; }

    const ort = String(d.locationName || r.locationName || "").trim();
    const flaggor = dom.flaggor.slice();
    if (lon.flagga) flaggor.push(lon.flagga);

    jobb.push({
      titel,
      arbetsgivare: d.employerName || r.employerName || "",
      ort,
      lan: ort,
      omrade: ort,
      omfattning: r.partTime ? "Part time" : (r.fullTime ? "Full time" : ""),
      anstallningsform: r.contractType === "permanent" ? "Permanent"
                      : r.contractType === "temp" ? "Temporary" : "",
      kategori: kategori(titel, text),
      beskrivning: text.slice(0, 400),
      lank: d.jobUrl || r.jobUrl || "",
      lon: lon.text,
      lonform: "",
      publicerad: r.date || "",
      sistaAnsokningsdag: r.expirationDate || "",
      poang: dom.p,
      sortpoang: dom.p * 10,
      skal: dom.skal,
      flaggor,
      minstaAlder: MINSTA_ALDER,
      minderarigOk: false,
      nattarbete: flaggor.indexOf("nattarbete") > -1,
      erfarenhetKravs: false,
      nyborjarvanlig: dom.p >= 5,
      nyborjarskal: dom.skal[0] || "",
      korkortKravs: flaggor.indexOf("nämner körkort") > -1,
      utdrag: flaggor.indexOf("kräver DBS-kontroll") > -1 ? "kravs" : "nej",
      bemanning: false,
      provision: false,
      chansniva: dom.p >= 5 ? "hog" : "medel"
    });

    await sov(PAUS_MS);
  }

  jobb.sort((a, b) => b.poang - a.poang);
  const tid = new Date().toISOString();

  if (!fs.existsSync("labb")) fs.mkdirSync("labb");
  fs.writeFileSync("labb/reedjobb.json", JSON.stringify(jobb, null, 2));

  const kommunLan = {};
  for (const j of jobb) if (j.ort) kommunLan[j.ort] = j.lan;
  if (!fs.existsSync("docs/labb")) fs.mkdirSync("docs/labb", { recursive: true });
  fs.writeFileSync("docs/labb/reed-jobb.js",
    'const UPPDATERAD = "' + tid + '";\n' +
    "const JOBB_HAMTAD = UPPDATERAD;\n" +
    "const KOMMUNLAN = " + JSON.stringify(kommunLan) + ";\n" +
    "const JOBB = " + JSON.stringify(jobb) + ";");

  console.log("");
  console.log("Anrop: " + anrop + ". Kvar: " + jobb.length
    + ", bortsorterade: " + bort + ", fel: " + fel);
  console.log("De tio bästa:");
  for (const j of jobb.slice(0, 10)){
    console.log("  " + String(j.poang).padStart(2) + "  "
      + j.titel.slice(0, 42).padEnd(44) + j.ort.slice(0, 18));
  }
}

kor().catch(e => { console.error("AVBRYTER:", e.message); process.exit(1); });
