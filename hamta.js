/*  Chansen — hämtar och rangordnar jobbannonser
 *
 *  Datakälla: Arbetsförmedlingens öppna API JobSearch, annonser från Platsbanken.
 *  Licens:    CC0, helt öppen data. Ingen källhänvisning krävs.
 *             Katalog: https://data.arbetsformedlingen.se
 *
 *  Obs: faltet experience_required fylls i av arbetsgivaren och gar inte att
 *  lita pa. Arbetsformedlingen bekraftar sjalva att textanalys ar ratt vag,
 *  vilket ar darfor stopporden nedan finns.
 */

const fs = require("fs");

// ── sökningar: yrkesområden med låga ingångskrav ──────────────────────
const SOKNINGAR = [
  "säljare","butikssäljare","kundtjänst","kundsupport","kundservice",
  "lagerarbetare","lagermedarbetare","orderplockare","terminalarbetare",
  "restaurang","kock","servitör","cafébiträde","köksbiträde",
  "städ","lokalvårdare","reception","receptionist",
  "personlig assistent","vårdbiträde","stödassistent",
  "extrajobb","sommarjobb","helgjobb","utan erfarenhet",
  "montör","produktionsmedarbetare","maskinoperatör",
  "bud","chaufför utan erfarenhet","telefonförsäljare",
  "administratör","kontorsassistent","butiksbiträde",
  "butik","kassa","expedit","varuhus","butikssäljare helg",
  "kontor","administration","orderadministratör","vaktmästare",
  "hotell","frukostvärd","diskare","cafépersonal","serveringspersonal",
  "elevassistent","fritidsledare","ledsagare","avlösare",
  "trädgårdsarbetare","parkarbetare","lantbruk","djurskötare","växthus",
  "tvätteri","textilservice","sortering","återvinning","miljöarbetare",
  "eventpersonal","biljettvärd","garderobiär","vaktmästeri","parkeringsvärd",
  "cykelbud","matbud","hemleverans","varuplockare","påfyllare",
  "telefonist","växeltelefonist","enklare kontorsarbete","postsortering",
  "hotellstädning","frukostbuffé","konferensvärd","kioskbiträde",
  "bageri","charkuteri","fiskdisk","delikatess","sommarvikarie",
  "feriearbete","behovsanställning utan erfarenhet","vi lär dig",
  "inga förkunskaper","introduktion ges","upplärning på plats"
];
const SIDOR_PER_SOKNING = 10;   // 100 annonser per sida

// ── titlar som aldrig visas ───────────────────────────────────────────
const YRKESSTOPP = [
  "lakare","läkare","sjukskoterska","sjuksköterska","barnmorska","psykolog",
  "tandlakare","tandläkare","socionom","jurist","advokat","ingenjor","ingenjör",
  "utvecklare","arkitekt","revisor","larare","lärare","forskollarare","förskollärare",
  "chef","controller","specialist","konsult","analytiker","projektledare",
  "manager","arbetsledare","teamleader","team leader","supervisor","ledare",
  "ansvarig","forestandare","föreståndare","gruppledare","platsansvarig",
  "intendent","antikvarie","bibliotekarie","kurator","handlaggare","handläggare",
  "samordnare","koordinator","ekonom","redovisningsass","rekryterare",
  "forskare","doktorand","adjunkt","lektor","professor","veterinar","veterinär",
  "arbetsterapeut","fysioterapeut","sjukgymnast","logoped","dietist","optiker",
  "farmaceut","apotekare","elektriker","rormokare","rörmokare",
  "tandskoterska","tandsköterska","skotare","skötare","behandlingsassistent",
  "boendestodjare","boendestödjare","habiliteringsassistent","undersköt",
  "ambulans","akutsjukv","biomedicinsk","laboratorieing","audionom",
  "ortopedtekniker","kiropraktor","naprapat","massor","massör","fotvard","fotvård",
  "frisor","frisör","barberare","hudterapeut","nagelterapeut","florist",
  "svetsare","plattsattare","plattsättare","malare","målare","murare",
  "anlaggning","anläggning","besiktning","installator","installatör",
  "snickare","svetsare","pilot","polis","brandman","officer","maklare","mäklare",
  "art director","copywriter","journalist","redaktor","redaktör","undersköterska",
  "underskoterska","barnskötare","barnskotare","tandhygienist","key account"
];

