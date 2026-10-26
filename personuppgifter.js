/*  Personuppgifter
 *
 *  Regler för att hitta och ta bort mejladresser, telefonnummer och
 *  personnummer. Används av alla hämtningar, så att kontaktuppgifter
 *  ur annonser aldrig sparas, och av kolla-personuppgifter.js, som
 *  stoppar en commit om något ändå finns kvar.
 */

const MEJL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;

// Ett nummer som börjar med 0 eller +landsnummer och har 9 till 13 siffror,
// med eller utan mellanslag och bindestreck.
const TELEFON = /(?<![\w+])(\+\d{2}[\s-]?|0)\d(?:[\s-]?\d){7,11}(?!\d)/g;

// Nummer utan inledande 0, som i Norge, fångas när ett ord som tlf står före.
const TELEFON_MED_ORD = /\b(tlf|telefon|tel|mobil|mob|ring|phone|call)\b\.?:?\s*(\+?\d(?:[\s-]?\d){7,11})(?!\d)/gi;

// ÅÅMMDD-NNNN eller ÅÅÅÅMMDDNNNN. Dag 61 till 91 är samordningsnummer.
// Organisationsnummer har 20 eller mer som månad och fångas därför inte.
const PERSONNUMMER = /(?<![\d-])(19|20)?(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]|6[1-9]|[78]\d|9[01])([-+]?)(\d{4})(?![\d-])/g;

const ERSATTNING = "(se annonsen)";

function luhn(siffror) {
  let summa = 0;
  for (let i = 0; i < siffror.length; i++) {
    let n = Number(siffror[i]) * (i % 2 === 0 ? 2 : 1);
    summa += n > 9 ? n - 9 : n;
  }
  return summa % 10 === 0;
}

// Länkar kan innehålla långa sifferföljder som inte är telefonnummer.
function utanLankar(text) {
  return text.replace(/https?:\/\/\S+/g, " ");
}

/* Hittar allt som ser ut som personuppgifter. Returnerar en lista med
   { typ, varde }. */
function hitta(text) {
  const t = utanLankar(String(text || ""));
  const fynd = [];
  (t.match(MEJL) || []).forEach(function (v) { fynd.push({ typ: "mejl", varde: v }); });
  (t.match(TELEFON) || []).forEach(function (v) { fynd.push({ typ: "telefon", varde: v.trim() }); });
  let m;
  TELEFON_MED_ORD.lastIndex = 0;
  while ((m = TELEFON_MED_ORD.exec(t))) fynd.push({ typ: "telefon", varde: m[2].trim() });
  PERSONNUMMER.lastIndex = 0;
  while ((m = PERSONNUMMER.exec(t))) {
    const tio = m[2] + m[3] + m[4] + m[6];
    // Tio siffror i rad utan år eller skiljetecken är oftast något annat.
    if (!m[1] && !m[5]) continue;
    if (luhn(tio)) fynd.push({ typ: "personnummer", varde: m[0] });
  }
  const sett = {};
  return fynd.filter(function (f) {
    const k = f.typ + f.varde;
    if (sett[k]) return false;
    sett[k] = true;
    return true;
  });
}

/* Byter ut mejl, telefonnummer och personnummer mot "(se annonsen)". */
function tvatta(text) {
  if (!text) return text;
  let t = String(text);
  hitta(t).forEach(function (f) { t = t.split(f.varde).join(ERSATTNING); });
  const dubbel = /\(se annonsen\)(\s*(och|eller|or|and|og|,|\/)?\s*\(se annonsen\))+/gi;
  return t.replace(dubbel, ERSATTNING);
}

/* Ser arbetsgivaren ut att vara en privatperson? Det gäller ofta den som
   anställer en egen personlig assistent, och då säger namnet i annonsen i
   praktiken att en namngiven person behöver assistans. Det är en uppgift
   om hälsa, som GDPR skyddar extra. Då visas "Privatperson" och ingen
   annonstext. Den som vill se allt klickar vidare till originalannonsen.

   - Namn som "Efternamn, Förnamn" är alltid en person. Så skriver
     Platsbanken privatpersoner.
   - kraverNummer: källan har alltid organisationsnummer för företag, så
     saknas det är det en person. Gäller Platsbanken.
   - Ett svenskt organisationsnummer där tredje och fjärde siffran är 01
     till 12 är ett personnummer, alltså en enskild firma. Den räknas som
     privat om namnet ser ut som en persons.                          */
function privatperson(namn, nummer, kraverNummer) {
  const n = String(namn || "").trim();
  const nr = String(nummer || "").replace(/\D/g, "");
  if (/^[^,]+,\s*[^,]+$/.test(n)) return true;
  if (kraverNummer && !nr) return true;
  if (nr.length === 10 || nr.length === 12) {
    const kort = nr.slice(-10);
    const manad = Number(kort.slice(2, 4));
    if (manad >= 1 && manad <= 12
      && /^[A-ZÅÄÖ][a-zåäöéü-]+( [A-ZÅÄÖ][a-zåäöéü-]+){1,2}$/.test(n)) return true;
  }
  return false;
}

module.exports = { hitta, tvatta, privatperson };
