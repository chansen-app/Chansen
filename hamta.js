const fs = require("fs");

// Titlar som aldrig hor hemma i Chansen. Matchas mot annonsens rubrik.
const YRKESSTOPP = [
  "lakare", "läkare", "sjukskoterska", "sjuksköterska", "barnmorska", "psykolog",
  "tandlakare", "tandläkare", "socionom", "kurator", "logoped", "fysioterapeut",
  "jurist", "advokat", "revisor", "ekonom", "maklare", "mäklare",
  "ingenjor", "ingenjör", "engineer", "utvecklare", "developer", "arkitekt",
  "systemtekniker", "drifttekniker", "programmerare", "data scientist",
  "larare", "lärare", "forskollarare", "förskollärare", "pedagog", "rektor",
  "chef", "controller", "specialist", "konsult", "analytiker", "projektledare",
  "produktagare", "produktägare", "product owner", "scrum",
  "samordnare", "koordinator", "strateg", "senior", "ansvarig",
  "designer", "art director", "copywriter", "key account",
  "manager", "director", "head of", " lead", "supervisor", "expert inom",
  "elektriker", "snickare", "svetsare", "montor", "montör", "mekaniker",
  "underskoterska", "undersköterska"
];

// Formuleringar i annonstexten som betyder att kraven ar for hoga.
const TEXTSTOPP = [
  "ars erfarenhet", "års erfarenhet", "flerarig", "flerårig", "mangarig", "mångårig",
  "erfarenhet kravs", "erfarenhet krävs", "dokumenterad erfarenhet",
  "eftergymnasial", "hogskoleutbildning", "högskoleutbildning",
  "universitetsutbildning", "akademisk examen", "yrkeshogskola", "yrkeshögskola",
  "legitimerad", "legitimation", "behorighet kravs", "behörighet krävs"
];

// Formuleringar som betyder att nyborjare ar valkomna.
const NYBORJARORD = [
  "inga forkunskaper", "inga förkunskaper", "ingen erfarenhet", "ingen tidigare erfarenhet",
  "vi utbildar dig", "vi utbildar", "vi larer dig", "vi lär dig",
  "du behover inte ha jobbat", "du behöver inte ha jobbat",
  "utbildning pa plats", "utbildning på plats", "upplarning pa plats", "upplärning på plats",
  "inget krav pa erfarenhet", "inget krav på erfarenhet",
  "du far full utbildning", "du får full utbildning",
  "perfekt for dig som", "perfekt för dig som", "ditt forsta jobb", "ditt första jobb",
  "vi ser till personliga egenskaper", "vi lagger stor vikt vid personlighet",
  "vi lägger stor vikt vid personlighet"
];

const BRATITEL = [
  "extrajobb", "sommarjobb", "helgjobb", "ferie", "extra personal",
  "extrahjalp", "extrahjälp", "timanstalld", "timanställd", "studerande", "student"
];

function text(a) {
  return ((a.description ? a.description.text : "") + " " + (a.headline || "")).toLowerCase();
}

// Ar annonsen nyborjarvanlig? Returnerar skalet, eller null.
function nyborjarskal(a) {
  const t = text(a);
  for (const ord of NYBORJARORD) {
    if (t.includes(ord)) return "annonsen sager att erfarenhet inte behovs";
  }
  if (a.experience_required === false) return "arbetsgivaren har kryssat i att erfarenhet inte kravs";
  return null;
}

function poang(a) {
  const titel = (a.headline || "").toLowerCase();
  const t = text(a);
  let p = 0;

  for (const ord of YRKESSTOPP) {
    if (titel.includes(ord)) return -20;
  }
  for (const ord of TEXTSTOPP) {
    if (t.includes(ord)) return -20;
  }

  for (const ord of BRATITEL) {
    if (titel.includes(ord)) { p += 3; break; }
  }

  if (nyborjarskal(a)) p += 3;

  const omfattning = (a.working_hours_type ? a.working_hours_type.label : "") || "";
  if (omfattning.toLowerCase().includes("deltid")) p += 2;

  const form = (a.employment_type ? a.employment_type.label : "") || "";
  const f = form.toLowerCase();
  if (f.includes("behov") || f.includes("sommar") || f.includes("sasong") || f.includes("säsong")) p += 2;

  if (a.driving_license_required === true) p -= 3;

  return p;
}