const TEXTSTOPP = [
  "examen","legitimation","legitimerad","hogskoleutbildning","högskoleutbildning",
  "universitetsutbildning","akademisk utbildning","eftergymnasial","yrkeshogskola",
  "yrkeshögskola","flera ars erfarenhet","flera års erfarenhet",
  "gedigen erfarenhet","minst 3 ars","minst 3 års","minst 5 ars","minst 5 års",
  "minst tre ars","minst tre års","minst fem ars","minst fem års",
  "myndigheten for yrkeshogskolan","myndigheten för yrkeshögskolan",
  " myh ","utbildning av myh","utbildad tandskoterska","utbildad tandsköterska",
  "utbildad underskoterska","utbildad undersköterska","utbildad barnskotare",
  "utbildad barnskötare","genomgangen utbildning","genomgången utbildning",
  "formell utbildning","adekvat utbildning","relevant yrkesutbildning",
  "yrkesutbildning inom","vardutbildning","vårdutbildning",
  "omvardnadsprogram","omvårdnadsprogram","behorighetsbevis","behörighetsbevis",
  "yrkesbevis","gesallbrev","gesällbrev",
  "djurvardare niva","djurvårdare nivå","niva 2 eller 3","nivå 2 eller 3",
  "steg 2","steg 3"
];

const POSITIV_TEXT = [
  "inga forkunskaper","inga förkunskaper","ingen erfarenhet","ingen tidigare erfarenhet",
  "vi utbildar dig","vi larer dig","vi lär dig","du behover inte ha jobbat",
  "du behöver inte ha jobbat","utbildning pa plats","utbildning på plats",
  "inget krav pa erfarenhet","inget krav på erfarenhet","du behover ingen erfarenhet",
  "du behöver ingen erfarenhet","vi ser till att du far ratt utbildning",
  "internutbildning","upplarning","upplärning","du far en gedigen introduktion",
  "du får en gedigen introduktion","erfarenhet ar inget krav","erfarenhet är inget krav"
];

// ── kategorier: nyckelord i titeln ────────────────────────────────────
const KATEGORIER = {
  "Städ": ["stad","städ","lokalvard","lokalvård","cleaner","cleaning","fonsterputs","fönsterputs",
           "tvatt","tvätt","textilservice","hygien","sanering","skursk","hotellstad","hotellstäd",
           "rumsstad","rumsstäd","trappstad","trappstäd"],
  "Butik": ["butik","kassa","expedit","store","varuhus","varupafyllare","varupåfyllare",
            "ica ","coop","willys","lidl","dollarstore","rusta","åhléns","ahlens",
            "kiosk","narlivs","närlivs","blomster","apotekstekniker","uthyr","second hand"],
  "Sälj": ["saljare","säljare","salj","sälj","account manager","innesaljare","innesäljare",
           "utesaljare","utesäljare","telefonforsaljare","telefonförsäljare","telemarketing"],
  "Kundtjänst": ["kundtjanst","kundtjänst","kundservice","kundsupport","customer support",
                 "kundvard","kundvärd","reception","receptionist","vaxel","växel","kundmottagare"],
  "Lager och logistik": ["lager","terminal","plock","truck","gods","paket","distribution",
                         "logistik","bud","chauffor","chaufför","transport","akeri","åkeri",
                         "brevbarare","brevbärare","postiljon","utdelare","utkorning","utkörning",
                         "lastare","lossning","emballering","packning","truckforare","truckförare"],
  "Restaurang och café": ["restaurang","kock","servit","cafe","café","barista","kok","kök",
                          "diskare","pizza","sushi","bar ","hotell","runner","host","krog",
                          "catering","bufe","buffé","frukost","kallskanka","kallskänka","bagare",
                          "konditor","glass","food","burgare","sibylla","max ","kiosk och grill",
                          "matsal","kost","bartender","barpersonal","servering"],
  "Vård och omsorg": ["assistent","vard","vård","omsorg","hemtjanst","hemtjänst","boende",
                      "ledsagare","avlosare","avlösare"],
  "Barn och skola": ["barn","fritids","forskola","förskola","elevassistent","skolmaltid","skolmåltid"],
  "Industri och produktion": ["montor","montör","produktion","maskinoperator","maskinoperatör",
                              "fabrik","tillverkning","packare","operator","operatör","industri",
                              "verkstad","svarv","kvalitetskontroll","monterare","sortering",
                              "atervinning","återvinning","miljoarbetare","miljöarbetare","sagverk","sågverk"],
  "Kontor": ["administrator","administratör","kontorsassistent","assistent till","backoffice",
             "orderadministrator","orderadministratör","registrator","kontor","arkiv","kansli"],
  "Event och kultur": ["event","konferens","festival","biljett","garderob","bingo","mässa","massa ",
                       "publikvard","publikvärd","arena","museum","bio ","teater","fritidsgård",
                       "camping","badhus","simhall","skiduthyr","turism"],
  "Djur och natur": ["djur","hund","hast","häst","stall","tradgard","trädgård","park","skog",
                     "lantbruk","vaxthus","växthus","gron","grön","zoo"]
};

