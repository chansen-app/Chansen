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
 *  Resultatet sparas i nyhetsbrev.html. Varje tisdag lägger
 *  skicka-nyhetsbrev.js upp det som ett utkast i Sender, så det här
 *  behövs bara om du vill titta på det själv. Öppna då filen i
 *  webbläsaren.
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

// Samma regioner och ordning som i mejlet Nathalie gjorde själv i Sender.
const REGIONER = {
  "Västsverige": ["Västra Götalands län", "Värmlands län"],
  "Stockholm och Uppsala": ["Stockholms län", "Uppsala län"],
  "Mellansverige": ["Södermanlands län", "Västmanlands län", "Örebro län", "Dalarnas län"],
  "Östergötland och Småland": ["Östergötlands län", "Jönköpings län", "Kronobergs län",
                               "Kalmar län", "Gotlands län"],
  "Södra Sverige": ["Skåne län", "Hallands län", "Blekinge län"],
  "Norrland": ["Norrbottens län", "Västerbottens län", "Jämtlands län",
               "Västernorrlands län", "Gävleborgs län"]
};

// Färger och typsnitt som fungerar i alla mejlprogram.
const F = "font-family:Arial,Helvetica,sans-serif;";
const LINJE = '<tr><td style="padding:28px 60px;"><div style="border-top:1px solid #c67139;"></div></td></tr>\n';

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

// Tar bort orten först i rubriken, till exempel "Göteborg: Cafébiträde".
function snyggTitel(j) {
  let t = String(j.titel || "").trim();
  if (j.ort) t = t.replace(new RegExp("^" + j.ort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[:,-]\\s*", "i"), "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function jobbHtml(j) {
  const rad2 = [j.arbetsgivare, j.ort, j.omfattning || j.anstallningsform,
    j.korkortKravs === true ? "Kräver körkort" : ""].filter(Boolean).map(fly).join(" · ");
  return ''
    + '<p style="' + F + 'margin:0 0 22px;font-size:17px;line-height:1.5;color:#201e1d;text-align:center;">\n'
    + '  <b>' + fly(snyggTitel(j)) + '</b><br>\n'
    + '  ' + rad2 + '<br>\n'
    + '  Sök senast ' + svenskDatum(j.sistaAnsokningsdag) + ' · '
    + '<a href="https://chansen.nu/#jobb-' + nummer(j) + '" style="color:#c67139;text-decoration:none;">Se jobbet</a>\n'
    + '</p>\n';
}

const data = laddaJobb();
const nu = new Date(data.UPPDATERAD);
const urval = valjJobb(data.JOBB, nu);
const valda = urval.valda;

if (!valda.length) {
  console.log("Inga jobb uppfyller villkoren just nu. Prova igen efter nästa nattkörning.");
  process.exit(0);
}

/* Utseendet bygger på mejlet Nathalie gjorde själv i Sender: loggan
   överst, tunna orange linjer, allt centrerat, och en orange fot.
   Tabeller i stället för vanlig layout, eftersom många mejlprogram
   bara klarar tabeller. Senders egen länk för att avsluta läggs till
   av Sender längst ned.                                            */
let html = ''
  + '<!doctype html>\n<html lang="sv">\n<head>\n<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
  + '<title>Veckans jobbtips</title>\n</head>\n'
  + '<body style="margin:0;padding:0;background:#f5ead8;">\n'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5ead8;">'
  + '<tr><td align="center" style="padding:24px 12px;">\n'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#f5ead8;">\n'
  + '<tr><td align="center" style="padding:20px 0 0;">'
  + '<a href="https://chansen.nu"><img src="https://chansen.nu/mejl-logga.png" width="100" height="100" alt="Chansen" style="display:block;border:0;"></a>'
  + '</td></tr>\n'
  + LINJE
  + '<tr><td style="padding:0 40px;' + F + 'text-align:center;color:#201e1d;">\n'
  + '<p style="margin:0 0 22px;font-size:26px;font-weight:bold;">Hej!</p>\n'
  + '<p style="margin:0;font-size:19px;line-height:1.55;">Här är veckans jobbtips. I alla jobb nedan krävs ingen '
  + 'tidigare erfarenhet, och de lades upp de senaste dagarna. Klicka på "Se jobbet" för att läsa mer och söka.</p>\n'
  + '</td></tr>\n';

Object.keys(REGIONER).forEach(function (r) {
  const iRegionen = valda.filter(function (j) { return region(j.lan) === r; });
  if (!iRegionen.length) return;
  html += LINJE
    + '<tr><td style="padding:0 40px;">\n'
    + '<p style="' + F + 'margin:0 0 8px;font-size:22px;font-weight:bold;text-decoration:underline;text-align:center;color:#201e1d;">' + r + '</p>\n';
  iRegionen.forEach(function (j) { html += jobbHtml(j); });
  html += '</td></tr>\n';
});

html += LINJE
  + '<tr><td style="padding:0 40px;' + F + 'text-align:center;color:#201e1d;">\n'
  + '<p style="margin:0 0 22px;font-size:17px;line-height:1.55;"><b>Hittar du inget nära dig?</b><br>'
  + 'Skriv in din kommun på <a href="https://chansen.nu" style="color:#c67139;text-decoration:none;">chansen.nu</a>. '
  + 'Där finns fler jobb, och nya kommer varje natt.</p>\n'
  + '<p style="margin:0;font-size:19px;font-weight:bold;">Lycka till med jobbsökandet!</p>\n'
  + '</td></tr>\n'
  + LINJE
  + '<tr><td align="center" style="background:#c67139;padding:36px 40px;' + F + 'text-align:center;color:#ffffff;">\n'
  + '<p style="margin:0 0 4px;font-size:17px;">Chansen</p>\n'
  + '<p style="margin:0 0 22px;font-size:17px;"><a href="https://chansen.nu" style="color:#fff2eb;text-decoration:none;">chansen.nu</a></p>\n'
  + '<p style="margin:0;font-size:17px;line-height:1.55;">Chansen är gratis och drivs av en privatperson. '
  + 'Den har inget med Arbetsförmedlingen att göra. Du hittar Chansen även på Facebook: &#64;chansen</p>\n'
  + '</td></tr>\n'
  + '</table>\n</td></tr></table>\n</body>\n</html>\n';

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
