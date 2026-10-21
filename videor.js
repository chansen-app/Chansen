/*  Videor
 *
 *  Gör korta videor till TikTok, Instagram Reels och YouTube Shorts med
 *  riktiga siffror från docs/jobb.js. Du lägger upp dem själv.
 *
 *  Kör med:   node .\videor.js Göteborg            alla fyra mallarna
 *  eller:     node .\videor.js                     för hela Sverige
 *  eller:     node .\videor.js Göteborg --mall 2   bara en mall
 *
 *  Videorna sparas i mappen videor, som aldrig följer med till GitHub.
 *  Datumet i filnamnet är när jobben hämtades, alltså när siffrorna stämde.
 *
 *  Videorna visar bara siffror, branscher och orter. Aldrig arbetsgivare,
 *  jobbtitlar eller text från annonser.
 *
 *  Mallar, alla med maskoten som berättar i en pratbubbla:
 *    1  Nattens siffra: hur många nya jobb som kom i natt, och de tre
 *       vanligaste branscherna.
 *    2  Var finns jobben: staplar per bransch med jobben i orten just nu.
 *    3  Kontrasten: en påhittad annons som kräver erfarenhet, och sedan
 *       hur många jobb där erfarenhet inte krävs som finns just nu.
 *    4  Skärminspelningen: en telefon där kommunen skrivs in och en
 *       lista med påhittade exempeljobb visas.
 *
 *  Varje video kräver minst fem jobb. Annars görs ingen video, och
 *  skriptet säger varför.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer-core");
const ffmpeg = require("ffmpeg-static");

const BREDD = 1080, HOJD = 1920, BILDER_PER_SEKUND = 30;
const MINST = 5;
const DYGN = 24 * 60 * 60 * 1000;

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find(p => fs.existsSync(p));

function slat(v) {
  return String(v || "").toLowerCase()
    .replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function svenskDatum(d) {
  const t = new Date(d);
  const m = ["januari","februari","mars","april","maj","juni",
             "juli","augusti","september","oktober","november","december"];
  return t.getDate() + " " + m[t.getMonth()];
}

function laddaJobb() {
  const kod = fs.readFileSync("docs/jobb.js", "utf8");
  return new Function(kod + "; return { JOBB, UPPDATERAD };")();
}

function iOrten(data, ort) {
  return ort ? data.JOBB.filter(j => slat(j.ort) === slat(ort)) : data.JOBB;
}

function platsnamn(data, ort) {
  const forsta = data.JOBB.find(j => slat(j.ort) === slat(ort));
  return ort ? (forsta ? forsta.ort : ort) : "Sverige";
}

/* Jobben i orten där erfarenhet inte krävs, just nu. Till mall 2, 3 och 4. */
function utanKrav(data, ort) {
  const lista = iOrten(data, ort).filter(j => j.erfarenhetKravs === false);
  const per = {};
  for (const j of lista) if (j.kategori && j.kategori !== "Övrigt") per[j.kategori] = (per[j.kategori] || 0) + 1;
  const branscher = Object.keys(per).sort((a, b) => per[b] - per[a]).slice(0, 6);
  return { antal: lista.length, per, branscher };
}

/* Siffrorna till mall 1. Nya jobb är jobb som lades upp det senaste
   dygnet innan jobben hämtades, och där erfarenhet inte krävs. */
function nattensSiffra(data, ort) {
  const hamtad = new Date(data.UPPDATERAD);
  const iOrten = ort ? data.JOBB.filter(j => slat(j.ort) === slat(ort)) : data.JOBB;
  const nya = iOrten.filter(j => {
    const sedan = hamtad - new Date(j.publicerad);
    return j.erfarenhetKravs === false && sedan >= 0 && sedan <= DYGN;
  });
  const per = {};
  for (const j of nya) if (j.kategori && j.kategori !== "Övrigt") per[j.kategori] = (per[j.kategori] || 0) + 1;
  const branscher = Object.keys(per).sort((a, b) => per[b] - per[a]).slice(0, 3);
  const plats = ort ? (iOrten[0] ? iOrten[0].ort : ort) : "Sverige";
  return { antal: nya.length, plats, branscher, perBransch: per, iOrten: iOrten.length };
}

