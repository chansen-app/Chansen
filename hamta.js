const fs = require("fs");

function poang(a) {
  const titel = (a.headline || "").toLowerCase();
  const text = ((a.description ? a.description.text : "") + " " + titel).toLowerCase();
  let p = 0;

  const yrkesstopp = ["lakare", "läkare", "sjukskoterska", "sjuksköterska", "barnmorska", "psykolog", "tandlakare", "tandläkare", "socionom", "jurist", "advokat", "ingenjor", "ingenjör", "utvecklare", "arkitekt", "revisor", "larare", "lärare", "forskollarare", "förskollärare", "chef", "controller", "specialist"];
  for (const ord of yrkesstopp) {
    if (titel.includes(ord)) return -20;
  }

  const bratitel = ["extrajobb", "sommarjobb", "helgjobb", "ferie", "extra personal", "timanstalld", "timanställd"];
  for (const ord of bratitel) {
    if (titel.includes(ord)) { p += 3; break; }
  }

  if (a.experience_required === false) p += 3;

  const bra = ["inga forkunskaper", "inga förkunskaper", "ingen erfarenhet", "vi utbildar dig", "vi larer dig", "vi lär dig", "du behover inte ha jobbat", "du behöver inte ha jobbat", "utbildning pa plats", "utbildning på plats", "inget krav pa erfarenhet", "inget krav på erfarenhet"];
  for (const ord of bra) {
    if (text.includes(ord)) { p += 2; break; }
  }

  const omfattning = (a.working_hours_type ? a.working_hours_type.label : "") || "";
  if (omfattning.toLowerCase().includes("deltid")) p += 2;

  const form = (a.employment_type ? a.employment_type.label : "") || "";
  const f = form.toLowerCase();
  if (f.includes("behov") || f.includes("sommar") || f.includes("sasong") || f.includes("säsong")) p += 2;

  if (a.driving_license_required === true) p -= 3;

  const stopp = ["examen", "legitimation", "legitimerad", "hogskoleutbildning", "högskoleutbildning", "yrkeshogskola", "yrkeshögskola", "flera ars erfarenhet", "flera års erfarenhet", "minst 3 ars", "minst 3 års", "minst 5 ars", "minst 5 års"];
  for (const ord of stopp) {
    if (text.includes(ord)) { p -= 5; break; }
  }

  return p;
}

async function hamtaJobb() {
  const url = "https://jobsearch.api.jobtechdev.se/search?q=malm%C3%B6&limit=100";
  const svar = await fetch(url);
  const data = await svar.json();

  const jobb = [];

  for (const a of data.hits) {
    const p = poang(a);
    if (p < 0) continue;

    let niva = "lag";
    if (p >= 5) niva = "hog";
    else if (p >= 2) niva = "medel";

    jobb.push({
      titel: a.headline,
      arbetsgivare: a.employer ? a.employer.name : "",
      ort: a.workplace_address ? a.workplace_address.municipality : "",
      omfattning: a.working_hours_type ? a.working_hours_type.label : "",
      anstallningsform: a.employment_type ? a.employment_type.label : "",
      korkortKravs: a.driving_license_required, utdrag: (function(){ var t = (a.description ? a.description.text : "").toLowerCase(); return (t.indexOf("belastningsregister") > -1 || t.indexOf("registerutdrag") > -1) ? "kravs" : "framgar inte"; })(),
      poang: p,
      chansniva: niva,
      lank: a.webpage_url,
      sistaAnsokningsdag: a.application_deadline
    });
  }

  jobb.sort(function (x, y) { return y.poang - x.poang; });

fs.writeFileSync("public/jobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("public/jobb.js", "const JOBB = " + JSON.stringify(jobb, null, 2) + ";");

  let hog = 0, medel = 0;
  for (const j of jobb) {
    if (j.chansniva === "hog") hog++;
    if (j.chansniva === "medel") medel++;
  }
  console.log("Sparade " + jobb.length + " jobb. Hog chans: " + hog + ", medel: " + medel);
}

hamtaJobb();