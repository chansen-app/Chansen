/*  Skicka nyhetsbrev
 *
 *  Lägger upp nyhetsbrev.html i Sender som ett utkast till gruppen
 *  Jobbtips. Ingenting skickas till prenumeranterna. Du öppnar utkastet
 *  i Sender, tittar igenom det och trycker på skicka själv.
 *
 *  Körs av .github/workflows/nyhetsbrev.yml varje tisdag klockan 15,
 *  efter nyhetsbrev.js.
 *
 *  Nyckeln till Sender ligger i en secret på GitHub som heter
 *  SENDER_API_TOKEN. Den skapas på app.sender.net/settings/tokens.
 */

const fs = require("fs");

const API = "https://api.sender.net/v2";
const GRUPP = "Jobbtips";
const AVSANDARE = "Chansen";
const SVARSADRESS = "nyhetsbrev@chansen.nu";

const nyckel = process.env.SENDER_API_TOKEN;

function svenskDatum(d) {
  const t = new Date(d);
  const m = ["januari","februari","mars","april","maj","juni",
             "juli","augusti","september","oktober","november","december"];
  return t.getDate() + " " + m[t.getMonth()];
}

async function anrop(metod, sokvag, kropp) {
  const svar = await fetch(API + sokvag, {
    method: metod,
    headers: {
      "Authorization": "Bearer " + nyckel,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: kropp ? JSON.stringify(kropp) : undefined
  });
  const text = await svar.text();
  // Bara felkoden skrivs ut. Svaret från Sender kan innehålla uppgifter
  // från kontot, och loggarna från GitHub är offentliga.
  if (!svar.ok) {
    throw new Error("Sender svarade med felkod " + svar.status + " på " + sokvag + ".");
  }
  return text ? JSON.parse(text) : {};
}

async function hittaGrupp() {
  let sida = 1;
  for (;;) {
    const svar = await anrop("GET", "/groups?page=" + sida);
    const grupp = (svar.data || []).find(function (g) { return g.title === GRUPP; });
    if (grupp) return grupp.id;
    if (!svar.meta || sida >= svar.meta.last_page) return null;
    sida++;
  }
}

async function main() {
  if (!nyckel) {
    console.log("Nyckeln SENDER_API_TOKEN saknas. Lägg in den som en secret på GitHub.");
    process.exit(1);
  }
  if (!fs.existsSync("nyhetsbrev.html")) {
    console.log("Inget nyhetsbrev den här veckan, inga jobb uppfyllde villkoren.");
    return;
  }

  const html = fs.readFileSync("nyhetsbrev.html", "utf8");
  const grupp = await hittaGrupp();
  if (!grupp) {
    console.log("Hittar ingen grupp som heter " + GRUPP + " i Sender.");
    process.exit(1);
  }

  const idag = svenskDatum(new Date());
  const svar = await anrop("POST", "/campaigns", {
    title: "Nyhetsbrev " + idag,
    subject: "Nya jobb att söka den här veckan",
    preheader: "Jobb från de senaste dagarna där erfarenhet inte krävs.",
    from: AVSANDARE,
    reply_to: SVARSADRESS,
    content_type: "html",
    content: html,
    groups: [grupp]
  });

  const status = svar.data ? svar.data.status : svar.status;
  console.log("Utkastet ligger i Sender, med status " + status + ".");
  console.log("Öppna Sender, titta igenom det och tryck på skicka.");
}

main().catch(function (fel) {
  console.log(fel.message);
  process.exit(1);
});
