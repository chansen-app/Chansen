/*  Nyhetsbrev
 *
 *  Läser docs/jobb.js och skriver ett färdigt nyhetsbrev med ungefär tolv
 *  jobb, spridda över landet och grupperade per region.
 *
 *  Ett jobb kommer med om det
 *    är märkt Bäst chans,
 *    inte kräver erfarenhet,
 *    inte har ren provisionslön,
 *    lades upp de senaste fem dagarna och
 *    har minst tio dagar kvar att söka.
 *
 *  Kör med:   node .\nyhetsbrev.js
 *
 *  Resultatet sparas i nyhetsbrev.html. Öppna filen i webbläsaren,
 *  markera allt med Ctrl + A, kopiera med Ctrl + C och klistra in i Sender
 *  med Ctrl + V. Länken ligger då redan bakom "Se jobbet".
 *
 *  I fönstret skrivs också en lista med varje jobb och dess länk, om
 *  länkarna skulle behöva läggas in för hand.
 */

const fs = require("fs");

const ANTAL = 12;
const MAX_PER_LAN = 2;
const DAGAR_UPPLAGT = 5;
const DAGAR_KVAR = 10;
const DAG = 24 * 60 * 60 * 1000;

const REGIONER = {
  "Norrland": ["Norrbottens län", "Västerbottens län", "Jämtlands län",
               "Västernorrlands län", "Gävleborgs län"],
  "Svealand": ["Stockholms län", "Uppsala län", "Södermanlands län",
               "Västmanlands län", "Örebro län", "Värmlands län", "Dalarnas län"],
  "Götaland": ["Östergötlands län", "Jönköpings län", "Kronobergs län",
               "Kalmar län", "Gotlands län", "Blekinge län", "Skåne län",
               "Hallands län", "Västra Götalands län"]
};

function svenskDatum(d) {
  const t = new Date(d);
  const m = ["januari","februari","mars","april","maj","juni",
             "juli","augusti","september","oktober","november","december"];
  return t.getDate() + " " + m[t.getMonth()];
}

