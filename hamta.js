const fs = require("fs");

// ── ord i titeln som gör att ett jobb aldrig visas ────────────────────
const YRKESSTOPP = [
  "lakare","läkare","sjukskoterska","sjuksköterska","barnmorska","psykolog",
  "tandlakare","tandläkare","socionom","jurist","advokat","ingenjor","ingenjör",
  "utvecklare","arkitekt","revisor","larare","lärare","forskollarare","förskollärare",
  "chef","controller","specialist","konsult","analytiker","projektledare",
  "intendent","antikvarie","bibliotekarie","kurator","handlaggare","handläggare",
  "samordnare","koordinator","ekonom","redovisning","rekryterare",
  "forskare","doktorand","adjunkt","lektor","professor","veterinar","veterinär",
  "arbetsterapeut","fysioterapeut","sjukgymnast","logoped","dietist","optiker",
  "farmaceut","apotekare","tekniker","elektriker","rormokare","rörmokare",
  "snickare","svetsare","maskinforare","maskinförare","chauffor","chaufför",
  "pilot","polis","brandman","officer","maklare","mäklare","designer",
  "art director","copywriter","fotograf","journalist","redaktor","redaktör"
];

// ── text som avslöjar krav på utbildning eller lång erfarenhet ─────────
const TEXTSTOPP = [
  "examen","legitimation","legitimerad","hogskoleutbildning","högskoleutbildning",
  "universitetsutbildning","akademisk utbildning","eftergymnasial","yrkeshogskola",
  "yrkeshögskola","relevant utbildning","flera ars erfarenhet","flera års erfarenhet",
  "dokumenterad erfarenhet","gedigen erfarenhet","minst 2 ars","minst 2 års",
  "minst 3 ars","minst 3 års","minst 5 ars","minst 5 års","minst tva ars",
  "minst två års","minst tre ars","minst tre års"
];

// ── titlar som är typiska ingångsjobb ─────────────────────────────────
const BRATITEL = [
  "extrajobb","sommarjobb","helgjobb","ferie","extra personal","extrahjalp",
  "extrahjälp","timanstalld","timanställd","studerande","student","feriearbete",
  "sasongsjobb","säsongsjobb"
];
const INGANGSJOBB = [
  "butikssaljare","butikssäljare","butiksmedarbetare","butiksbitrade","butiksbiträde",
  "kassa","lagerarbetare","lagermedarbetare","orderplockare","plockare","terminalarbetare",
  "stad","städ","lokalvardare","lokalvårdare","cleaner","diskare","kokbitrade",
  "koksbitrade","köksbiträde","cafebitrade","cafébiträde","barista","servitris","servitor",
  "servitör","runner","host","hostess","varuplockare","varupafyllare","varupåfyllare",
  "budbil","tidningsbud","utdelare","vaktmastare","vaktmästare","skolmaltid","skolmåltid",
  "maltidsbitrade","måltidsbiträde","personlig assistent","stodassistent","stödassistent"
];

// ── sådant en minderårig inte får eller bör göra ──────────────────────
const EJ_MINDERARIG = [
  "vaktare","väktare","ordningsvakt","bygg","byggnads","stallning","ställning",
  "truck","maskinforare","maskinförare","nattarbete","bartender",
  "alkohol","systembolag","kemikalie","hogtryck","högtryck","asfalt",
  "svets","industri","fabrik","slakteri","skogsbruk","lantbruk","gruv"
];

const POSITIV_TEXT = [
  "inga forkunskaper","inga förkunskaper","ingen erfarenhet","vi utbildar dig",
  "vi larer dig","vi lär dig","du behover inte ha jobbat","du behöver inte ha jobbat",
  "utbildning pa plats","utbildning på plats","inget krav pa erfarenhet",
  "inget krav på erfarenhet","du behover ingen erfarenhet","du behöver ingen erfarenhet"
];

function harNagot(text, lista) {
  for (const ord of lista) { if (text.indexOf(ord) > -1) return true; }
  return false;
}

