/*  Kolla kalkylarket
 *
 *  Kalkylarket Jobbansökningar Chansen får bara vara öppet på nätet med
 *  fliken Publicerat. De andra flikarna innehåller arbetsgivarnas mejl
 *  och telefonnummer.
 *
 *  Skriptet testar adresserna utifrån, som vem som helst på nätet. Är
 *  något annat än fliken Publicerat öppet, eller innehåller den mejl
 *  eller telefon, avslutas det med fel. Då misslyckas körningen på
 *  GitHub och du får ett mejl.
 *
 *  Kör med:   node .\kolla-kalkylark.js
 *
 *  Innehållet i arket skrivs aldrig ut, bara om det är öppet eller inte.
 */

const fs = require("fs");
const { hitta } = require("./personuppgifter");

// Kolumner som bara finns i de privata flikarna.
const PRIVATA_KOLUMNER = ["Mejl", "Kontakt", "Organisationsnummer", "Granskad av"];

function lasLank() {
  const html = fs.readFileSync("docs/index.html", "utf8");
  const m = /var BLAD_CSV = "([^"]+)"/.exec(html);
  if (!m) throw new Error("Hittar ingen länk till kalkylarket i docs/index.html.");
  return m[1];
}

async function hamta(url) {
  const svar = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000) });
  return { status: svar.status, text: svar.ok ? await svar.text() : "" };
}

function rubriker(text) {
  return (text.split(/\r?\n/)[0] || "").split(",").map(function (r) { return r.trim(); });
}

function harPrivatKolumn(text) {
  const r = rubriker(text);
  return PRIVATA_KOLUMNER.some(function (k) { return r.indexOf(k) > -1; });
}

async function main() {
  const publicerad = lasLank();
  const bas = publicerad.replace(/\/pub\?.*$/, "");
  const fel = [];

  // 1. Fliken Publicerat ska gå att läsa, men utan privata kolumner.
  const pub = await hamta(publicerad);
  if (pub.status !== 200) {
    console.log("Obs: fliken Publicerat går inte att läsa (" + pub.status + "). Då syns inga arbetsgivarannonser på sidan.");
  } else {
    if (harPrivatKolumn(pub.text)) fel.push("Fliken Publicerat har kolumner med kontaktuppgifter.");
    if (hitta(pub.text).some(function (f) { return f.typ !== "mejl" || !/chansen/i.test(f.varde); })) {
      fel.push("Fliken Publicerat innehåller mejl, telefonnummer eller personnummer.");
    }
  }

  // 2. Den första fliken, Blad1, ska vara stängd.
  const blad1 = await hamta(bas + "/pub?gid=0&single=true&output=csv");
  if (blad1.status === 200) fel.push("Blad1 är öppen på nätet.");

  // 3. Hela dokumentet får bara visa samma sak som fliken Publicerat.
  const hela = await hamta(bas + "/pub?output=csv");
  if (hela.status === 200 && harPrivatKolumn(hela.text)) fel.push("Hela kalkylarket är öppet på nätet.");

  if (fel.length) {
    console.log("");
    console.log("STOPP. Kalkylarket visar för mycket på nätet:");
    fel.forEach(function (f) { console.log("  " + f); });
    console.log("");
    console.log("Gör så här: öppna kalkylarket, Arkiv, Dela, Publicera på webben.");
    console.log("Se till att bara fliken Publicerat är vald under Publicerat innehåll");
    console.log("och inställningar.");
    process.exit(1);
  }
  console.log("Kalkylarket är okej. Bara fliken Publicerat är öppen, utan kontaktuppgifter.");
}

main().catch(function (e) {
  console.log("Kunde inte kolla kalkylarket: " + e.message);
  process.exit(1);
});