function fly(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nummer(j) {
  const m = /annonser\/(\d+)/.exec(j.lank || "");
  return m ? m[1] : null;
}

function laddaJobb() {
  const kod = fs.readFileSync("docs/jobb.js", "utf8");
  const f = new Function(kod + "; return { JOBB, UPPDATERAD };");
  return f();
}

function region(lan) {
  for (const r in REGIONER) if (REGIONER[r].indexOf(lan) > -1) return r;
  return null;
}

function valjJobb(jobb, nu) {
  const kandidater = jobb.filter(function (j) {
    const upplagt = nu - new Date(j.publicerad);
    const kvar = new Date(j.sistaAnsokningsdag) - nu;
    return j.chansniva === "hog"
      && !j.erfarenhetKravs
      && !j.provision
      && upplagt >= 0 && upplagt <= DAGAR_UPPLAGT * DAG
      && kvar >= DAGAR_KVAR * DAG
      && region(j.lan)
      && nummer(j);
  }).sort(function (a, b) {
    return (b.sortpoang || b.poang || 0) - (a.sortpoang || a.poang || 0);
  });

  // Köer per region och län, med det bästa jobbet först i varje län.
  const koer = {};
  Object.keys(REGIONER).forEach(function (r) { koer[r] = {}; });
  kandidater.forEach(function (j) {
    const r = region(j.lan);
    (koer[r][j.lan] = koer[r][j.lan] || []).push(j);
  });

  // Ett jobb i taget från varje region, och inom regionen från ett län i
  // taget, så att jobben sprids över landet.
  const valda = [];
  const perLan = {};
  const arbetsgivare = {};
  const lanOrdning = {};
  Object.keys(koer).forEach(function (r) {
    lanOrdning[r] = Object.keys(koer[r]).sort(function (a, b) {
      return (koer[r][b][0].sortpoang || 0) - (koer[r][a][0].sortpoang || 0);
    });
  });
  const steg = {};
  let fortsatt = true;
  while (valda.length < ANTAL && fortsatt) {
    fortsatt = false;
    Object.keys(koer).forEach(function (r) {
      if (valda.length >= ANTAL) return;
      const lanen = lanOrdning[r];
      for (let forsok = 0; forsok < lanen.length; forsok++) {
        steg[r] = ((steg[r] || 0) + 1) % lanen.length;
        const lan = lanen[(steg[r] + lanen.length - 1) % lanen.length];
        if ((perLan[lan] || 0) >= MAX_PER_LAN) continue;
        const ko = koer[r][lan];
        while (ko.length && arbetsgivare[ko[0].arbetsgivare]) ko.shift();
        if (!ko.length) continue;
        const j = ko.shift();
        valda.push(j);
        perLan[lan] = (perLan[lan] || 0) + 1;
        arbetsgivare[j.arbetsgivare] = true;
        fortsatt = true;
        break;
      }
    });
  }
  return { valda: valda, antalKandidater: kandidater.length };
}

function jobbHtml(j) {
  const rad2 = [j.omfattning, "Sök senast " + svenskDatum(j.sistaAnsokningsdag)]
    .filter(Boolean).join(" · ");
  return ''
    + '<div style="margin:0 0 22px 0;">\n'
    + '  <div style="font-size:17px;font-weight:bold;color:#201e1d;">' + fly(j.titel) + '</div>\n'
    + '  <div style="font-size:15px;color:#201e1d;">' + fly(j.arbetsgivare) + ', ' + fly(j.ort) + '</div>\n'
    + '  <div style="font-size:15px;color:#645c50;">' + fly(rad2) + '</div>\n'
    + '  <div style="font-size:15px;margin-top:4px;"><a href="https://chansen.nu/#jobb-' + nummer(j)
    + '" style="color:#ac5e2b;font-weight:bold;">Se jobbet</a></div>\n'
    + '</div>\n';
}

const data = laddaJobb();
const nu = new Date(data.UPPDATERAD);
const urval = valjJobb(data.JOBB, nu);
const valda = urval.valda;

if (!valda.length) {
  console.log("Inga jobb uppfyller villkoren just nu. Prova igen efter nästa nattkörning.");
  process.exit(0);
}

let html = ''
  + '<!doctype html>\n<html lang="sv">\n<head>\n<meta charset="utf-8">\n'
  + '<title>Nyhetsbrev ' + svenskDatum(nu) + '</title>\n</head>\n'
  + '<body style="margin:0;padding:24px;background:#f5ead8;font-family:Figtree,Arial,sans-serif;color:#201e1d;">\n'
  + '<div style="max-width:560px;margin:0 auto;">\n'
  + '<h1 style="font-size:24px;margin:0 0 12px 0;">Nya jobb att söka</h1>\n'
  + '<p style="font-size:15px;line-height:1.5;margin:0 0 24px 0;">Hej! Här är ' + valda.length
  + ' jobb från de senaste dagarna där arbetsgivaren skriver att erfarenhet inte krävs. '
  + 'Alla går att söka i minst tio dagar till.</p>\n';

Object.keys(REGIONER).forEach(function (r) {
  const iRegionen = valda.filter(function (j) { return region(j.lan) === r; });
  if (!iRegionen.length) return;
  html += '<h2 style="font-size:19px;color:#8c491a;margin:28px 0 14px 0;">' + r + '</h2>\n';
  iRegionen.forEach(function (j) { html += jobbHtml(j); });
});

html += ''
  + '<p style="font-size:15px;line-height:1.5;margin:28px 0 0 0;">Fler jobb hittar du på '
  + '<a href="https://chansen.nu" style="color:#ac5e2b;font-weight:bold;">chansen.nu</a>. '
  + 'Nya jobb varje natt.</p>\n'
  + '</div>\n</body>\n</html>\n';

fs.writeFileSync("nyhetsbrev.html", html);

// Loggarna från GitHub är offentliga. Där skrivs bara antalet ut, aldrig
// själva mejlet.
if (process.env.GITHUB_ACTIONS) {
  console.log("Nyhetsbrevet är klart med " + valda.length + " jobb.");
  process.exit(0);
}

console.log("Nyhetsbrev, " + svenskDatum(new Date()));
console.log("Jobben hämtades " + String(data.UPPDATERAD).slice(0, 10)
  + ". " + urval.antalKandidater + " jobb uppfyllde villkoren, " + valda.length + " valdes.");
console.log("");
Object.keys(REGIONER).forEach(function (r) {
  const iRegionen = valda.filter(function (j) { return region(j.lan) === r; });
  if (!iRegionen.length) return;
  console.log("── " + r.toUpperCase());
  iRegionen.forEach(function (j) {
    console.log("");
    console.log("  " + j.titel);
    console.log("  " + j.arbetsgivare + ", " + j.ort);
    console.log("  " + [j.omfattning, "Sök senast " + svenskDatum(j.sistaAnsokningsdag)].filter(Boolean).join(" · "));
    console.log("  Se jobbet: https://chansen.nu/#jobb-" + nummer(j));
  });
  console.log("");
});
console.log("Sparat i nyhetsbrev.html. Öppna den i webbläsaren och kopiera allt in i Sender.");