function poang(a) {
  const titel = (a.headline || "").toLowerCase();
  const text = ((a.description ? a.description.text : "") + " " + titel).toLowerCase();
  let p = 0;

  if (harNagot(titel, YRKESSTOPP)) return -20;
  if (harNagot(text, TEXTSTOPP)) return -20;

  const positiv = harNagot(text, POSITIV_TEXT);
  if (a.experience_required === true && !positiv) p -= 1;

  if (harNagot(titel, BRATITEL)) p += 3;
  if (harNagot(titel, INGANGSJOBB)) p += 2;
  if (a.experience_required === false) p += 3;
  if (positiv) p += 3;

  const omfattning = ((a.working_hours_type ? a.working_hours_type.label : "") || "").toLowerCase();
  if (omfattning.indexOf("deltid") > -1) p += 2;

  const form = ((a.employment_type ? a.employment_type.label : "") || "").toLowerCase();
  if (form.indexOf("behov") > -1 || form.indexOf("sommar") > -1 ||
      form.indexOf("sasong") > -1 || form.indexOf("säsong") > -1) p += 2;

  if (a.driving_license_required === true) p -= 3;

  return p;
}

function utdragskrav(a) {
  const t = (a.description ? a.description.text : "").toLowerCase();
  if (t.indexOf("belastningsregister") > -1 || t.indexOf("registerutdrag") > -1) return "kravs";
  return "framgar inte";
}

function okForMinderarig(a) {
  const titel = (a.headline || "").toLowerCase();
  const text = ((a.description ? a.description.text : "") + " " + titel).toLowerCase();
  if (harNagot(titel, EJ_MINDERARIG)) return false;
  if (harNagot(text, ["fyllda 18","myndig","minst 18 ar","minst 18 år"])) return false;
  return true;
}

async function hamtaJobb() {
  const jobb = [];
  const nu = new Date();
  const sidor = 20;
  let bortsorterade = 0;

  for (let i = 0; i < sidor; i++) {
    const url = "https://jobsearch.api.jobtechdev.se/search?limit=100&offset=" + (i * 100);
    const svar = await fetch(url);
    if (!svar.ok) { console.log("Stopp vid sida " + (i + 1)); break; }

    const data = await svar.json();
    if (!data.hits || data.hits.length === 0) break;

    for (const a of data.hits) {
      if (a.application_deadline) {
        const slut = new Date(a.application_deadline);
        if (!isNaN(slut) && slut < nu) { bortsorterade++; continue; }
      }

      const p = poang(a);
      if (p < 2) { bortsorterade++; continue; }

      jobb.push({
        titel: a.headline,
        arbetsgivare: a.employer ? a.employer.name : "",
        ort: a.workplace_address && a.workplace_address.municipality ? a.workplace_address.municipality : "",
        omfattning: a.working_hours_type ? a.working_hours_type.label : "",
        anstallningsform: a.employment_type ? a.employment_type.label : "",
        erfarenhetKravs: a.experience_required,
        korkortKravs: a.driving_license_required,
        utdrag: utdragskrav(a),
        minderarigOk: okForMinderarig(a),
        poang: p,
        chansniva: p >= 6 ? "hog" : (p >= 4 ? "medel" : "lag"),
        lank: a.webpage_url,
        sistaAnsokningsdag: a.application_deadline
      });
    }
    console.log("Hämtat sida " + (i + 1) + " av " + sidor);
  }

  jobb.sort(function (x, y) { return y.poang - x.poang; });

  fs.writeFileSync("docs/jobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("docs/jobb.js", "const JOBB = " + JSON.stringify(jobb) + ";");

  const orter = {};
  let hog = 0, medel = 0, lag = 0, minder = 0;
  for (const j of jobb) {
    if (j.ort) orter[j.ort] = true;
    if (j.chansniva === "hog") hog++;
    else if (j.chansniva === "medel") medel++;
    else lag++;
    if (j.minderarigOk) minder++;
  }

  console.log("Klart. " + jobb.length + " jobb i " + Object.keys(orter).length + " kommuner.");
  console.log("Bäst chans: " + hog + ", Värd att söka: " + medel + ", Högre krav: " + lag);
  console.log("Okej för under 18: " + minder);
  console.log("Bortsorterade: " + bortsorterade);
}

hamtaJobb();
