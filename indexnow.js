/*  IndexNow
 *
 *  Berättar för Bing, och de sökmotorer som delar med sig till varandra
 *  via IndexNow, vilka sidor som finns på chansen.nu. Körs efter varje
 *  nattkörning, så att nya sidor om orter, extrajobb och sommarjobb
 *  hittas fortare. Google använder inte IndexNow.
 *
 *  Bara adresserna i docs/sitemap.xml skickas. Inga personuppgifter,
 *  inga jobbannonser och inget om besökarna.
 *
 *  Nyckeln ligger öppet i docs/a41cea676761fc06027499ef1a2b86ad.txt.
 *  Den ska synas, eftersom det är så sökmotorn ser att sidan är vår.
 *  Den är ingen hemlighet och ger ingen åtkomst till något.
 */

const fs = require("fs");

const VARD = "chansen.nu";
const NYCKEL = "a41cea676761fc06027499ef1a2b86ad";

const karta = fs.readFileSync("docs/sitemap.xml", "utf8");
const adresser = [...karta.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m => m[1].trim())
  .filter(u => u.startsWith("https://" + VARD + "/"));

if (!adresser.length) {
  console.log("Inga adresser i sitemap, skickar inget.");
  process.exit(0);
}

(async () => {
  const svar = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: VARD,
      key: NYCKEL,
      keyLocation: "https://" + VARD + "/" + NYCKEL + ".txt",
      urlList: adresser.slice(0, 10000)
    })
  });
  // 200 och 202 betyder att listan togs emot.
  console.log("IndexNow svarade " + svar.status + " på " + adresser.length + " adresser.");
  if (svar.status >= 400) process.exit(1);
})();