// Annonser som lovar hoga inkomster utan fast lon. Vanlig fallgrop for unga.
function provisionsvarning(a) {
  const t = text(a);
  const ord = ["endast provision", "ren provision", "provisionsbaserad lon", "provisionsbaserad lön",
               "ingen fast lon", "ingen fast lön", "obegransad inkomst", "obegränsad inkomst",
               "tjana upp till", "tjäna upp till", "egen f-skatt", "eget foretag kravs", "eget företag krävs",
               "bli din egen chef", "digitala nomader"];
  for (const o of ord) { if (t.includes(o)) return true; }
  return false;
}

function utdragskrav(a) {
  const t = (a.description ? a.description.text : "").toLowerCase();
  if (t.indexOf("belastningsregister") > -1 || t.indexOf("registerutdrag") > -1) return "kravs";
  return "framgar inte";
}

// Nattarbete: annonser som namner kvalls- eller nattpass.
function nattarbete(a) {
  const t = text(a);
  const ord = ["nattarbete", "nattpass", "nattskift", "nattjobb", "arbete pa natten",
               "arbete på natten", "kvallar och natter", "kvällar och nätter", "obekvam arbetstid",
               "obekväm arbetstid", "ob-tillagg", "ob-tillägg", "skiftarbete", "treskift", "tvaskift", "tvåskift"];
  for (const o of ord) { if (t.includes(o)) return true; }
  return false;
}

async function hamtaJobb() {
  const jobb = [];
  const sidor = 20;
  const sedda = {};

  for (let i = 0; i < sidor; i++) {
    const offset = i * 100;
    const url = "https://jobsearch.api.jobtechdev.se/search?limit=100&offset=" + offset;

    let data;
    try {
      const svar = await fetch(url);
      if (!svar.ok) { console.log("Stopp vid offset " + offset + ", status " + svar.status); break; }
      data = await svar.json();
    } catch (fel) {
      console.log("Nataverksfel vid offset " + offset + ": " + fel.message);
      break;
    }

    if (!data.hits || data.hits.length === 0) break;

    for (const a of data.hits) {
      if (!a.webpage_url || sedda[a.webpage_url]) continue;
      const p = poang(a);
      if (p < 0) continue;
      sedda[a.webpage_url] = true;

      const skal = nyborjarskal(a);

      jobb.push({
        titel: a.headline,
        arbetsgivare: a.employer ? a.employer.name : "",
        ort: a.workplace_address && a.workplace_address.municipality ? a.workplace_address.municipality : "",
        lan: a.workplace_address && a.workplace_address.region ? a.workplace_address.region : "",
        omfattning: a.working_hours_type ? a.working_hours_type.label : "",
        anstallningsform: a.employment_type ? a.employment_type.label : "",
        nyborjarvanlig: skal !== null,
        nyborjarskal: skal || "",
        erfarenhetKravs: a.experience_required,
        korkortKravs: a.driving_license_required,
        nattarbete: nattarbete(a),
        provisionslon: provisionsvarning(a),
        utdrag: utdragskrav(a),
        poang: p,
        chansniva: p >= 5 ? "hog" : (p >= 2 ? "medel" : "lag"),
        lank: a.webpage_url,
        sistaAnsokningsdag: a.application_deadline
      });
    }

    console.log("Hämtat sida " + (i + 1) + " av " + sidor);
  }

  if (jobb.length === 0) {
    console.log("Inga jobb hämtade. Skriver inga filer, den gamla listan får ligga kvar.");
    process.exit(1);
  }

  jobb.sort(function (x, y) { return y.poang - x.poang; });

  const uppdaterad = new Date().toISOString();
  const js = "const JOBB = " + JSON.stringify(jobb) + ";\nconst UPPDATERAD = " + JSON.stringify(uppdaterad) + ";";

  fs.writeFileSync("public/jobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("public/jobb.js", js);
  fs.writeFileSync("docs/jobb.js", js);

  const orter = {};
  let hog = 0, nyb = 0, natt = 0, prov = 0;
  for (const j of jobb) {
    if (j.ort) orter[j.ort] = true;
    if (j.chansniva === "hog") hog++;
    if (j.nyborjarvanlig) nyb++;
    if (j.nattarbete) natt++;
    if (j.provisionslon) prov++;
  }

  console.log("Klart. " + jobb.length + " jobb i " + Object.keys(orter).length + " kommuner.");
  console.log("Hög chans: " + hog + ". Nybörjarvänliga: " + nyb + ".");
  console.log("Nämner natt eller skift: " + natt + ". Provisionslön: " + prov + ".");
}

hamtaJobb();
