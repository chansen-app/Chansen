/*  Skolor per kommun
 *
 *  Gör filen docs/skolor.json med namnen på alla skolor som är i gång, per
 *  kommun, från Skolverkets öppna skolenhetsregister. Bara skolor med
 *  högstadium, gymnasium eller vuxenutbildning tas med.
 *
 *  Bara skolans namn och kommun sparas. Inga rektorer, mejladresser
 *  eller telefonnummer.
 *
 *  Kör med:   node .\skolor.js
 */

const fs = require("fs");
const path = require("path");

const LISTA = "https://api.skolverket.se/skolenhetsregistret/v2/school-units?status=AKTIV";
const EN = "https://api.skolverket.se/skolenhetsregistret/v2/school-units/";
const KOMMUNER = "https://taxonomy.api.jobtechdev.se/v1/taxonomy/specific/concepts/municipality";

async function hamtaJson(url) {
  for (let forsok = 0; forsok < 4; forsok++) {
    try {
      const svar = await fetch(url, { headers: { Accept: "application/json" } });
      if (svar.ok) return await svar.json();
    } catch (e) { /* försök igen */ }
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

// "Sannarpsgymnasiet 3" och "Furulundsskolan 7-9" blir "Sannarpsgymnasiet"
// och "Furulundsskolan", så att varje skola bara står en gång.
function snyggNamn(n) {
  let t = String(n).replace(/\s+/g, " ").trim();
  for (let i = 0; i < 2; i++) t = t.replace(/\s+(F-\d+|\d+-\d+|\d+|[IVX]+)$/, "").trim();
  return t;
}

function passar(a) {
  const typer = a.schoolTypes || [];
  const p = a.schoolTypeProperties || {};
  if (typer.includes("GY") || typer.includes("GYS") || typer.includes("VUX")) return true;
  for (const t of ["gr", "grs"]) {
    const ar = (p[t] && p[t].grades) || [];
    if (ar.some(g => Number(g) >= 7)) return true;
  }
  return false;
}

async function main() {
  const kommuner = await hamtaJson(KOMMUNER);
  const kodTillNamn = {};
  for (const k of kommuner) kodTillNamn[k["taxonomy/lau-2-code-2015"]] = k["taxonomy/preferred-label"];

  const lista = (await hamtaJson(LISTA)).data.attributes;
  console.log("Skolor i gång:", lista.length);

  const ut = {};
  let klara = 0, med = 0;
  const ko = lista.slice();
  async function arbetare() {
    while (ko.length) {
      const s = ko.shift();
      const j = await hamtaJson(EN + s.schoolUnitCode);
      klara++;
      if (klara % 500 === 0) console.log(klara, "av", lista.length);
      if (!j) continue;
      const a = j.data.attributes;
      const kommun = kodTillNamn[a.municipalityCode];
      if (!kommun || !passar(a)) continue;
      const namn = snyggNamn(a.displayName || s.name);
      (ut[kommun] = ut[kommun] || new Set()).add(namn);
      med++;
    }
  }
  await Promise.all(Array.from({ length: 6 }, arbetare));

  const sorterat = {};
  for (const k of Object.keys(ut).sort((a, b) => a.localeCompare(b, "sv")))
    sorterat[k] = [...ut[k]].sort((a, b) => a.localeCompare(b, "sv"));
  fs.writeFileSync(path.join(__dirname, "docs", "skolor.json"), JSON.stringify(sorterat));
  console.log("Klar:", med, "skolor i", Object.keys(sorterat).length, "kommuner");
}

main();
