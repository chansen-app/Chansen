/*  Dagens inlägg
 *
 *  Läser docs/jobb.js och skriver färdiga inlägg du kan klistra in.
 *  Ett per ort, plus ett för hela landet.
 *
 *  Kör med:   node .\dagens-inlagg.js
 *  Eller med egna orter:
 *             node .\dagens-inlagg.js Göteborg Malmö Uppsala
 *
 *  Resultatet skrivs i fönstret och sparas i dagens-inlagg.txt
 *
 *  Att lägga upp helt automatiskt kräver godkända nycklar från
 *  plattformarna, vilket tar veckor och sällan ges till privatpersoner.
 *  Det här gör i stället allt utom sista klicket.
 */

const fs = require("fs");

const STANDARD_ORTER = ["Göteborg", "Stockholm", "Malmö", "Uppsala", "Linköping"];

function slat(v) {
  return String(v == null ? "" : v).toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o").trim();
}

function svenskDatum(d) {
  const t = new Date(d);
  const m = ["januari","februari","mars","april","maj","juni",
             "juli","augusti","september","oktober","november","december"];
  return t.getDate() + " " + m[t.getMonth()];
}

function laddaJobb() {
  const kod = fs.readFileSync("docs/jobb.js", "utf8");
  const f = new Function(kod + "; return { JOBB, UPPDATERAD };");
  return f();
}

// Hur många jobb lades upp de senaste dygnen?
function nya(jobb, dagar) {
  const nu = Date.now();
  return jobb.filter(function (j) {
    if (!j.publicerad) return false;
    const d = Math.floor((nu - new Date(j.publicerad)) / 86400000);
    return d >= 0 && d <= dagar;
  });
}

function inlagg(ort, jobb) {
  const iOrten = ort
    ? jobb.filter(function (j) { return slat(j.ort).indexOf(slat(ort)) > -1; })
    : jobb;

  if (!iOrten.length) return null;

  const idag = nya(iOrten, 1).length;
  const veckan = nya(iOrten, 7).length;
  const plats = ort ? ort : "hela Sverige";
  const rader = [];

  // Vilken grupp jobb pratar vi om? Alla siffror nedan måste räknas över
  // samma grupp, annars kan "av dem" bli fler än totalen.
  var grupp;
  if (idag >= 3) {
    grupp = nya(iOrten, 1);
    rader.push(idag + " nya jobb i " + plats + " i dag, alla med låga ingångskrav.");
  } else if (veckan >= 5) {
    grupp = nya(iOrten, 7);
    rader.push(veckan + " nya jobb i " + plats + " den här veckan, alla med låga ingångskrav.");
  } else {
    grupp = iOrten;
    rader.push(iOrten.length + " jobb i " + plats + " just nu, alla med låga ingångskrav.");
  }

  const utanKrav = grupp.filter(function (j) { return j.nyborjarvanlig === true; }).length;

  // vilka kategorier finns mest av, i samma grupp
  const kat = {};
  grupp.forEach(function (j) { kat[j.kategori] = (kat[j.kategori] || 0) + 1; });
  const topp = Object.keys(kat).sort(function (a, b) { return kat[b] - kat[a]; }).slice(0, 3);

  rader.push("");
  rader.push("Mest just nu: " + topp.join(", ") + ".");
  if (utanKrav >= 3) {
    rader.push(utanKrav + " av dem har arbetsgivaren själv kryssat i att erfarenhet inte krävs.");
  }
  rader.push("");
  rader.push("Chansen går igenom hela Platsbanken varje natt och visar bara jobben");
  rader.push("där kraven faktiskt är låga. Gratis, inget konto, ingen reklam.");
  rader.push("");
  rader.push("chansen.nu");
  rader.push("");
  rader.push("#jobb #jobbsökande #extrajobb" + (ort ? " #" + slat(ort) : "") + " #förstajobbet");

  return {
    ort: plats,
    antal: iOrten.length,
    idag: idag,
    text: rader.join("\n")
  };
}

// Korta versionen måste säga samma sak som den långa, annars ser det
// slarvigt ut om båda postas samma dag.
function kort(ort, jobb) {
  const iOrten = ort
    ? jobb.filter(function (j) { return slat(j.ort).indexOf(slat(ort)) > -1; })
    : jobb;
  if (!iOrten.length) return null;

  const idag = nya(iOrten, 1).length;
  const veckan = nya(iOrten, 7).length;

  if (idag >= 3) {
    return idag + " nya jobb i " + ort + " i dag utan krav på erfarenhet 👀 chansen.nu";
  }
  if (veckan >= 5) {
    return veckan + " nya jobb i " + ort + " den här veckan utan krav på erfarenhet 👀 chansen.nu";
  }
  return iOrten.length + " jobb i " + ort + " utan krav på erfarenhet just nu 👀 chansen.nu";
}

const orter = process.argv.slice(2).length ? process.argv.slice(2) : STANDARD_ORTER;
const data = laddaJobb();
const jobb = data.JOBB;

const ut = [];
ut.push("Dagens inlägg, " + svenskDatum(new Date()));
ut.push("Jobben hämtades " + String(data.UPPDATERAD).slice(0, 10));
ut.push("=".repeat(60));
ut.push("");

const helaLandet = inlagg(null, jobb);
if (helaLandet) {
  ut.push("── HELA SVERIGE " + "─".repeat(42));
  ut.push("");
  ut.push(helaLandet.text);
  ut.push("");
}

orter.forEach(function (o) {
  const i = inlagg(o, jobb);
  if (!i) {
    ut.push("── " + o.toUpperCase() + ": inga jobb just nu");
    ut.push("");
    return;
  }
  ut.push("── " + o.toUpperCase() + " " + "─".repeat(Math.max(0, 56 - o.length)));
  ut.push("");
  ut.push(i.text);
  ut.push("");
  ut.push("Kort version, för en bild eller en story:");
  ut.push("  " + kort(o, jobb));
  ut.push("");
});

const text = ut.join("\n");
fs.writeFileSync("dagens-inlagg.txt", text);
console.log(text);
console.log("");
console.log("Sparat i dagens-inlagg.txt");
