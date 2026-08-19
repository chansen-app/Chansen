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
    namn: "Specialistsjuksköterskeexamen",
    niva: "Eftergymnasial utbildning, 4 år",
    omrade: "Omvårdnad",
    sok: ["specialistsjuksköterska", "anestesisjuksköterska", "operationssjuksköterska"],
    kravord: ["specialistsjukskoterskeexamen", "specialistsjuksköterskeexamen",
              "specialistutbildad sjukskoterska", "specialistutbildad sjuksköterska",
              "specialistsjukskoterska", "specialistsjuksköterska"],
    stoppord: ["undersköterska", "underskoterska"]
  },
  {
    namn: "Barnmorskeexamen",
    niva: "Eftergymnasial utbildning, 4 år",
    omrade: "Omvårdnad",
    sok: ["barnmorska"],
    kravord: ["barnmorskeexamen", "legitimerad barnmorska", "barnmorskelegitimation"],
    stoppord: []
  },
  {
    namn: "Fysioterapeutexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Terapi, rehabilitering och kostbehandling",
    sok: ["fysioterapeut", "sjukgymnast"],
    kravord: ["fysioterapeutexamen", "legitimerad fysioterapeut", "legitimerad sjukgymnast",
              "sjukgymnastexamen"],
    stoppord: []
  },
  {
    namn: "Arbetsterapeutexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Terapi, rehabilitering och kostbehandling",
    sok: ["arbetsterapeut"],
    kravord: ["arbetsterapeutexamen", "legitimerad arbetsterapeut"],
    stoppord: []
  },
  {
    namn: "Psykologexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Psykologi",
    sok: ["psykolog", "PTP-psykolog"],
    kravord: ["psykologexamen", "legitimerad psykolog", "psykologlegitimation"],
    stoppord: ["psykologistudent"]
  },
  {
    namn: "Läkarexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Medicin",
    sok: ["läkare", "specialistläkare", "ST-läkare"],
    kravord: ["lakarexamen", "läkarexamen", "legitimerad lakare", "legitimerad läkare",
              "lakarlegitimation", "läkarlegitimation"],
    stoppord: ["läkarsekreterare", "lakarsekreterare"]
  },
  {
    namn: "Tandläkarexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Odontologi",
    sok: ["tandläkare"],
    kravord: ["tandlakarexamen", "tandläkarexamen", "legitimerad tandlakare",
              "legitimerad tandläkare"],
    stoppord: ["tandsköterska", "tandskoterska", "tandhygienist"]
  },
  {
    namn: "Tandhygienistexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Odontologi",
    sok: ["tandhygienist"],
    kravord: ["tandhygienistexamen", "legitimerad tandhygienist"],
    stoppord: []
  },
  {
    namn: "Högskoleingenjörsexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Maskinteknik och verkstadsteknik",
    sok: ["högskoleingenjör", "produktionsingenjör", "kvalitetsingenjör"],
    kravord: ["hogskoleingenjorsexamen", "högskoleingenjörsexamen",
              "hogskoleingenjor", "högskoleingenjör", "ingenjorsexamen", "ingenjörsexamen"],
    stoppord: ["civilingenjör", "civilingenjor"]
  },
  {
    namn: "Byggingenjörsexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Byggnadsteknik och anläggningsteknik",
    sok: ["byggingenjör", "arbetsledare bygg", "projektledare bygg"],
    kravord: ["byggingenjor", "byggingenjör", "byggnadsingenjor", "byggnadsingenjör",
              "utbildning inom bygg", "hogskoleutbildning inom bygg",
              "högskoleutbildning inom bygg"],
    stoppord: []
  },
  {
    namn: "Gymnasielärarexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Lärarutbildning för gymnasiet",
    sok: ["gymnasielärare", "lärare gymnasiet", "yrkeslärare"],
    kravord: ["amneslararexamen", "ämneslärarexamen", "gymnasielararexamen",
              "gymnasielärarexamen", "yrkeslararexamen", "yrkeslärarexamen",
              "behorig gymnasielarare", "behörig gymnasielärare"],
    stoppord: ["elevassistent"]
  },
  {
    namn: "Fritidspedagogexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Barn och ungdom",
    sok: ["fritidspedagog", "lärare fritidshem"],
    kravord: ["fritidspedagogexamen", "grundlararexamen med inriktning mot arbete i fritidshem",
              "grundlärarexamen med inriktning mot arbete i fritidshem",
              "legitimerad fritidspedagog", "utbildad fritidspedagog"],
    stoppord: ["fritidsledare"]
  },
  {
    namn: "Specialpedagogexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Specialpedagogik",
    sok: ["specialpedagog", "speciallärare"],
    kravord: ["specialpedagogexamen", "speciallararexamen", "speciallärarexamen",
              "utbildad specialpedagog"],
    stoppord: ["elevassistent"]
  },
  {
    namn: "Beteendevetenskaplig examen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Sociologi och beteendevetenskap",
    sok: ["beteendevetare", "HR-specialist", "personalvetare"],
    kravord: ["beteendevetenskaplig examen", "beteendevetare", "personalvetarprogrammet",
              "kandidatexamen i beteendevetenskap", "personalvetare"],
    stoppord: []
  },
  {
    namn: "Civilekonomexamen",
    niva: "Eftergymnasial utbildning, 4 år",
    omrade: "Företagsekonomi, handel och administration",
    sok: ["business controller", "finansanalytiker", "civilekonom"],
    kravord: ["civilekonomexamen", "civilekonom"],
    stoppord: []
  },
  {
    namn: "Revisorsexamen",
    niva: "Eftergymnasial utbildning, 4 år",
    omrade: "Företagsekonomi, handel och administration",
    sok: ["revisor", "auktoriserad revisor", "revisionsbyrå", "redovisningskonsult"],
    kravord: ["revisorsexamen", "auktoriserad revisor", "godkand revisor", "godkänd revisor"],
    stoppord: ["revisorsassistent"]
  },
  {
    namn: "Dataingenjörsexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Datateknik och automation",
    sok: ["dataingenjör", "mjukvaruingenjör", "inbyggda system", "elektronikingenjör"],
    kravord: ["dataingenjorsexamen", "dataingenjörsexamen", "dataingenjor", "dataingenjör",
              "mjukvaruingenjor", "mjukvaruingenjör", "datateknik",
              "hogskoleingenjor inom datateknik", "högskoleingenjör inom datateknik",
              "civilingenjor inom datateknik", "civilingenjör inom datateknik",
              "utbildning inom datateknik", "elektroteknik eller datateknik"],
    stoppord: []
  },
  {
    namn: "Yrkeshögskoleexamen inom IT",
    niva: "Eftergymnasial utbildning, 2 år",
    omrade: "Systemvetenskap och informatik",
    sok: ["webbutvecklare", "IT-tekniker", "systemtekniker", "frontendutvecklare"],
    kravord: ["yrkeshogskoleutbildning inom it", "yrkeshögskoleutbildning inom it",
              "yh-utbildning inom it", "yrkeshogskoleexamen inom it",
              "yrkeshögskoleexamen inom it", "yrkeshogskoleutbildning inom systemutveckling",
              "yrkeshögskoleutbildning inom systemutveckling", "yh-utbildning",
              "yrkeshogskoleutbildning inom data", "yrkeshögskoleutbildning inom data",
              "eftergymnasial utbildning inom it", "utbildning inom it"],
    stoppord: []
  },
  {
    namn: "Bibliotekarieexamen",
    niva: "Eftergymnasial utbildning, 3 år",
    omrade: "Biblioteks- och dokumentationsvetenskap",
    sok: ["bibliotekarie"],
    kravord: ["bibliotekarieexamen", "biblioteks- och informationsvetenskap",
              "utbildad bibliotekarie"],
    stoppord: ["biblioteksassistent"]
  },
  {
    namn: "Veterinärexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Veterinärmedicin",
    sok: ["veterinär", "djursjukskötare"],
    kravord: ["veterinarexamen", "veterinärexamen", "legitimerad veterinar",
              "legitimerad veterinär", "djursjukskotarexamen", "djursjukskötarexamen",
              "legitimerad djursjukskotare", "legitimerad djursjukskötare"],
    stoppord: ["djurvårdare", "djurvardare"]
  },
  {
    namn: "Apotekarexamen",
    niva: "Eftergymnasial utbildning, 5 år eller längre",
    omrade: "Farmaci",
    sok: ["apotekare", "receptarie", "farmaceut"],
    kravord: ["apotekarexamen", "receptarieexamen", "legitimerad apotekare",
              "legitimerad receptarie", "farmaceutisk examen"],
    stoppord: ["apotekstekniker"]
  },
  {
    namn: "Elektrikerexamen med behörighet",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Elektronik, datateknik och automation",
    sok: ["elektriker", "installationselektriker", "servicetekniker el"],
    kravord: ["elbehorighet", "elbehörighet", "auktorisation for elinstallation",
              "auktorisation för elinstallation", "el- och energiprogrammet",
              "certifierad elektriker", "yrkesbevis elektriker"],
    stoppord: []
  },
  {
    namn: "Barn- och fritidsexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Barn och ungdom",
    sok: ["barnskötare", "elevassistent", "fritidsledare"],
    kravord: ["barn- och fritidsprogrammet", "barnskotarutbildning", "barnskötarutbildning",
              "utbildad barnskotare", "utbildad barnskötare"],
    stoppord: ["förskollärare", "forskollarare"]
  },
  {
    namn: "Restaurang- och livsmedelsexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Hotell, restaurang och storhushåll",
    sok: ["kock", "kallskänka", "bagare"],
    kravord: ["restaurang- och livsmedelsprogrammet", "kockutbildning",
              "utbildad kock", "yrkesbevis kock", "bagarutbildning"],
    stoppord: ["diskare", "restaurangbiträde"]
  },
  {
    namn: "Frisörexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Frisör- och skönhetsvård",
    sok: ["frisör", "barberare", "hårstylist"],
    kravord: ["frisorutbildning", "frisörutbildning", "utbildad frisor", "utbildad frisör",
              "hantverksprogrammet", "gesallbrev frisor", "gesällbrev frisör",
              "frisorexamen", "frisörexamen", "barberarutbildning"],
    stoppord: ["frisörassistent", "elev"]
  },
  {
    namn: "Hud- och skönhetsvård, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Frisör- och skönhetsvård",
    sok: ["hudterapeut", "makeupartist", "nagelterapeut"],
    kravord: ["hudterapeututbildning", "utbildad hudterapeut", "diplomerad hudterapeut",
              "hantverksprogrammet", "stylistutbildning", "utbildad stylist",
              "certifierad nagelterapeut"],
    stoppord: []
  },
  {
    namn: "Hotell- och turismexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Hotell, restaurang och storhushåll",
    sok: ["receptionist hotell", "hotellvärd", "konferensvärd"],
    kravord: ["hotell- och turismprogrammet", "utbildning inom hotell",
              "hotellutbildning", "turismutbildning", "receptionistutbildning"],
    stoppord: []
  },
  {
    namn: "Bygg- och anläggningsexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Byggnadsteknik och anläggningsteknik",
    sok: ["snickare", "murare", "betongarbetare", "plattsättare"],
    kravord: ["bygg- och anlaggningsprogrammet", "bygg- och anläggningsprogrammet",
              "yrkesbevis snickare", "yrkesbevis murare", "utbildad snickare",
              "byggutbildning", "yrkesbevis inom bygg"],
    stoppord: ["byggnadsingenjör", "byggingenjör"]
  },
  {
    namn: "Fordons- och transportexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Fordons- och transportteknik",
    sok: ["fordonstekniker", "bilmekaniker", "lastbilsmekaniker"],
    kravord: ["fordons- och transportprogrammet", "fordonsutbildning",
              "utbildad fordonstekniker", "utbildad bilmekaniker",
              "yrkesbevis fordon", "mekanikerutbildning"],
    stoppord: []
  },
  {
    namn: "VVS- och fastighetsexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Byggnadsteknik och anläggningsteknik",
    sok: ["VVS-montör", "rörmokare", "fastighetsskötare", "kylmontör"],
    kravord: ["vvs- och fastighetsprogrammet", "vvs-utbildning", "utbildad vvs-montor",
              "utbildad vvs-montör", "yrkesbevis vvs", "kylcertifikat",
              "fastighetsskotarutbildning", "fastighetsskötarutbildning"],
    stoppord: []
  },
  {
    namn: "Industritekniska examen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Maskinteknik och verkstadsteknik",
    sok: ["CNC-operatör", "svetsare", "industrimekaniker", "maskinoperatör"],
    kravord: ["industritekniska programmet", "svetslicens", "svetscertifikat",
              "utbildad svetsare", "cnc-utbildning", "yrkesbevis svets",
              "industriutbildning"],
    stoppord: []
  },
  {
    namn: "Naturbruksexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Lantbruk, trädgård, skog och fiske",
    sok: ["djurvårdare", "trädgårdsarbetare", "lantbruksarbetare", "hästskötare"],
    kravord: ["naturbruksprogrammet", "naturbruksgymnasium", "utbildad djurvardare",
              "utbildad djurvårdare", "djurvardarutbildning", "djurvårdarutbildning",
              "tradgardsutbildning", "trädgårdsutbildning", "hastskotarutbildning",
              "hästskötarutbildning"],
    stoppord: []
  },
  {
    namn: "Handels- och administrationsexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Företagsekonomi, handel och administration",
    sok: ["butikschef", "säljare butik", "administratör"],
    kravord: ["handels- och administrationsprogrammet", "handelsprogrammet",
              "utbildning inom handel", "handelsutbildning"],
    stoppord: []
  },
  {
    namn: "El- och energiexamen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Elektronik, datateknik och automation",
    sok: ["automationstekniker", "larmtekniker", "nätverkstekniker"],
    kravord: ["el- och energiprogrammet", "elutbildning", "automationsutbildning",
              "utbildad automationstekniker"],
    stoppord: []
  },
  {
    namn: "Estetisk examen, gymnasial",
    niva: "Gymnasial utbildning, 3 år",
    omrade: "Musik, dans och dramatik",
    sok: ["musiklärare", "danspedagog", "scentekniker"],
    kravord: ["estetiska programmet", "estetisk utbildning", "musikutbildning",
              "dansutbildning", "scenteknisk utbildning"],
    stoppord: []
  },
  {
    namn: "Vård- och omsorgscollege, undersköterska med specialisering",
    niva: "Eftergymnasial utbildning, kortare än 2 år",
    omrade: "Omvårdnad",
    sok: ["specialistundersköterska", "undersköterska demens", "undersköterska palliativ"],
    kravord: ["specialistunderskoterska", "specialistundersköterska",
              "vidareutbildning inom demens", "vidareutbildning inom palliativ",
              "yrkeshogskoleutbildning inom vard", "yrkeshögskoleutbildning inom vård"],
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
  "lakarsekreterare", "läkarsekreterare", "vardutbildning", "vårdutbildning",
  "beteendevetare", "personalvetare", "civilekonom", "specialistsjukskoterska",
  "specialistsjuksköterska", "hogskoleingenjor", "högskoleingenjör",
  "byggingenjor", "byggingenjör", "byggnadsingenjor", "byggnadsingenjör",
  "auktoriserad revisor", "utbildad bibliotekarie", "utbildad kock"
];

