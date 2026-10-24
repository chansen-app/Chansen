/*  Säsong
 *
 *  Räknar varje natt hur många jobb som handlar om jul, sommar, vinter
 *  och säsong, och sparar siffrorna i docs/sasong.json. När en sort
 *  börjar öka skrivs en varning där, och den syns i Chansen Admin. Då
 *  vet du när det är dags för inlägg om till exempel sommarjobb.
 *
 *  Körs av nattkörningen efter hamta.js. Kan också köras för hand:
 *    node .\sasong.js
 *    node .\sasong.js --bakat 60   fyller på de senaste 60 dagarna ur
 *                                  git-historiken, en gång
 *
 *  Bara antal sparas, inga annonser och inga arbetsgivare.
 */

const fs = require("fs");
const { execFileSync } = require("child_process");

const FIL = "docs/sasong.json";
const SPARA_DAGAR = 400;

// Vad som räknas till varje säsong, sökt i rubrik och beskrivning.
const SORTER = {
  jul:    { namn: "Jul och nyår", re: /\bjul|julhandel|julextra|december|nyår/i },
  sommar: { namn: "Sommarjobb", re: /sommar/i },
  vinter: { namn: "Vinter och snö", re: /vinter|snöröj|skid|fjäll|liftar/i },
  sasong: { namn: "Säsongsjobb", re: /säsong/i }
};

// När det brukar vara dags att börja, månad 1 till 12. Används för en
// påminnelse även innan siffrorna har hunnit öka.
const KALENDER = [
  { fran: 1, till: 3, sort: "sommar", text: "Sommarjobben börjar läggas ut. Bra tid för inlägg om sommarjobb, särskilt till unga och skolor." },
  { fran: 10, till: 11, sort: "jul", text: "Julhandeln börjar anställa. Bra tid för inlägg om extrajobb till jul." },
  { fran: 10, till: 12, sort: "vinter", text: "Vintersäsongen i fjällen anställer. Bra tid för inlägg om säsongsjobb i fjällen." }
];

function rakna(jobb) {
  const ut = { totalt: jobb.length };
  for (const k in SORTER) ut[k] = 0;
  for (const j of jobb) {
    const text = (j.titel || "") + " " + (j.beskrivning || "");
    for (const k in SORTER) if (SORTER[k].re.test(text)) ut[k]++;
  }
  return ut;
}

function laddaJobbJs(kod) {
  return new Function(kod + "; return { JOBB, UPPDATERAD };")();
}

function lasHistorik() {
  try { return JSON.parse(fs.readFileSync(FIL, "utf8")); } catch (e) { return { dagar: {} }; }
}

function snitt(dagar, slut, antal, sort) {
  const lista = Object.keys(dagar).filter(d => d <= slut).sort().slice(-antal);
  if (!lista.length) return null;
  return lista.reduce((s, d) => s + (dagar[d][sort] || 0), 0) / lista.length;
}

function dagMinus(dag, n) {
  const d = new Date(dag + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/* Ökar en sort? Jämför snittet senaste veckan med snittet för en vecka
   som slutade tre veckor tidigare. Minst 50 procent fler, och minst
   tio jobb, för att inte larma i onödan.                           */
function varningar(h, idag) {
  const ut = [];
  const manad = Number(idag.slice(5, 7));
  for (const k in SORTER) {
    const nu = snitt(h.dagar, idag, 7, k);
    const forr = snitt(h.dagar, dagMinus(idag, 21), 7, k);
    if (nu !== null && forr !== null && nu >= 10 && nu >= forr * 1.5) {
      ut.push({ sort: k, typ: "okar", text: SORTER[k].namn + " ökar: i snitt " + Math.round(nu)
        + " jobb om dagen nu, mot " + Math.round(forr) + " för tre veckor sedan. Dags för inlägg." });
    }
  }
  for (const p of KALENDER) {
    if (manad >= p.fran && manad <= p.till && !ut.some(v => v.sort === p.sort)) {
      ut.push({ sort: p.sort, typ: "kalender", text: p.text });
    }
  }
  return ut;
}

function spara(h) {
  const dagar = Object.keys(h.dagar).sort();
  for (const d of dagar.slice(0, Math.max(0, dagar.length - SPARA_DAGAR))) delete h.dagar[d];
  const idag = Object.keys(h.dagar).sort().pop();
  h.uppdaterad = new Date().toISOString();
  h.sorter = Object.fromEntries(Object.keys(SORTER).map(k => [k, SORTER[k].namn]));
  h.varningar = idag ? varningar(h, idag) : [];
  fs.writeFileSync(FIL, JSON.stringify(h, null, 1) + "\n");
  return h;
}

function idagFranData() {
  const d = laddaJobbJs(fs.readFileSync("docs/jobb.js", "utf8"));
  const dag = String(d.UPPDATERAD).slice(0, 10);
  return { dag, siffror: rakna(d.JOBB) };
}

function bakat(dagar) {
  const h = lasHistorik();
  const sedan = dagMinus(new Date().toISOString().slice(0, 10), dagar);
  const commits = execFileSync("git", ["log", "--since=" + sedan, "--format=%H %cs", "--", "docs/jobb.js"],
    { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const perDag = {};
  for (const rad of commits) { const [hash, dag] = rad.split(" "); if (!perDag[dag]) perDag[dag] = hash; }
  let n = 0;
  for (const dag of Object.keys(perDag).sort()) {
    if (h.dagar[dag]) continue;
    try {
      const kod = execFileSync("git", ["show", perDag[dag] + ":docs/jobb.js"], { encoding: "utf8", maxBuffer: 1 << 28 });
      h.dagar[dag] = rakna(laddaJobbJs(kod).JOBB);
      n++;
    } catch (e) { /* en trasig version hoppas över */ }
  }
  console.log("Fyllde på " + n + " dagar ur historiken.");
  return h;
}

const arg = process.argv.slice(2);
let h = arg[0] === "--bakat" ? bakat(Number(arg[1]) || 60) : lasHistorik();
const nu = idagFranData();
h.dagar = h.dagar || {};
h.dagar[nu.dag] = nu.siffror;
h = spara(h);

console.log("Säsong " + nu.dag + ": " + Object.keys(SORTER).map(k => SORTER[k].namn + " " + nu.siffror[k]).join(", "));
if (h.varningar.length) h.varningar.forEach(v => console.log("  " + v.text));
else console.log("  Inga varningar.");