const BRATITEL = [
  "extrajobb","sommarjobb","helgjobb","ferie","extra personal","extrahjalp","extrahjälp",
  "timanstalld","timanställd","studerande","student","feriearbete","sasongsjobb","säsongsjobb",
  // vanliga ingångsjobb som annars faller mellan stolarna
  "medarbetare","bitrade","biträde","barback","runner","diskare","kioskbitrade","kioskbiträde",
  "mcdonald","burger king","max hamburgare","subway","espresso house","waynes","pressbyran",
  "pressbyrån","7-eleven","seven eleven","o'learys","olearys","sibylla","bistro",
  "vaktmastare","vaktmästare","badvard","badvärd","instruktor","instruktör","ledare pa",
  "ledare på","assistent till","varupafyllare","varupåfyllare","plockare","packare",
  "hemstad","hemstäd","flyttstad","flyttstäd","glassbar","kiosk"
];

const EJ_MINDERARIG = [
  "vaktare","väktare","ordningsvakt","bygg","byggnads","stallning","ställning",
  "truck","maskinforare","maskinförare","nattarbete","bartender","alkohol",
  "systembolag","kemikalie","hogtryck","högtryck","asfalt","svets","slakteri",
  "skogsbruk","gruv","chaufför","chauffor","montör","montor","maskinoperatör","maskinoperator"
];

// ── provision utan grundlön ──────────────────────────────────────────
// Provision är inte fel i sig. Grundlön plus provision är vanligt och tryggt.
// Det farliga är annonser där provisionen är hela lönen, för då kan man
// jobba en månad och få noll kronor. Dem sållar vi bort.
const PROVISION_ORD = [
  "provision","provisionsbaserad","provisionslon","provisionslön",
  "provisionsbaserat","commission"
];
const GRUNDLON_ORD = [
  "grundlon","grundlön","fast lon","fast lön","fast manadslon","fast månadslön",
  "manadslon","månadslön","timlon","timlön","kollektivavtal","garantilon","garantilön",
  "fast del","fast grund","fastlon","fastlön","enligt avtal","avtalsenlig"
];
const REN_PROVISION = [
  "endast provision","ren provision","enbart provision","100% provision",
  "100 % provision","helt provisionsbaserad","provision only","ingen grundlon",
  "ingen grundlön","utan grundlon","utan grundlön","fri provision","obegransad provision",
  "obegränsad provision","du styr din egen lon","du styr din egen lön"
];

// Arbetsförmedlingen har ett eget fält för löneform, och det är mycket
// mer tillförlitligt än att leta i texten. Många annonser nämner aldrig
// provision i brödtexten men har det angett här.
//   "Fast månads- vecko- eller timlön"     → trygg lön
//   "Fast och rörlig lön"                  → grundlön plus provision, okej men märks
//   "Rörlig ackords- eller provisionslön"  → ingen fast lön alls, visas inte
function renRorligLon(a) {
  const l = ((a.salary_type && a.salary_type.label) || "").toLowerCase();
  return l.indexOf("rorlig ackords") > -1 || l.indexOf("rörlig ackords") > -1;
}