const KRAVSIGNAL = [
  "krav", "kravs", "krävs", "maste", "måste", "ska ha", "ska du ha", "skall ha",
  "vi soker dig som har", "vi söker dig som har", "du har", "du ar", "du är",
  "examen", "utbildning", "utbildad", "behorig", "behörig", "legitimerad",
  "legitimation", "meriterande", "kvalifikation", "vi krav", "erfordras",
  "forutsatter", "förutsätter", "innehar", "vi soker dig", "vi söker dig",
  "vi soker en", "vi söker en", "soker vi", "söker vi", "din profil",
  "kvalifikationer", "bakgrund", "sokande", "sökande", "tjansten kraver",
  "tjänsten kräver", "vi vill att du", "det kravs", "det krävs"
];

function kravNara(text, ord) {
  let i = text.indexOf(ord);
  while (i > -1) {
    const omkring = text.slice(Math.max(0, i - 200), i + ord.length + 200);
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
          // Undantag: står yrket i rubriken är examen underförstådd. Ett jobb
          // som heter "Specialistsjuksköterska" kräver den utbildningen.
          if (SVAGA_ORD.indexOf(krav) > -1) {
            const rubrik = (a.headline || "").toLowerCase();
            const iRubriken = rubrik.indexOf(krav) > -1 || slat(rubrik).indexOf(slat(krav)) > -1;
            if (!iRubriken && !kravNara(text, krav)) { svagaBort++; continue; }
          }
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

  // sortera så färska jobb hamnar först inom varje utbildning
  unika.sort(function (a, b) {
    if (a.utbildning !== b.utbildning) return a.utbildning < b.utbildning ? -1 : 1;
    return String(b.publicerad || "").localeCompare(String(a.publicerad || ""));
  });

  fs.writeFileSync("labb/utbildningsjobb.json", JSON.stringify(unika, null, 2));

  // Filen som sidan läser. Samma mönster som jobb.js i Chansen.
  const lista = UTBILDNINGAR.map(function (u) {
    return { namn: u.namn, niva: u.niva, omrade: u.omrade };
  });
  const kommunlan = {};
  for (const j of unika) if (j.ort && j.lan) kommunlan[j.ort] = j.lan;

  fs.writeFileSync("labb/utbildningsjobb.js",
    "var UTB_UPPDATERAD = " + JSON.stringify(new Date().toISOString()) + ";\n" +
    "var UTBILDNINGAR_LISTA = " + JSON.stringify(lista) + ";\n" +
    "var UTB_KOMMUNLAN = " + JSON.stringify(kommunlan) + ";\n" +
    "var UTB_JOBB = " + JSON.stringify(unika) + ";\n");

  console.log("");
  console.log("Granskade annonser: " + granskade);
  console.log("Jobb med identifierat utbildningskrav: " + unika.length);
  console.log("Stoppade för att ordet bara nämndes i förbifarten: " + svagaBort);

  const orter = {};
  for (const j of unika) if (j.ort) orter[j.ort] = (orter[j.ort] || 0) + 1;
  console.log("Kommuner: " + Object.keys(orter).length);
  console.log("");
  console.log("");
  console.log("Sparat i labb/utbildningsjobb.json och labb/utbildningsjobb.js");
  console.log("Öppna labb/utbildning.html i webbläsaren för att prova.");
  console.log("Ingenting av det här publiceras.");
}

hamta();
