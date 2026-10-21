/*  Affisch
 *
 *  Gör en affisch i A4 med en telefon som visar Chansen och en QR-kod
 *  som öppnar Chansen med orten ifylld. En per skola eller ställe.
 *
 *  Kör med:   node .\affisch.js Halmstad k7
 *             (ort och kodord, samma kodord som i privat/markningar.txt)
 *  eller:     node .\affisch.js Halmstad   utan kodord, då räknas besöken bara på orten
 *
 *  Två versioner sparas i mappen affischer, som aldrig följer med till
 *  GitHub: en i färg för tryckeri eller skolans skrivare, och en
 *  svartvit som går att skriva ut hemma.
 *
 *  Telefonen visar Chansens riktiga sida, men med påhittade jobb från
 *  arbetsgivare som heter Exempel. Riktiga arbetsgivare visas aldrig i
 *  marknadsföring. Inga siffror som ändras står på affischen.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const QR = require("qrcode");

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find(p => fs.existsSync(p));

function slat(v) {
  return String(v || "").toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function fly(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Samma kodade länk som privat/ny-lank.js gör: ort och kodord, utan att
// något av dem syns i klartext.
function lank(ort, kod) {
  if (!kod) return "https://chansen.nu/?ort=" + encodeURIComponent(ort);
  const t = Buffer.from(ort + "." + kod, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return "https://chansen.nu/?k=" + t;
}

/* Påhittade jobb till telefonen. Alla arbetsgivare heter Exempel. */
function exempeljobb(ort, lan) {
  const om = d => new Date(Date.now() + d * 86400000).toISOString().slice(0, 19);
  const bas = { ort, lan, land: "", stad: "", erfarenhetKravs: false, korkortKravs: false,
    utdrag: "framgar inte", sprak: "namns inte", provision: false, lonform: "Fast månads- vecko- eller timlön",
    nattarbete: false, nyborjarvanlig: true, nyborjarskal: "arbetsgivaren har själv angett att erfarenhet inte krävs",
    minderarigOk: true, chansniva: "hog", bemanning: false, publicerad: om(-1) };
  return [
    ["Kafébiträde", "Exempel Café AB", "Deltid", "Restaurang och café", "Vi söker dig som vill jobba i vårt kafé. Du lär dig allt på plats, och erfarenhet behövs inte.", 21],
    ["Lagermedarbetare", "Exempel Lager AB", "Heltid", "Lager och logistik", "Plock och pack på vårt lager. Vi lär upp dig från första dagen.", 18],
    ["Butiksmedarbetare", "Exempel Butik AB", "Deltid", "Butik", "Kassa, påfyllning och kundkontakt i vår butik. Passar dig som gillar att möta människor.", 25],
    ["Städare", "Exempel Städ AB", "Deltid", "Städ", "Städning av kontor på kvällar. Utrustning och upplärning ingår.", 15],
    ["Diskare", "Exempel Restaurang AB", "Deltid", "Restaurang och café", "Disk och enklare köksarbete på kvällar och helger.", 20],
    ["Personlig assistent", "Exempel Assistans AB", "Deltid", "Vård och omsorg", "Hjälp i vardagen för en ung man. Introduktion ingår.", 30],
    ["Truckförare", "Exempel Logistik AB", "Heltid", "Lager och logistik", "Truckkort ordnar vi åt dig. Vi lär upp dig på plats.", 22],
    ["Kassapersonal", "Exempel Livs AB", "Deltid", "Butik", "Kassa och kundservice i vår livsmedelsbutik.", 16],
    ["Lokalvårdare", "Exempel Fastighet AB", "Deltid", "Städ", "Städning av trapphus och lokaler dagtid.", 19],
    ["Servitör", "Exempel Bistro AB", "Deltid", "Restaurang och café", "Servering på vår bistro. Vi lär dig allt från början.", 24],
    ["Montör", "Exempel Industri AB", "Heltid", "Industri och produktion", "Enklare montering i vår fabrik. Upplärning på plats.", 28],
    ["Barnvakt", "Exempel Barnomsorg AB", "Deltid", "Barn och skola", "Hämtning från förskola några eftermiddagar i veckan.", 17]
  ].map(([titel, arbetsgivare, omfattning, kategori, beskrivning, dagar], i) => Object.assign({}, bas, {
    titel, arbetsgivare, omfattning, kategori, beskrivning,
    anstallningsform: "Vanlig anställning", poang: 14 - i, sortpoang: 150 - i,
    lank: "https://arbetsformedlingen.se/platsbanken/annonser/1000000" + i,
    sistaAnsokningsdag: om(dagar) + "", publicerad: om(-1 - i)
  }));
}

/* En bild av Chansens riktiga sida, med de påhittade jobben. En kopia av
   sidan läggs i en tillfällig mapp i privat, så att docs inte rörs. */
