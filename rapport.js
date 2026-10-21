/*  Månadsrapport
 *
 *  Räknar fram hur många jobb med låga ingångskrav som finns per län och
 *  bransch just nu, och gör en färdig rapport som PDF. Den kan skickas
 *  till kommuner, lokaltidningar och studie- och yrkesvägledare.
 *
 *  Kör med:   node .\rapport.js
 *
 *  Rapporten sparas i mappen rapporter, som aldrig följer med till
 *  GitHub. Både en PDF och en bild av första sidan sparas.
 *
 *  Alla siffror kommer från docs/jobb.js, alltså de jobb Chansen visar
 *  efter nattens sortering. Inga arbetsgivare eller annonser nämns,
 *  bara siffror. Siffrorna gäller dagen jobben hämtades.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find(p => fs.existsSync(p));

const MANADER = ["januari","februari","mars","april","maj","juni",
                 "juli","augusti","september","oktober","november","december"];

function fly(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Hårda mellanslag, så att siffror och procent aldrig delas på två rader.
function tal(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;"); }
function procent(a, b) { return (b ? Math.round(100 * a / b) : 0) + "&nbsp;%"; }

function laddaJobb() {
  const kod = fs.readFileSync("docs/jobb.js", "utf8");
  return new Function(kod + "; return { JOBB, UPPDATERAD };")();
}

function rakna(jobb) {
  const sverige = jobb.filter(j => j.lan && !j.land);
  const perLan = {}, perBransch = {};
  for (const j of sverige) {
    const l = perLan[j.lan] = perLan[j.lan] || { alla: 0, utanKrav: 0, deltid: 0, unga: 0, orter: {} };
    l.alla++;
    if (j.erfarenhetKravs === false) l.utanKrav++;
    if (/deltid/i.test(j.omfattning || "")) l.deltid++;
    if (j.minderarigOk === true) l.unga++;
    if (j.ort) l.orter[j.ort] = (l.orter[j.ort] || 0) + 1;
    if (j.kategori && j.kategori !== "Övrigt") perBransch[j.kategori] = (perBransch[j.kategori] || 0) + 1;
  }
  return {
    alla: sverige.length,
    utanKrav: sverige.filter(j => j.erfarenhetKravs === false).length,
    deltid: sverige.filter(j => /deltid/i.test(j.omfattning || "")).length,
    unga: sverige.filter(j => j.minderarigOk === true).length,
    lan: Object.keys(perLan).sort((a, b) => perLan[b].alla - perLan[a].alla).map(n => Object.assign({ namn: n }, perLan[n])),
    branscher: Object.keys(perBransch).sort((a, b) => perBransch[b] - perBransch[a]).slice(0, 8)
      .map(n => ({ namn: n, antal: perBransch[n] }))
  };
}

function html(s, datum) {
  const d = new Date(datum);
  const manad = MANADER[d.getMonth()] + " " + d.getFullYear();
  const dag = d.getDate() + " " + MANADER[d.getMonth()] + " " + d.getFullYear();
  const maxB = s.branscher.length ? s.branscher[0].antal : 1;

  const lanRader = s.lan.map(l => {
    const storst = Object.keys(l.orter).sort((a, b) => l.orter[b] - l.orter[a])[0] || "";
    return '<tr><td>' + fly(l.namn) + '</td><td class="t">' + tal(l.alla) + '</td>'
      + '<td class="t">' + tal(l.utanKrav) + '</td><td class="t">' + tal(l.deltid) + '</td>'
      + '<td class="t">' + tal(l.unga) + '</td><td>' + fly(storst) + '</td></tr>';
  }).join("\n");

  const branschRader = s.branscher.map(b =>
    '<div class="b"><div class="bn"><span>' + fly(b.namn) + '</span><b>' + tal(b.antal) + '</b></div>'
    + '<div class="bs"><i style="width:' + Math.round(100 * b.antal / maxB) + '%"></i></div></div>').join("\n");

  const font = "file:///" + path.resolve("docs").replace(/\\/g, "/");
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8">
<title>Jobb där erfarenhet inte krävs, ${manad}</title>
<style>
  @font-face{font-family:"Caprasimo";src:url("${font}/caprasimo.woff2") format("woff2")}
  @font-face{font-family:"Figtree";font-weight:400 700;src:url("${font}/figtree.woff2") format("woff2")}
  @page{size:A4;margin:16mm 16mm 18mm}
  body{margin:0;font-family:"Figtree",Arial,sans-serif;color:#201e1d;font-size:10.5pt;line-height:1.5}
  h1{font-family:"Caprasimo",serif;font-weight:400;font-size:26pt;line-height:1.1;margin:0 0 6pt}
  h2{font-family:"Caprasimo",serif;font-weight:400;font-size:15pt;margin:20pt 0 8pt}
  .topp{display:flex;justify-content:space-between;align-items:center;border-bottom:1.5pt solid #c67139;padding-bottom:8pt;margin-bottom:16pt}
  .logga{font-family:"Caprasimo",serif;font-size:14pt;color:#8c491a}
  .dampad{color:#645c50}
  .ingress{font-size:12pt;margin:0 0 16pt}
  .nycklar{display:flex;gap:10pt;margin:0 0 6pt}
  .nyckel{flex:1;background:#f5ead8;border-radius:10pt;padding:12pt}
  .nyckel b{display:block;font-family:"Caprasimo",serif;font-weight:400;font-size:24pt;color:#ac5e2b;line-height:1.1}
  .nyckel span{font-size:9.5pt;color:#645c50}
  table{width:100%;border-collapse:collapse;font-size:9.5pt}
  th{text-align:left;font-weight:700;border-bottom:1pt solid #c67139;padding:4pt 6pt}
  td{padding:3.5pt 6pt;border-bottom:0.5pt solid #e5dccd}
  .t{text-align:right;font-variant-numeric:tabular-nums}
  tr{break-inside:avoid}
  .b{margin:0 0 7pt}
  .bn{display:flex;justify-content:space-between;font-size:10pt}
  .bs{height:7pt;background:#ebddc5;border-radius:4pt;overflow:hidden;margin-top:2pt}
  .bs i{display:block;height:100%;background:#c67139;border-radius:4pt}
  .metod{font-size:9pt;color:#645c50;border-top:0.5pt solid #e5dccd;padding-top:10pt;margin-top:20pt}
  .sida{break-before:page}
</style></head><body>
<div class="topp"><span class="logga">Chansen</span><span class="dampad">chansen.nu · ${dag}</span></div>
<h1>Jobb där erfarenhet inte krävs, ${manad}</h1>
<p class="ingress">Chansen går varje natt igenom alla annonser i Platsbanken och sorterar bort dem som kräver utbildning, yrkesbevis eller flera års erfarenhet. Det här är läget den ${dag}, per län och bransch.</p>

<div class="nycklar">
  <div class="nyckel"><b>${tal(s.alla)}</b><span>jobb med låga ingångskrav i Sverige</span></div>
  <div class="nyckel"><b>${tal(s.utanKrav)}</b><span>där arbetsgivaren skriver att erfarenhet inte krävs, ${procent(s.utanKrav, s.alla)}</span></div>
</div>
<div class="nycklar">
  <div class="nyckel"><b>${tal(s.deltid)}</b><span>på deltid, ${procent(s.deltid, s.alla)}</span></div>
  <div class="nyckel"><b>${tal(s.unga)}</b><span>som går att söka för den som är under 18, ${procent(s.unga, s.alla)}</span></div>
</div>

<h2>Vanligaste branscherna</h2>
${branschRader}

<h2 class="sida">Per län</h2>
<table>
<tr><th>Län</th><th class="t">Jobb</th><th class="t">Erfarenhet krävs inte</th><th class="t">Deltid</th><th class="t">Under 18</th><th>Flest jobb i</th></tr>
${lanRader}
</table>

<div class="metod">
<p><b>Så har siffrorna tagits fram.</b> Annonserna kommer från Arbetsförmedlingens öppna data, JobSearch, och hämtades ${dag}. Chansen sorterar bort annonser med hårda krav, till exempel krav på utbildning, legitimation, yrkesbevis eller flera års erfarenhet, och annonser med enbart provisionslön. "Erfarenhet krävs inte" betyder att arbetsgivaren själv har angett det i annonsen. "Under 18" betyder att arbetet och arbetstiderna är tillåtna enligt arbetsmiljölagstiftningen för den som är under 18. Siffrorna är en ögonblicksbild och ändras varje natt.</p>
<p><b>Om Chansen.</b> Chansen är en gratis sida som drivs av en privatperson, utan vinstsyfte. Arbetsförmedlingen står inte bakom sidan. Siffrorna får gärna användas med källan Chansen, chansen.nu.</p>
</div>
</body></html>`;
}

async function main() {
  const data = laddaJobb();
  const s = rakna(data.JOBB);
  const datum = String(data.UPPDATERAD).slice(0, 10);

  console.log("Jobben hämtades " + data.UPPDATERAD);
  console.log("Jobb i Sverige: " + s.alla + ", erfarenhet krävs inte: " + s.utanKrav
    + ", deltid: " + s.deltid + ", under 18: " + s.unga + ", län: " + s.lan.length);

  if (!fs.existsSync("rapporter")) fs.mkdirSync("rapporter");
  const bas = path.join("rapporter", "chansen-rapport-" + datum.slice(0, 7));
  fs.writeFileSync(bas + ".html", html(s, data.UPPDATERAD));

  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  try {
    const p = await b.newPage();
    await p.goto("file:///" + path.resolve(bas + ".html").replace(/\\/g, "/"), { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: bas + ".pdf", format: "A4", printBackground: true });
    await p.setViewport({ width: 794, height: 1123 });
    await p.screenshot({ path: bas + "-sida1.png" });
  } finally {
    await b.close();
  }
  console.log("Klar: " + bas + ".pdf");
}

main().catch(e => { console.error("Något gick fel: " + e.message); process.exit(1); });
