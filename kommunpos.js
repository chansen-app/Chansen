/*  Kommunernas läge
 *
 *  Gör filen docs/kommunpos.json med en ungefärlig mittpunkt för varje
 *  kommun. Chansen använder den för att visa ungefär hur långt bort ett
 *  jobb ligger, och för att sortera jobben i länet efter avstånd.
 *
 *  Mittpunkten räknas fram ur var jobben i kommunen ligger, som median
 *  av koordinaterna i Platsbankens annonser. Den är alltså ungefärlig,
 *  men räcker för att säga "ca 40 km bort". Inga enskilda adresser
 *  sparas, bara en punkt per kommun.
 *
 *  Kommuner ändrar inte läge, så filen behöver bara göras om ibland,
 *  till exempel en gång om året.
 *
 *  Kör med:   node .\kommunpos.js
 */

const fs = require("fs");

const TAXONOMI = "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=municipality";
const SOK = "https://jobsearch.api.jobtechdev.se/search?limit=100&municipality=";

// Bara punkter inom Sveriges ungefärliga gränser räknas.
function iSverige(lat, lon) {
  return lat > 55 && lat < 69.2 && lon > 10.5 && lon < 24.3;
}

function median(lista) {
  const s = lista.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function hamtaJson(url) {
  for (let forsok = 0; forsok < 3; forsok++) {
    try {
      const svar = await fetch(url);
      if (svar.ok) return await svar.json();
    } catch (e) { /* försök igen */ }
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}

async function main() {
  const kommuner = await hamtaJson(TAXONOMI);
  if (!kommuner || !kommuner.length) { console.error("Fick ingen lista över kommuner."); process.exit(1); }

  const ut = {};
  let utan = [];
  for (const k of kommuner) {
    const namn = k["taxonomy/preferred-label"];
    const data = await hamtaJson(SOK + encodeURIComponent(k["taxonomy/id"]));
    const lat = [], lon = [];
    for (const a of (data && data.hits) || []) {
      const c = a.workplace_address && a.workplace_address.coordinates;
      if (!c || c.length !== 2 || c[0] == null || c[1] == null) continue;
      if (a.workplace_address.municipality !== namn) continue;
      if (!iSverige(c[1], c[0])) continue;
      lon.push(c[0]); lat.push(c[1]);
    }
    if (lat.length) ut[namn] = [Math.round(median(lat) * 100) / 100, Math.round(median(lon) * 100) / 100];
    else utan.push(namn);
  }

  const sorterad = {};
  for (const n of Object.keys(ut).sort((a, b) => a.localeCompare(b, "sv"))) sorterad[n] = ut[n];
  fs.writeFileSync("docs/kommunpos.json", JSON.stringify(sorterad, null, 1) + "\n");
  console.log("Kommuner med läge: " + Object.keys(sorterad).length + " av " + kommuner.length);
  if (utan.length) console.log("Utan läge, de får inget avstånd: " + utan.join(", "));
}

main();