async function skarmbild(webblasare, ort, fil) {
  const mapp = path.resolve("privat", "_affisch-sida");
  fs.rmSync(mapp, { recursive: true, force: true });
  fs.mkdirSync(mapp, { recursive: true });
  for (const f of fs.readdirSync("docs")) {
    if (/\.(html|woff2|png|json)$/.test(f)) fs.copyFileSync(path.join("docs", f), path.join(mapp, f));
  }
  const riktig = new Function(fs.readFileSync("docs/jobb.js", "utf8") + "; return { JOBB, KOMMUNLAN };")();
  const lan = (riktig.JOBB.find(j => slat(j.ort) === slat(ort)) || {}).lan || "";
  const kommunlan = {}; kommunlan[ort] = lan;
  fs.writeFileSync(path.join(mapp, "jobb.js"),
    'const UPPDATERAD = "' + new Date().toISOString() + '";\nconst JOBB_HAMTAD = UPPDATERAD;\n'
    + "const KOMMUNLAN = " + JSON.stringify(kommunlan) + ";\nconst JOBB = " + JSON.stringify(exempeljobb(ort, lan)) + ";");
  fs.writeFileSync(path.join(mapp, "egna-jobb.js"), "const EGNA_JOBB = [];");

  const p = await webblasare.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  await p.evaluateOnNewDocument(ort => {
    try {
      localStorage.clear();
      localStorage.setItem("chansen", JSON.stringify({ alder: "18 eller äldre", ort: ort }));
      localStorage.setItem("chansen-hemskarm", "inte-nu");
      localStorage.setItem("chansen-tyckt", "Ja");
    } catch (e) {}
  }, ort);
  await p.goto("file:///" + path.join(mapp, "index.html").replace(/\\/g, "/"), { waitUntil: "load" });
  // Rutor som inte hör hemma på en affisch döljs.
  await p.addStyleTag({ content: "#tyckruta,#kvitto,#hemskarm,#nyversion,#gammaldata{display:none!important}" });
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: fil });
  await p.close();
  fs.rmSync(mapp, { recursive: true, force: true });
}