function harRorligDel(a) {
  const l = ((a.salary_type && a.salary_type.label) || "").toLowerCase();
  return l.indexOf("rorlig") > -1 || l.indexOf("rörlig") > -1;
}

function provisionUtanGrundlon(text) {
  // uttalat ren provision, alltid bort
  for (const ord of REN_PROVISION) { if (text.indexOf(ord) > -1) return true; }
  // nämner provision men inte ett ord om fast lön
  let harProvision = false;
  for (const ord of PROVISION_ORD) { if (text.indexOf(ord) > -1) { harProvision = true; break; } }
  if (!harProvision) return false;
  for (const ord of GRUNDLON_ORD) { if (text.indexOf(ord) > -1) return false; }
  return true;
}

// Ett behörighetskort är bara ett hinder om det KRÄVS. Väldigt många
// lagerannonser skriver "truckkort är meriterande", alltså en fördel,
// och de jobben går utmärkt att söka utan kort. Vi tittar därför på
// orden runt omkring i stället för att stoppa alla som nämner kortet.
const KORT_ORD = [
  "truckkort","c-kort","ce-kort","d-kort","heta arbeten","liftkort",
  "fallskydd","esa-utbildning","bas-p","bas-u","travers","lyftkort"
];
const KRAV_NARA = [
  "krav","kravs","krävs","maste","måste","ska ha","ska du ha","skall ha",
  "innehar","inneha","giltigt","du har","behover ha","behöver ha","forutsatter","förutsätter"
];
const MERIT_NARA = [
  "meriterande","meriterade","fordel","fördel","plus","bonus","gärna","garna",
  "vi utbildar","utbildning ges","du far ta","du får ta","bekostar","erbjuder utbildning",
  "inte ett krav","inget krav","behovs inte","behövs inte"
];

function kortKravs(text) {
  for (const kort of KORT_ORD) {
    let i = text.indexOf(kort);
    while (i > -1) {
      // titta 90 tecken före och efter
      const omkring = text.slice(Math.max(0, i - 90), i + kort.length + 90);
      let merit = false, krav = false;
      for (const o of MERIT_NARA) if (omkring.indexOf(o) > -1) { merit = true; break; }
      if (!merit) for (const o of KRAV_NARA) if (omkring.indexOf(o) > -1) { krav = true; break; }
      if (krav) return true;
      i = text.indexOf(kort, i + 1);
    }
  }
  return false;
}

function harNagot(text, lista) {
  for (const ord of lista) { if (text.indexOf(ord) > -1) return true; }
  return false;
}

function kategori(a) {
  const titel = (a.headline || "").toLowerCase();
  for (const namn in KATEGORIER) {
    if (harNagot(titel, KATEGORIER[namn])) return namn;
  }
  return "Övrigt";
}

// Poängen mäter BARA hur få hinder som finns. Inget om heltid eller deltid,
// den preferensen hör hemma i användarens egna svar.
function poang(a) {
  const titel = (a.headline || "").toLowerCase();
  const text = ((a.description ? a.description.text : "") + " " + titel).toLowerCase();
  let p = 0;

  if (harNagot(titel, YRKESSTOPP)) return -20;
  if (harNagot(text, TEXTSTOPP)) return -20;
  if (provisionUtanGrundlon(text)) return -20;
  if (kortKravs(text)) return -20;
  if (renRorligLon(a)) return -20;

  // Räkna HUR MÅNGA positiva tecken annonsen har, inte bara om den har något.
  // Tidigare fick nästan alla jobb samma poäng, vilket gjorde sorteringen
  // meningslös för de flesta.
  let positivaOrd = 0;
  for (const o of POSITIV_TEXT) { if (text.indexOf(o) > -1) positivaOrd++; }
  const positiv = positivaOrd > 0;

  // arbetsgivaren har själv sagt att erfarenhet inte krävs
  if (a.experience_required === false) p += 5;

  // Står det redan i rubriken att erfarenhet inte behövs är det det
  // starkaste tecken som finns. Sånt får inte falla under tröskeln.
  if (harNagot(titel, POSITIV_TEXT)) p += 4;

  // varje formulering som säger att de lär upp väger något
  p += Math.min(positivaOrd * 2, 6);

  if (harNagot(titel, BRATITEL)) p += 2;
  if (kategori(a) !== "Övrigt") p += 1;

  // hinder
  if (a.experience_required === true && !positiv) p -= 3;
  if (a.driving_license_required === true) p -= 1;
  if (utdragskrav(a) === "kravs") p -= 2;
  if (harProvision(text)) p -= 1;
  if (harNattarbete(a)) p -= 1;
  if (harNagot(text, ["minst 2 ars","minst 2 års","minst tva ars","minst två års",
                      "nagra ars erfarenhet","några års erfarenhet"])) p -= 4;

  return p;
}

