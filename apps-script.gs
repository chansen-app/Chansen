// Klistra in det här i Apps Script på ditt kalkylblad.
// Det tar emot annonser från formuläret i Chansen och lägger dem som rader.

var RUBRIKER = [
  "Tidpunkt","Företag","Organisationsnummer","Titel","Beskrivning","Ort",
  "Omfattning","Anställningsform","Kategori","Lön","Utdrag","Under 18",
  "Länk","Sista","Mejl","Kontakt","Godkänd"
];

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

    blad.appendRow([
      new Date(),
      p.foretag || "",
      p.orgnr || "",
      p.titel || "",
      p.beskrivning || "",
      p.ort || "",
      p.omfattning || "",
      p.form || "",
      p.kategori || "",
      p.lon || "",
      p.utdrag || "",
      p.minder || "",
      p.lank || "",
      p.sista || "",
      p.mejl || "",
      p.kontakt || "",
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