function affischHtml(ort, skarm, qr, svartvit) {
  const docs = "file:///" + path.resolve("docs").replace(/\\/g, "/");
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><style>
  @font-face{font-family:"Caprasimo";src:url("${docs}/caprasimo.woff2") format("woff2")}
  @font-face{font-family:"Figtree";font-weight:400 700;src:url("${docs}/figtree.woff2") format("woff2")}
  @page{size:A4;margin:0}
  html,body{margin:0;width:210mm;height:297mm;overflow:hidden}
  body{background:${svartvit ? "#ffffff" : "#f5ead8"};color:#201e1d;font-family:"Figtree",sans-serif;
    ${svartvit ? "filter:grayscale(1);" : ""}}
  /* Tunn ram med rundade hörn, 15 mm från kanten. */
  .ram{position:absolute;inset:15mm;border:0.7mm solid #c67139;border-radius:8mm}
  .inne{position:absolute;inset:15mm;display:flex;flex-direction:column;align-items:center;text-align:center;padding:16mm 14mm 14mm}
  h1{font-family:"Caprasimo",serif;font-weight:400;font-size:34pt;line-height:1.05;margin:0 0 5mm}
  .text{font-size:13pt;line-height:1.45;max-width:140mm;margin:0;color:#3a3633}
  .scen{flex:1;width:100%;display:flex;align-items:center;justify-content:center;perspective:1400px}
  /* Telefonen: en ram i metall, en svart kant, skärmen och knapparna på
     sidan. Lutad i 3D med skugga och ljusreflex, så att den ser äkta ut. */
  .telefon{position:relative;width:62mm;height:128mm;border-radius:11mm;
    transform:rotateY(-20deg) rotateX(7deg) rotateZ(2deg);transform-style:preserve-3d;
    background:linear-gradient(135deg,#e9e7e4 0%,#b9b6b1 18%,#f4f2ef 35%,#9c9893 60%,#d8d5d0 80%,#8d8a85 100%);
    padding:1.6mm;box-sizing:border-box;
    box-shadow:-14mm 18mm 22mm rgba(60,40,20,.28),-4mm 6mm 8mm rgba(60,40,20,.22),
      inset 0 0 0.6mm rgba(255,255,255,.9),inset 0 0 1.6mm rgba(0,0,0,.35)}
  .kant{position:relative;width:100%;height:100%;border-radius:9.6mm;background:#0b0b0c;padding:1.7mm;box-sizing:border-box}
  .skarm{position:relative;width:100%;height:100%;border-radius:8mm;overflow:hidden;background:#f5ead8}
  .skarm img{width:100%;display:block}
  .o{position:absolute;left:50%;top:2.2mm;width:17mm;height:5mm;margin-left:-8.5mm;border-radius:3mm;background:#000;z-index:2}
  /* Statusrad som på en riktig telefon, så att kameran inte täcker sidan. */
  .status{height:9.5mm;display:flex;justify-content:space-between;align-items:center;padding:0 5.5mm;
    font-size:6.4pt;font-weight:700;color:#201e1d;background:#f5ead8}
  .batteri{display:inline-block;width:4.6mm;height:2.2mm;border:0.35mm solid #201e1d;border-radius:0.7mm;position:relative;margin-left:1mm;vertical-align:-0.3mm}
  .batteri:after{content:"";position:absolute;inset:0.3mm;right:1mm;background:#201e1d;border-radius:0.3mm}
  .staplar{display:inline-flex;gap:0.35mm;align-items:flex-end;vertical-align:-0.2mm}
  .staplar i{display:block;width:0.6mm;background:#201e1d;border-radius:0.2mm}
  .reflex{position:absolute;inset:0;border-radius:8mm;z-index:3;
    background:linear-gradient(115deg,rgba(255,255,255,.38) 0%,rgba(255,255,255,.08) 28%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 100%)}
  .knapp{position:absolute;width:1.2mm;border-radius:0.6mm;background:linear-gradient(90deg,#8d8a85,#d8d5d0)}
  .botten{display:flex;align-items:center;gap:8mm;margin-top:6mm}
  .qr{width:34mm;height:34mm;background:#fff;padding:2.5mm;border-radius:3mm;box-sizing:content-box}
  .qr img{width:100%;height:100%;display:block}
  .uppmaning{text-align:left}
  .uppmaning b{display:block;font-size:15pt;margin:0 0 1mm}
  .adress{font-family:"Caprasimo",serif;font-size:26pt;color:#8c491a;line-height:1}
  .liten{font-size:10pt;color:#645c50;margin-top:2mm}
</style></head><body>
<div class="ram"></div>
<div class="inne">
  <h1>jobb som går att söka,<br>nära dig</h1>
  <p class="text">Chansen går igenom Platsbanken varje natt och visar jobb med låga ingångskrav i ${fly(ort)}. Gratis att använda.</p>
  <div class="scen">
    <div class="telefon">
      <span class="knapp" style="left:-0.9mm;top:24mm;height:7mm"></span>
      <span class="knapp" style="left:-0.9mm;top:35mm;height:12mm"></span>
      <span class="knapp" style="left:-0.9mm;top:50mm;height:12mm"></span>
      <span class="knapp" style="right:-0.9mm;top:38mm;height:18mm"></span>
      <div class="kant"><div class="skarm"><span class="o"></span><div class="status"><span>9:41</span><span><span class="staplar"><i style="height:0.8mm"></i><i style="height:1.2mm"></i><i style="height:1.6mm"></i><i style="height:2mm"></i></span><span class="batteri"></span></span></div><img src="${skarm}"><span class="reflex"></span></div></div>
    </div>
  </div>
  <div class="botten">
    <div class="qr"><img src="${qr}"></div>
    <div class="uppmaning">
      <b>Skanna och se jobben i ${fly(ort)}</b>
      <div class="adress">chansen.nu</div>
      <div class="liten">Nya jobb varje natt</div>
    </div>
  </div>
</div>
</body></html>`;
}

async function main() {
  const ort = (process.argv[2] || "").trim();
  const kod = (process.argv[3] || "").toLowerCase().trim();
  if (!ort) { console.log("Skriv till exempel: node .\\affisch.js Halmstad k7"); process.exit(1); }
  if (kod && !/^[a-z0-9-]{1,20}$/.test(kod)) { console.log("Kodordet får bara ha små bokstäver, siffror och bindestreck."); process.exit(1); }

  if (!fs.existsSync("affischer")) fs.mkdirSync("affischer");
  const namn = "affisch-" + slat(ort) + (kod ? "-" + kod : "");
  const skarm = path.resolve("affischer", "_skarm.png");
  const qrFil = path.resolve("affischer", "_qr.png");
  const adress = lank(ort, kod);

  // QR-koden är svart på vit botten, så att den går att läsa även i svartvitt.
  await QR.toFile(qrFil, adress, { errorCorrectionLevel: "M", margin: 0, width: 800, color: { dark: "#000000", light: "#ffffff" } });

  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  try {
    await skarmbild(b, ort, skarm);
    for (const svartvit of [false, true]) {
      const fil = path.join("affischer", namn + (svartvit ? "-svartvit" : "-farg"));
      const htmlFil = path.resolve("affischer", "_affisch.html");
      fs.writeFileSync(htmlFil, affischHtml(ort,
        "file:///" + skarm.replace(/\\/g, "/"), "file:///" + qrFil.replace(/\\/g, "/"), svartvit));
      const p = await b.newPage();
      await p.goto("file:///" + htmlFil.replace(/\\/g, "/"), { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      await p.pdf({ path: fil + ".pdf", width: "210mm", height: "297mm", printBackground: true });
      await p.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
      await p.screenshot({ path: fil + ".png" });
      await p.close();
      console.log("Klar: " + fil + ".pdf");
    }
  } finally {
    await b.close();
    for (const f of ["_skarm.png", "_qr.png", "_affisch.html"]) fs.rmSync(path.join("affischer", f), { force: true });
  }
  console.log("QR-koden leder till " + (kod ? "Chansen med " + ort + " ifyllt, och räknas under kodordet " + kod + "." : "Chansen med " + ort + " ifyllt."));
}

main().catch(e => { console.error("Något gick fel: " + e.message); process.exit(1); });