function kortBeskrivning(a) {
  var t = (a.description ? a.description.text : "") || "";
  t = t.replace(/\s+/g, " ").trim();
  if (!t) return "";
  // hoppa över inledande företagspresentationer om texten är lång
  if (t.length > 700) {
    var m = t.search(/(Vi söker|Vi erbjuder|Dina arbetsuppgifter|Om tjänsten|Arbetsuppgifter|Din roll|Om jobbet)/i);
    if (m > 0 && m < 900) t = t.slice(m);
  }
  if (t.length > 260) {
    var brytpunkt = t.lastIndexOf(".", 260);
    t = (brytpunkt > 140) ? t.slice(0, brytpunkt + 1) : t.slice(0, 250).trim() + "...";
  }
  return t;
}

const NATT_ORD = [
  "nattarbete","nattskift","nattpass","nattetid","natten","nattjobb",
  "skiftarbete","tvaskift","tvåskift","treskift","2-skift","3-skift",
  "rullande schema","ob-tillagg for natt","ob-tillägg för natt","kvall och natt","kväll och natt"
];

function harNattarbete(a) {
  const titel = (a.headline || "").toLowerCase();
  const text = ((a.description ? a.description.text : "") + " " + titel).toLowerCase();
  return harNagot(text, NATT_ORD);
}

// Alla jobb i Chansen har låga krav, annars hade de sållats bort.
// Märkningen "Erfarenhet krävs inte" sparar vi därför till de annonser
// där arbetsgivaren SJÄLV kryssat i det. Annars vore taggen meningslös,
// för då sitter den på varenda kort.
function nyborjarSkal(a) {
  if (a.experience_required === false) return "arbetsgivaren har själv angett att erfarenhet inte krävs";
  return "";
}

// Poängen ovan avgör OM ett jobb ska visas, och bygger bara på hur höga
// kraven är. Ordningen får däremot ta hänsyn till sånt som gör ett jobb
// lättare att faktiskt få, utan att släppa in jobb med höga krav.
function sorteringspoang(a, kravpoang) {
  let s = kravpoang * 10;

  const form = ((a.employment_type && a.employment_type.label) || "").toLowerCase();
  if (form.indexOf("behov") > -1 || form.indexOf("sommar") > -1
      || form.indexOf("feriejobb") > -1 || form.indexOf("tidsbegr") > -1
      || form.indexOf("vikariat") > -1) s += 4;

  const omf = ((a.working_hours_type && a.working_hours_type.label) || "").toLowerCase();
  if (omf.indexOf("del") > -1) s += 2;

  if (a.publication_date) {
    const dagar = Math.floor((Date.now() - new Date(a.publication_date)) / 86400000);
    if (dagar <= 7) s += 6;
    else if (dagar <= 30) s += 2;
    else if (dagar > 120) s -= 4;
  }
  return s;
}

function harProvision(text) {
  for (const ord of PROVISION_ORD) { if (text.indexOf(ord) > -1) return true; }
  return false;
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
  if (harNagot(text, ["fyllda 18","minst 18 ar","minst 18 år","myndig"])) return false;
  return true;
}

