/*  Kolla personuppgifter
 *
 *  Letar efter mejladresser, telefonnummer, personnummer, namn på
 *  privatpersoner och nycklar eller lösenord. Hittar den något avslutas
 *  den med fel, så att det inte kan sparas eller läggas upp.
 *
 *  Kör med:
 *    node .\kolla-personuppgifter.js              alla filer i repot
 *    node .\kolla-personuppgifter.js --staged     det som ska committas
 *    node .\kolla-personuppgifter.js docs labb    bara vissa filer eller mappar
 *    node .\kolla-personuppgifter.js --installera slå på spärren vid commit
 *
 *  Namnen som letas efter står i privat/namn.txt, ett namn per rad. Den
 *  mappen följer aldrig med till GitHub. På GitHub ligger samma namn i en
 *  secret som heter PERSONNAMN.
 *
 *  Uppgifter som får synas står i tillatna-uppgifter.txt.
 *
 *  Själva uppgiften skrivs aldrig ut, bara fil, rad och typ. Loggarna
 *  från GitHub är offentliga.
 */

const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { hitta } = require("./personuppgifter");

const TILLATNA_FIL = "tillatna-uppgifter.txt";
const NAMN_FIL = path.join("privat", "namn.txt");

// Filer som inte ska kollas: listan själv, och filer som bara innehåller regler.
const HOPPA_OVER = [TILLATNA_FIL, "personuppgifter.js", "kolla-personuppgifter.js"];

function rader(text) {
  return String(text || "").split(/\r?\n/)
    .map(function (r) { return r.trim(); })
    .filter(function (r) { return r && r[0] !== "#"; });
}

function lasOmFinns(fil) {
  try { return fs.readFileSync(fil, "utf8"); } catch (e) { return ""; }
}

function normalisera(v) {
  return String(v).toLowerCase().replace(/[\s-]/g, "");
}

const tillatna = {};
rader(lasOmFinns(TILLATNA_FIL)).forEach(function (r) { tillatna[normalisera(r)] = true; });

const namn = rader(lasOmFinns(NAMN_FIL))
  .concat(rader(String(process.env.PERSONNAMN || "").replace(/,/g, "\n")));
const namnMonster = namn.map(function (n) {
  const delar = n.split(/\s+/).map(function (d) { return d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
  return { namn: n, re: new RegExp("(?<![\\wåäöÅÄÖ])" + delar.join("\\s+") + "(?![\\wåäöÅÄÖ])", "i") };
});

function installera() {
  const krok = path.join(".git", "hooks", "pre-commit");
  fs.writeFileSync(krok, "#!/bin/sh\n# Stoppar en commit som innehåller personuppgifter.\nnode kolla-personuppgifter.js --staged\n");
  try { fs.chmodSync(krok, 0o755); } catch (e) {}
  console.log("Spärren är påslagen. Den körs vid varje commit.");
  if (!namn.length) console.log("Lägg namnen du vill spärra i " + NAMN_FIL + ", ett per rad.");
}

function allaFiler(argument) {
  if (!argument.length) {
    return cp.execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
  }
  const ut = [];
  (function ga(lista) {
    lista.forEach(function (p) {
      if (!fs.existsSync(p)) return;
      if (fs.statSync(p).isDirectory()) {
        ga(fs.readdirSync(p).map(function (n) { return path.join(p, n); }));
      } else {
        ut.push(p);
      }
    });
  })(argument);
  return ut;
}

// -z och execFileSync gör att filnamn med å, ä och ö fungerar. Utan dem
// skriver git namnen med koder, och då hittas inte filen.
function stagadeFiler() {
  return cp.execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { encoding: "utf8" })
    .split("\u0000").filter(Boolean)
    .map(function (f) {
      return { fil: f, text: cp.execFileSync("git", ["show", ":" + f], { encoding: "utf8", maxBuffer: 1 << 28 }) };
    });
}

// Nycklar och lösenord, till exempel till Sender, GitHub eller Adzuna.
// De ska bara ligga som secrets på GitHub, aldrig i en fil.
const NYCKLAR = [
  /eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/,
  /\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}/,
  /\b(api[_-]?key|api[_-]?token|access[_-]?token|token|secret|password|passwd|lösenord|losenord|app[_-]?key)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i
];

// Koder som är offentliga med flit. Cloudflares statistikkod laddas ner
// av alla besökare och ger inte tillgång till något.
const NYCKEL_UNDANTAG = [/data-cf-beacon=/];

function kolla(fil, text) {
  const ut = [];
  const norm = fil.replace(/\\/g, "/");
  if (HOPPA_OVER.indexOf(norm) > -1 || norm.indexOf("privat/") === 0) return ut;
  if (text.indexOf("\u0000") > -1) return ut;  // binär fil
  text.split(/\r?\n/).forEach(function (rad, i) {
    hitta(rad).forEach(function (f) {
      if (!tillatna[normalisera(f.varde)]) ut.push({ fil: norm, rad: i + 1, typ: f.typ });
    });
    namnMonster.forEach(function (n) {
      if (n.re.test(rad)) ut.push({ fil: norm, rad: i + 1, typ: "namn från listan" });
    });
    if (NYCKLAR.some(function (re) { return re.test(rad); })
        && !NYCKEL_UNDANTAG.some(function (re) { return re.test(rad); })) {
      ut.push({ fil: norm, rad: i + 1, typ: "nyckel eller lösenord" });
    }
  });
  return ut;
}

const arg = process.argv.slice(2);

if (arg[0] === "--installera") {
  installera();
  process.exit(0);
}

const filer = arg[0] === "--staged"
  ? stagadeFiler()
  : allaFiler(arg).map(function (f) { return { fil: f, text: lasOmFinns(f) }; });

let fynd = [];
filer.forEach(function (f) { fynd = fynd.concat(kolla(f.fil, f.text)); });

if (!namn.length) {
  console.log("Obs: ingen lista med namn hittades, så bara mejl, telefonnummer och personnummer kollades.");
}

if (!fynd.length) {
  console.log("Inga personuppgifter hittades i " + filer.length + " filer.");
  process.exit(0);
}

console.log("");
console.log("STOPP. Det här ser ut som personuppgifter:");
console.log("");
fynd.slice(0, 50).forEach(function (f) {
  console.log("  " + f.fil + ", rad " + f.rad + ": " + f.typ);
});
if (fynd.length > 50) console.log("  ... och " + (fynd.length - 50) + " till");
console.log("");
console.log("Ta bort uppgiften och försök igen. Är det en adress som ska synas,");
console.log("till exempel ett företags adress för ansökningar, lägg till den i");
console.log(TILLATNA_FIL + ".");
process.exit(1);
