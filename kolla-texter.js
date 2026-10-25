/*  Regelkoll på texterna i Chansen.
 *
 *  Letar efter ord och tecken som reglerna i CLAUDE.md säger att det
 *  aldrig får stå på chansen.nu: "inget konto", "anonymt", tankstreck,
 *  långa länkar med ?fran= och liknande. Kommentarer i koden hoppas över,
 *  bara sådant som kan synas för besökare kollas.
 *
 *  Jobbannonserna kollas inte. De är arbetsgivarnas egna texter.
 *
 *  Kör med:   node kolla-texter.js
 *  Körs också av sig själv på GitHub varje gång något laddas upp.
 *  Hittar den något misslyckas körningen, och GitHub mejlar dig.
 */

const fs = require("fs");
const path = require("path");

const FILER = [
  "docs/index.html", "docs/widget.html",
  "docs/labb/norge.html", "docs/labb/uk.html",
  "hamta.js", "nyhetsbrev.js", "rapport.js", "sasong.js"
];

// mallarna till videorna har också text som syns
const MALLAR = "video-mallar";

const BOKSTAV = "A-Za-zÅÄÖåäöÆØæø0-9";

const REGLER = [
  { namn: "inget konto", re: /inget konto|inga konton krävs|utan konto/i },
  { namn: "ingen inloggning", re: /ingen inloggning|utan inloggning/i },
  { namn: "anonymt", re: /anonym/i },
  { namn: "ingen reklam", re: /ingen reklam|utan reklam|reklamfri/i },
  { namn: "lång länk med ?fran=", re: /chansen\.nu\/?\?fran=/i },
  // Tankstreck mellan ord. Ett ensamt streck som visas när en siffra
  // saknas, eller ett intervall som 9–17, räknas inte.
  { namn: "tankstreck", re: new RegExp("[" + BOKSTAV + ".,)] [–—] [" + BOKSTAV + "(]|[" + BOKSTAV + "]—[" + BOKSTAV + "]") },
  { namn: "Ansök nu", re: /ansök nu/i },
  { namn: "garanterat", re: /garanter(ar|at|ade)(?!\s+inte)/i }
];

/* Byter ut kommentarer mot tomma rader, så att radnumren stämmer. */
function utanKommentarer(text) {
  const tom = m => m.replace(/[^\n]/g, "");
  return text
    .replace(/<!--[\s\S]*?-->/g, tom)
    // inte https://*.exempel.se, som står i sidans säkerhetsinställningar
    .replace(/(^|[^\/])\/\*[\s\S]*?\*\//g, (m, fore) => fore + tom(m.slice(fore.length)))
    .replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, fore) => fore);
}

function allaFiler() {
  const lista = FILER.filter(f => fs.existsSync(f));
  if (fs.existsSync(MALLAR)) {
    for (const f of fs.readdirSync(MALLAR)) {
      if (/\.(html|js)$/.test(f)) lista.push(path.join(MALLAR, f).replace(/\\/g, "/"));
    }
  }
  return lista;
}

let fel = 0;
for (const fil of allaFiler()) {
  const rader = utanKommentarer(fs.readFileSync(fil, "utf8").replace(/\r\n/g, "\n")).split("\n");
  rader.forEach((rad, i) => {
    for (const regel of REGLER) {
      const m = rad.match(regel.re);
      if (!m) continue;
      fel++;
      const start = Math.max(0, m.index - 40);
      console.log(fil + ":" + (i + 1) + "  [" + regel.namn + "]  ..." + rad.slice(start, m.index + 50).trim() + "...");
    }
  });
}

if (fel) {
  console.log("\n" + fel + " ställen bryter mot reglerna i CLAUDE.md.");
  process.exit(1);
}
console.log("Texterna följer reglerna.");
