/*  Labb: jobb som kräver en viss examen
 *
 *  Motsatsen till Chansen. I stället för att sålla bort annonser med höga
 *  krav letar den upp dem, och sorterar dem efter vilken examen som krävs.
 *
 *  Ligger i mappen labb och publiceras aldrig. GitHub Pages tar bara det
 *  som ligger i mappen docs.
 *
 *  Kör med:   node .\labb\hamta-utbildning.js
 *  Resultat:  labb/utbildningsjobb.json
 *
 *  Namnen på utbildningarna och nivåerna följer Arbetsförmedlingens och
 *  SCB:s utbildningstaxonomi, så de stämmer med hur myndigheter benämner
 *  dem. Tio utbildningar att börja med. Fungerar de bra är det värt att
 *  bygga ut, och då finns 118 inriktningar att välja bland i taxonomin.
 */

const fs = require("fs");

// Hur många sidor per sökord. Höj när det fungerar som du vill.
const SIDOR_PER_SOKNING = 3;

// ── De tio utbildningarna ─────────────────────────────────────────────
//
//  namn      Vad användaren väljer i listan.
//  niva      Utbildningsnivå enligt taxonomin.
//  omrade    Inriktning enligt taxonomin.
//  sok       Vad vi söker på i Platsbanken för att hitta kandidaterna.
//  kravord   Ord i annonsen som visar att just den här examen krävs.
//  stoppord  Ord i titeln som betyder att träffen är fel, trots kravord.
//
const UTBILDNINGAR = [
  {
    namn: "Sjuksköterskeexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Omvårdnad",
    sok: ["sjuksköterska", "specialistsjuksköterska", "distriktssköterska"],
    kravord: ["sjukskoterskeexamen", "sjuksköterskeexamen", "legitimerad sjukskoterska",
              "legitimerad sjuksköterska", "leg. sjukskoterska", "leg. sjuksköterska",
              "leg sjukskoterska", "leg sjuksköterska", "sjukskoterskelegitimation",
              "sjuksköterskelegitimation"],
    stoppord: ["undersköterska", "underskoterska", "vårdbiträde", "vardbitrade"]
  },
  {
    namn: "Socionomexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Socialt arbete",
    sok: ["socialsekreterare", "socionom", "kurator"],
    kravord: ["socionomexamen", "socionom", "socionomutbildning"],
    stoppord: ["behandlingsassistent", "boendestödjare", "boendestodjare"]
  },
  {
    namn: "Förskollärarexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Barn och ungdom",
    sok: ["förskollärare", "pedagog förskola"],
    kravord: ["forskollararexamen", "förskollärarexamen", "legitimerad forskollarare",
              "legitimerad förskollärare", "forskollararlegitimation",
              "förskollärarlegitimation", "utbildad forskollarare", "utbildad förskollärare"],
    stoppord: ["barnskötare", "barnskotare"]
  },
  {
    namn: "Grundlärarexamen",
    niva: "Eftergymnasial utbildning, 4 år",
    omrade: "Lärarutbildning för grundskolans tidiga åldrar",
    sok: ["grundskollärare", "lärare årskurs", "klasslärare"],
    kravord: ["lararexamen", "lärarexamen", "legitimerad larare", "legitimerad lärare",
              "lararlegitimation", "lärarlegitimation", "grundlararexamen",
              "grundlärarexamen", "behorig larare", "behörig lärare"],
    stoppord: ["elevassistent", "resurspedagog"]
  },
  {
    namn: "Civilingenjörsexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Industriell ekonomi och organisation",
    sok: ["civilingenjör", "konstruktör", "beräkningsingenjör"],
    kravord: ["civilingenjorsexamen", "civilingenjörsexamen", "civilingenjor",
              "civilingenjör", "master of science in engineering"],
    stoppord: ["högskoleingenjör", "hogskoleingenjor", "gymnasieingenjör"]
  },
  {
    namn: "Ekonomexamen, kandidat",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Företagsekonomi, handel och administration",
    sok: ["ekonom", "redovisningsekonom", "controller"],
    kravord: ["ekonomexamen", "civilekonom", "kandidatexamen i ekonomi",
              "kandidatexamen inom ekonomi", "kandidatexamen i foretagsekonomi",
              "kandidatexamen i företagsekonomi", "ekonomutbildning",
              "akademisk examen inom ekonomi", "hogskoleutbildning inom ekonomi",
              "högskoleutbildning inom ekonomi"],
    stoppord: []
  },
  {
    namn: "Juristexamen",
    niva: "Eftergymnasial utbildning, 4 år",
    omrade: "Juridik och rättsvetenskap",
    sok: ["jurist", "bolagsjurist", "handläggare juridik"],
    kravord: ["juristexamen", "jur.kand", "jur kand", "juris kandidatexamen",
              "juridisk examen", "juristutbildning"],
    stoppord: ["juristassistent"]
  },
  {
    namn: "Vård- och omsorgsexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Omvårdnad",
    sok: ["undersköterska", "vårdbiträde", "stödassistent"],
    kravord: ["underskoterskeutbildning", "undersköterskeutbildning",
              "utbildad underskoterska", "utbildad undersköterska",
              "vard- och omsorgsprogrammet", "vård- och omsorgsprogrammet",
              "vardutbildning", "vårdutbildning", "skyddad yrkestitel underskoterska",
              "skyddad yrkestitel undersköterska"],
    stoppord: ["sjuksköterska", "sjukskoterska"]
  },
  {
    namn: "Systemvetarexamen, kandidat",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Systemvetenskap och informatik",
    sok: ["systemutvecklare", "systemvetare", "IT-konsult"],
    kravord: ["systemvetenskap", "systemvetare", "kandidatexamen i datavetenskap",
              "kandidatexamen inom data", "datavetenskaplig examen",
              "hogskoleutbildning inom it", "högskoleutbildning inom it",
              "akademisk examen inom it"],
    stoppord: []
  },
  {
    namn: "Medicinsk sekreterare, yrkeshögskola",
    niva: "Eftergymnasial utbildning, 2 år",
    omrade: "Kontorsservice och sekreterartjänster",
    sok: ["medicinsk sekreterare", "vårdadministratör", "läkarsekreterare"],
    kravord: ["medicinsk sekreterare", "vardadministrator", "vårdadministratör",
              "lakarsekreterare", "läkarsekreterare",
              "yrkeshogskoleutbildning till medicinsk", "yrkeshögskoleutbildning till medicinsk"],
    stoppord: []
  }
];