async function hamtaJobb() {
  const sedda = {};
  const jobb = [];
  const nu = new Date();
  let hamtade = 0, bortsorterade = 0, provisionsbort = 0;
  const kommunLan = {};

  // Heltidsjobb hittas dåligt av våra sökord, som är inriktade på extrajobb
  // och deltid. Därför sveper vi också igenom heltidsannonserna direkt.
  const HELTID = "6YE1_gAC_R2G";
  const DELTID = "947z_JGS_Uk2";
  const SVEP = [];
  for (let o = 0; o <= 1900; o += 100) {
    SVEP.push({ term: "heltidssvep", url:
      "https://jobsearch.api.jobtechdev.se/search?q=&worktime-extent=" + HELTID +
      "&limit=100&offset=" + o });
  }

  // Sökorden hittar bara det de råkar innehålla. Ett svep län för län går
  // igenom hela Platsbanken i stället, så vi missar inga jobb som klarar
  // kraven bara för att annonsen är formulerad på ett ovanligt sätt.
  const LAN = [
    ["Stockholm","CifL_Rzy_Mku",1], ["Västra Götaland","zdoY_6u5_Krt",1],
    ["Skåne","CaRE_1nn_cSU",1],     ["Östergötland","oLT3_Q9p_3nn",1],
    ["Jönköping","MtbE_xWT_eMi",0], ["Norrbotten","9hXe_F4g_eTG",0],
    ["Uppsala","zBon_eET_fFU",0],   ["Västerbotten","g5Tt_CAV_zBd",0],
    ["Dalarna","oDpK_oZ2_WYt",0],   ["Örebro","xTCk_nT5_Zjm",0],
    ["Södermanland","s93u_BEb_sx2",0], ["Halland","wjee_qH2_yb6",0],
    ["Västmanland","G6DV_fKE_Viz",0],  ["Västernorrland","NvUF_SP1_1zo",0],
    ["Värmland","EVVp_h6U_GSZ",0],  ["Gävleborg","zupA_8Nt_xcD",0],
    ["Kronoberg","tF3y_MF9_h5G",0], ["Kalmar","9QUH_2bb_6Np",0],
    ["Jämtland","65Ms_7r1_RTG",0],  ["Blekinge","DQZd_uYs_oKb",0],
    ["Gotland","K8iD_VQv_2BA",0]
  ];
  for (const [namn, id, stort] of LAN) {
    // små län ryms i ett svep, stora delas upp så vi kommer djupare
    const delar = stort ? ["", "&worktime-extent=" + HELTID, "&worktime-extent=" + DELTID] : [""];
    for (const del of delar) {
      for (let o = 0; o <= 1900; o += 100) {
        SVEP.push({ term: "svep " + namn, url:
          "https://jobsearch.api.jobtechdev.se/search?q=&region=" + id + del +
          "&limit=100&offset=" + o });
      }
    }
  }

  const OMGANGAR = [];
  for (const term of SOKNINGAR) {
    for (let sida = 0; sida < SIDOR_PER_SOKNING; sida++) {
      OMGANGAR.push({ term: term, url:
        "https://jobsearch.api.jobtechdev.se/search?q=" +
        encodeURIComponent(term) + "&limit=100&offset=" + (sida * 100) });
    }
  }
  for (const s of SVEP) OMGANGAR.push(s);

  let forraTerm = "";
  for (const omgang of OMGANGAR) {
    {
      const term = omgang.term;
      const url = omgang.url;
      let data;
      try {
        const svar = await fetch(url);
        // continue, inte break: ett misslyckat anrop ska hoppa över den
        // sidan, inte avbryta hela hämtningen.
        if (!svar.ok) continue;
        data = await svar.json();
      } catch (e) { continue; }
      if (!data.hits || data.hits.length === 0) continue;

      for (const a of data.hits) {
        hamtade++;
        // uppslagslistan byggs av alla annonser, så den täcker även
        // kommuner som inte har något jobb som klarar våra krav i dag
        const adr = a.workplace_address;
        if (adr && adr.municipality && adr.region) kommunLan[adr.municipality] = adr.region;
        if (sedda[a.id]) continue;
        sedda[a.id] = true;

        if (a.application_deadline) {
          const slut = new Date(a.application_deadline);
          if (!isNaN(slut) && slut < nu) { bortsorterade++; continue; }
        }

        const brodtext = ((a.description ? a.description.text : "") + " " + (a.headline || "")).toLowerCase();
        if (provisionUtanGrundlon(brodtext) || renRorligLon(a)) provisionsbort++;

        const p = poang(a);
        if (p < 3) { bortsorterade++; continue; }

        jobb.push({
          titel: a.headline,
        beskrivning: kortBeskrivning(a),
          arbetsgivare: a.employer ? a.employer.name : "",
          ort: a.workplace_address && a.workplace_address.municipality ? a.workplace_address.municipality : "",
          omfattning: a.working_hours_type ? a.working_hours_type.label : "",
          anstallningsform: a.employment_type ? a.employment_type.label : "",
          kategori: kategori(a),
          erfarenhetKravs: a.experience_required,
          korkortKravs: a.driving_license_required,
          lan: a.workplace_address && a.workplace_address.region ? a.workplace_address.region : "",
        utdrag: utdragskrav(a),
        provision: harProvision(brodtext) || harRorligDel(a),
        lonform: (a.salary_type && a.salary_type.label) || "",
        nattarbete: harNattarbete(a),
        nyborjarvanlig: nyborjarSkal(a) !== "",
        nyborjarskal: nyborjarSkal(a),
          minderarigOk: okForMinderarig(a),
          poang: p,
          sortpoang: sorteringspoang(a, p),
          chansniva: p >= 5 ? "hog" : (p >= 3 ? "medel" : "lag"),
          lank: a.webpage_url,
          sistaAnsokningsdag: a.application_deadline,
          publicerad: a.publication_date || null
        });
      }
      if (term !== forraTerm) {
        console.log("Sökt: " + term + "  (" + jobb.length + " jobb hittills)");
        forraTerm = term;
      }
    }
  }

  jobb.sort(function (x, y) { return (y.sortpoang || y.poang) - (x.sortpoang || x.poang); });

  // Ingen arbetsgivare ska få fylla listan. Tolv företag stod tidigare för
  // en tredjedel av alla jobb, och då blir det tröttsamt att bläddra.
  // Bäst rankade behålls, resten faller bort.
  const MAX_PER_ORT = 3;      // samma företag, samma kommun
  const MAX_TOTALT  = 20;     // samma företag i hela landet
  const perOrt = {}, perAg = {};
  const kvar = [], bortTak = [];
  for (const j of jobb) {
    const ag = (j.arbetsgivare || "").trim();
    const nyckelOrt = ag + "|" + (j.ort || "");
    perOrt[nyckelOrt] = (perOrt[nyckelOrt] || 0) + 1;
    perAg[ag] = (perAg[ag] || 0) + 1;
    if (perOrt[nyckelOrt] > MAX_PER_ORT || perAg[ag] > MAX_TOTALT) { bortTak.push(j); continue; }
    kvar.push(j);
  }
  console.log("Bortsorterade för att en arbetsgivare tog för stor plats: " + bortTak.length);
  jobb.length = 0;
  for (const j of kvar) jobb.push(j);

  const hamtadTid = new Date().toISOString();

  fs.writeFileSync("docs/jobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("docs/jobb.js",
    "const UPPDATERAD = \"" + hamtadTid + "\";\n" +
    "const JOBB_HAMTAD = UPPDATERAD;\n" +
    "const KOMMUNLAN = " + JSON.stringify(kommunLan) + ";\n" +
    "const JOBB = " + JSON.stringify(jobb) + ";");

  const orter = {}, kat = {}, omf = {};
  for (const j of jobb) {
    if (j.ort) orter[j.ort] = true;
    kat[j.kategori] = (kat[j.kategori] || 0) + 1;
    const o = j.omfattning || "Ej angivet";
    omf[o] = (omf[o] || 0) + 1;
  }

  console.log("\nKlart. " + jobb.length + " jobb i " + Object.keys(orter).length + " kommuner.");
  console.log("Omfattning:", omf);
  console.log("Kategorier:", kat);
  console.log("Hämtade annonser totalt: " + hamtade + ", bortsorterade: " + bortsorterade);
  console.log("Varav provision utan grundlön: " + provisionsbort);
  let natt = 0, nyb = 0;
  for (const j of jobb) { if (j.nattarbete) natt++; if (j.nyborjarvanlig) nyb++; }
  console.log("Nattarbete, göms för under 18: " + natt);
  console.log("Nybörjarvänliga: " + nyb);
  console.log("Kommuner i uppslagslistan: " + Object.keys(kommunLan).length);
}

hamtaJobb();
