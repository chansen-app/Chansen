// Klistra in det här i Apps Script på ditt kalkylblad.
// Det tar emot annonser från formuläret i Chansen och lägger dem som rader.

var RUBRIKER = [
  "Tidpunkt","Företag","Organisationsnummer","Titel","Beskrivning","Ort",
  "Omfattning","Anställningsform","Kategori","Annat","Lön","Utdrag","Under 18",
  "Kontakt för sökande","Länk","Sista","Mejl","Kontakt","Godkänd"
];

// Enkelt skydd mot skräp: max antal rader per dygn, och tak för textlängd.
var MAX_PER_DYGN = 40;
var MAX_TECKEN = 600;

function kortaAv(v) {
  return String(v == null ? "" : v).slice(0, MAX_TECKEN);
}

function forMangaIDag(blad) {
  var rader = blad.getLastRow();
  if (rader < 2) return false;
  var start = Math.max(2, rader - MAX_PER_DYGN);
  var tider = blad.getRange(start, 1, rader - start + 1, 1).getValues();
  var dygnSedan = new Date().getTime() - 24*60*60*1000;
  var antal = 0;
  for (var i = 0; i < tider.length; i++) {
    var t = tider[i][0];
    if (t instanceof Date && t.getTime() > dygnSedan) antal++;
  }
  return antal >= MAX_PER_DYGN;
}

function doPost(e) {
  var lås = LockService.getScriptLock();
  lås.waitLock(10000);
  try {
    var blad = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // skriv rubrikrad om bladet är tomt
    if (blad.getLastRow() === 0) {
      blad.appendRow(RUBRIKER);
      blad.getRange(1, 1, 1, RUBRIKER.length).setFontWeight("bold");
      blad.setFrozenRows(1);
    }

    var p = (e && e.parameter) ? e.parameter : {};

    // måste innehålla något vettigt
    if (!p.titel || !p.foretag) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, fel: "saknar uppgifter" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // för många inskick senaste dygnet, troligen skräp
    if (forMangaIDag(blad)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, fel: "för många inskick" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    blad.appendRow([
      new Date(),
      kortaAv(p.foretag),
      kortaAv(p.orgnr),
      kortaAv(p.titel),
      kortaAv(p.beskrivning),
      kortaAv(p.ort),
      kortaAv(p.omfattning),
      kortaAv(p.form),
      kortaAv(p.kategori),
      kortaAv(p.annat),
      kortaAv(p.lon),
      kortaAv(p.utdrag),
      kortaAv(p.minder),
      kortaAv(p.publik),
      kortaAv(p.lank),
      kortaAv(p.sista),
      kortaAv(p.mejl),
      kortaAv(p.kontakt),
      ""              // Godkänd, fylls i av dig
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (fel) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, fel: String(fel) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lås.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Chansen tar emot annonser här.");
}