async function gorVideo(mall, data, fil) {
  if (!CHROME) throw new Error("Hittar ingen Chrome eller Edge på datorn.");
  const webblasare = await puppeteer.launch({ executablePath: CHROME, headless: true,
    args: ["--allow-file-access-from-files", "--disable-gpu"] });
  try {
    const sida = await webblasare.newPage();
    await sida.setViewport({ width: BREDD, height: HOJD, deviceScaleFactor: 1 });
    await sida.evaluateOnNewDocument(d => { window.DATA = d; }, data);
    const adress = "file:///" + path.resolve("video-mallar", mall + ".html").replace(/\\/g, "/");
    await sida.goto(adress, { waitUntil: "load" });
    await sida.evaluate(() => document.fonts.ready);
    const langd = await sida.evaluate(() => window.LANGD);
    const antalBilder = Math.round(langd * BILDER_PER_SEKUND);

    const ff = spawn(ffmpeg, ["-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(BILDER_PER_SEKUND), "-i", "-",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(BILDER_PER_SEKUND),
      "-movflags", "+faststart", fil], { stdio: ["pipe", "inherit", "inherit"] });
    const klar = new Promise((ok, fel) => ff.on("close", k => k === 0 ? ok() : fel(new Error("ffmpeg avslutades med " + k))));

    for (let i = 0; i < antalBilder; i++) {
      await sida.evaluate(t => window.rita(t), i / BILDER_PER_SEKUND);
      const bild = await sida.screenshot({ type: "png" });
      if (!ff.stdin.write(bild)) await new Promise(r => ff.stdin.once("drain", r));
      if (i % 90 === 0) process.stdout.write("\r  Bild " + i + " av " + antalBilder);
    }
    process.stdout.write("\r  Bild " + antalBilder + " av " + antalBilder + "\n");
    ff.stdin.end();
    await klar;
    // Tre stillbilder, så att du kan titta utan att öppna videon.
    const tider = await sida.evaluate(() => window.BILDER || [2, 8, 14]);
    for (let i = 0; i < tider.length; i++) {
      await sida.evaluate(t => window.rita(t), tider[i]);
      await sida.screenshot({ path: fil.replace(/\.mp4$/, "-bild" + (i + 1) + ".png") });
    }
  } finally {
    await webblasare.close();
  }
}

function skriv(rubrik, rader) {
  console.log("");
  console.log(rubrik);
  rader.forEach(r => console.log("  " + r));
}

async function main() {
  const arg = process.argv.slice(2);
  const mi = arg.indexOf("--mall");
  const valdMall = mi > -1 ? String(arg[mi + 1] || "") : "alla";
  const ort = arg.filter((a, i) => mi < 0 || (i !== mi && i !== mi + 1)).join(" ").trim();
  const data = laddaJobb();
  const datum = String(data.UPPDATERAD).slice(0, 10);
  const dag = svenskDatum(data.UPPDATERAD);
  const plats = platsnamn(data, ort);
  const slug = slat(plats) || "sverige";

  console.log("Jobben hämtades " + data.UPPDATERAD + ". Siffrorna gäller " + plats + ".");
  if (ort && iOrten(data, ort).length === 0) {
    console.log("Hittar inga jobb i " + ort + ". Stavade du orten rätt?");
    process.exit(1);
  }
  if (!fs.existsSync("videor")) fs.mkdirSync("videor");

  const u = utanKrav(data, ort);
  const att = [];

  if (valdMall === "alla" || valdMall === "1") {
    const s = nattensSiffra(data, ort);
    skriv("Mall 1, Nattens siffra", [
      "Nya det senaste dygnet där erfarenhet inte krävs: " + s.antal,
      "Per bransch: " + (Object.keys(s.perBransch).map(k => k + " " + s.perBransch[k]).join(", ") || "inga")]);
    if (s.antal < MINST || !s.branscher.length) console.log("  För få nya jobb, minst " + MINST + " behövs. Ingen video.");
    else att.push(["nattens-siffra", { antal: s.antal, plats, datum: dag, branscher: s.branscher,
      antalPer: s.branscher.map(b => s.perBransch[b]), flera: s.branscher.some(b => s.perBransch[b] > 1) }]);
  }

  if (valdMall === "alla" || valdMall === "2") {
    skriv("Mall 2, Var finns jobben", [
      "Jobb just nu där erfarenhet inte krävs: " + u.antal,
      "Per bransch: " + (u.branscher.map(b => b + " " + u.per[b]).join(", ") || "inga")]);
    if (u.antal < MINST || u.branscher.length < 2) console.log("  För få jobb eller branscher. Ingen video.");
    else att.push(["var-finns-jobben", { plats, datum: dag, branscher: u.branscher, antalPer: u.branscher.map(b => u.per[b]) }]);
  }

  if (valdMall === "alla" || valdMall === "3") {
    skriv("Mall 3, Kontrasten", ["Jobb just nu där erfarenhet inte krävs: " + u.antal]);
    if (u.antal < MINST) console.log("  För få jobb, minst " + MINST + " behövs. Ingen video.");
    else att.push(["kontrasten", { plats, datum: dag, antal: u.antal }]);
  }

  if (valdMall === "alla" || valdMall === "4") {
    skriv("Mall 4, Skärminspelningen", ["Jobb just nu där erfarenhet inte krävs: " + u.antal,
      "Jobben i telefonen är påhittade exempel."]);
    if (u.antal < MINST) console.log("  För få jobb, minst " + MINST + " behövs. Ingen video.");
    else att.push(["skarminspelning", { plats, datum: dag, antal: u.antal }]);
  }

  for (const [mall, d] of att) {
    const fil = path.join("videor", mall + "-" + slug + "-" + datum + ".mp4");
    console.log("");
    console.log("Gör " + fil);
    await gorVideo(mall, d, fil);
  }
  console.log("");
  console.log(att.length ? "Klart. Videorna ligger i mappen videor." : "Inga videor gjordes.");
}

main().catch(e => { console.error("Något gick fel: " + e.message); process.exit(1); });
