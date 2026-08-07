const fs = require("fs");

function poang(a) {
  const titel = (a.headline || "").toLowerCase();
  const text = ((a.description ? a.description.text : "") + " " + titel).toLowerCase();
  let p = 0;

  const yrkesstopp = ["lakare", "läkare", "sjukskoterska", "sjuksköterska", "barnmorska", "psykolog", "tandlakare", "tandläkare", "socionom", "jurist", "advokat", "ingenjor", "ingenjör", "utvecklare", "arkitekt", "revisor", "larare", "lärare", "forskollarare", "förskollärare", "chef", "controller", "specialist", "konsult", "analytiker", "projektledare"];
  for (const ord of yrkesstopp) {
    if (titel.includes(ord)) return -20;
  }

  const bratitel = ["extrajobb", "sommarjobb", "helgjobb", "ferie", "extra personal", "extrahjalp", "extrahjälp", "timanstalld", "timanställd", "studerande", "student"];
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

function utdragskrav(a) {
  const t = (a.description ? a.description.text : "").toLowerCase();
  if (t.indexOf("belastningsregister") > -1 || t.indexOf("registerutdrag") > -1) return "kravs";
  return "framgar inte";
}

async function hamtaJobb() {
  const jobb = [];
  const sidor = 20;

  for (let i = 0; i < sidor; i++) {
    const offset = i * 100;
    const url = "https://jobsearch.api.jobtechdev.se/search?limit=100&offset=" + offset;

    const svar = await fetch(url);
    if (!svar.ok) { console.log("Stopp vid offset " + offset); break; }

    const data = await svar.json();
    if (!data.hits || data.hits.length === 0) break;

    for (const a of data.hits) {
      const p = poang(a);
      if (p < 0) continue;

      jobb.push({
        titel: a.headline,
        arbetsgivare: a.employer ? a.employer.name : "",
        ort: a.workplace_address && a.workplace_address.municipality ? a.workplace_address.municipality : "",
        lan: a.workplace_address && a.workplace_address.region ? a.workplace_address.region : "",
        omfattning: a.working_hours_type ? a.working_hours_type.label : "",
        anstallningsform: a.employment_type ? a.employment_type.label : "",
        erfarenhetKravs: a.experience_required,
        korkortKravs: a.driving_license_required,
        utdrag: utdragskrav(a),
        poang: p,
        chansniva: p >= 5 ? "hog" : (p >= 2 ? "medel" : "lag"),
        lank: a.webpage_url,
        sistaAnsokningsdag: a.application_deadline
      });
    }

    console.log("Hämtat sida " + (i + 1) + " av " + sidor);
  }

  jobb.sort(function (x, y) { return y.poang - x.poang; });

  fs.writeFileSync("public/jobb.json", JSON.stringify(jobb, null, 2));
  fs.writeFileSync("public/jobb.js", "const JOBB = " + JSON.stringify(jobb) + ";");
  fs.writeFileSync("docs/jobb.js", "const JOBB = " + JSON.stringify(jobb) + ";");

  const orter = {};
  for (const j of jobb) { if (j.ort) orter[j.ort] = true; }

  let hog = 0;
  for (const j of jobb) { if (j.chansniva === "hog") hog++; }

  console.log("Klart. " + jobb.length + " jobb i " + Object.keys(orter).length + " kommuner. Hog chans: " + hog);
}

hamtaJobb();