// Vissa ord är svaga. Ordet "socionom" förekommer i massor av annonser
// som inte kräver socionomexamen, till exempel "du samarbetar med
// socionomer". För de orden kollar vi vad som står runt omkring, precis
// som Chansen gör med truckkort.
const SVAGA_ORD = [
  "socionom", "civilingenjor", "civilingenjör", "systemvetenskap", "systemvetare",
  "medicinsk sekreterare", "vardadministrator", "vårdadministratör",
  "lakarsekreterare", "läkarsekreterare", "vardutbildning", "vårdutbildning"
];

const KRAVSIGNAL = [
  "krav", "kravs", "krävs", "maste", "måste", "ska ha", "ska du ha", "skall ha",
  "vi soker dig som har", "vi söker dig som har", "du har", "du ar", "du är",
  "examen", "utbildning", "utbildad", "behorig", "behörig", "legitimerad",
  "legitimation", "meriterande", "kvalifikation", "vi krav", "erfordras",
  "forutsatter", "förutsätter", "innehar"
];

function kravNara(text, ord) {
  let i = text.indexOf(ord);
  while (i > -1) {
    const omkring = text.slice(Math.max(0, i - 120), i + ord.length + 120);
    for (const sig of KRAVSIGNAL) {
      if (omkring.indexOf(sig) > -1) return true;
    }
    i = text.indexOf(ord, i + 1);
  }
  return false;
}

function slat(v) {
  return String(v == null ? "" : v).toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
}

function finns(text, lista) {
  const platt = slat(text);
  for (const ord of lista) {
    if (text.indexOf(ord) > -1) return ord;
    if (platt.indexOf(slat(ord)) > -1) return ord;
  }
  return null;
}

async function hamta() {
  const sedda = {};
  const jobb = [];
  let granskade = 0;
  let svagaBort = 0;

  for (const u of UTBILDNINGAR) {
    let hittade = 0;

    for (const term of u.sok) {
      for (let sida = 0; sida < SIDOR_PER_SOKNING; sida++) {
        const url = "https://jobsearch.api.jobtechdev.se/search?q=" +
                    encodeURIComponent(term) + "&limit=100&offset=" + (sida * 100);
        let data;
        try {
          const svar = await fetch(url);
          if (!svar.ok) continue;
          data = await svar.json();
        } catch (e) { continue; }
        if (!data.hits || !data.hits.length) continue;

        for (const a of data.hits) {
          const nyckel = a.id + "|" + u.namn;
          if (sedda[nyckel]) continue;
          sedda[nyckel] = true;
          granskade++;

          const text = ((a.description ? a.description.text : "") + " " +
                        (a.headline || "")).toLowerCase();

          const krav = finns(text, u.kravord);
          if (!krav) continue;

          // Är ordet svagt måste det också stå i ett sammanhang som visar
          // att det är ett krav, inte bara omnämnt i förbifarten.
          if (SVAGA_ORD.indexOf(krav) > -1 && !kravNara(text, krav)) { svagaBort++; continue; }
          if (u.stoppord.length &&
              finns((a.headline || "").toLowerCase(), u.stoppord)) continue;

          jobb.push({
            utbildning: u.namn,
            niva: u.niva,
            omrade: u.omrade,
            avslojatAv: krav,
            titel: a.headline,
            arbetsgivare: a.employer ? a.employer.name : "",
            ort: a.workplace_address ? a.workplace_address.municipality : "",
            lan: a.workplace_address ? a.workplace_address.region : "",
            yrke: a.occupation ? a.occupation.label : "",
            omfattning: a.working_hours_type ? a.working_hours_type.label : "",
            anstallningsform: a.employment_type ? a.employment_type.label : "",
            lonform: (a.salary_type && a.salary_type.label) || "",
            lank: a.webpage_url,
            publicerad: a.publication_date || null,
            sista: a.application_deadline
          });
          hittade++;
        }
      }
    }
    console.log("  " + u.namn + ": " + hittade + " jobb");
  }

  // ta bort dubbletter inom samma utbildning
  const unika = [];
  const set = {};
  for (const j of jobb) {
    const k = j.utbildning + "|" + j.lank;
    if (set[k]) continue;
    set[k] = true;
    unika.push(j);
  }

  fs.writeFileSync("labb/utbildningsjobb.json", JSON.stringify(unika, null, 2));

  console.log("");
  console.log("Granskade annonser: " + granskade);
  console.log("Jobb med identifierat utbildningskrav: " + unika.length);
  console.log("Stoppade för att ordet bara nämndes i förbifarten: " + svagaBort);

  const orter = {};
  for (const j of unika) if (j.ort) orter[j.ort] = (orter[j.ort] || 0) + 1;
  console.log("Kommuner: " + Object.keys(orter).length);
  console.log("");
  console.log("Sparat i labb/utbildningsjobb.json. Ingenting av det publiceras.");
}

hamta();
