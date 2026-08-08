# Koppla formuläret till ett kalkylblad

En gång, ungefär tio minuter. Sen är ditt arbete per jobb att skriva **ja** i en ruta.

Så här blir flödet när det är klart:

1. Arbetsgivaren fyller i formuläret i appen och trycker skicka
2. Raden dyker upp i ditt kalkylblad
3. Du granskar enligt `granska-arbetsgivare.md`
4. Du skriver **ja** i kolumnen Godkänd
5. Jobbet syns i appen inom några minuter

Ingen kod, ingen push, inget mejl att öppna.

---

## 1. Skapa kalkylbladet

Gå till sheets.google.com och skapa ett nytt blad. Döp det till **Chansen annonser**.

Du behöver inte skriva några rubriker, skriptet gör det första gången någon skickar in.

---

## 2. Lägg in skriptet

I bladet: **Tillägg**, sedan **Apps Script**.

Radera det som står i rutan. Öppna filen `apps-script.gs` som jag skickade, kopiera allt, klistra in.

Tryck på spara-ikonen.

---

## 3. Publicera skriptet

Tryck **Distribuera** uppe till höger, sedan **Ny distribution**.

- Typ: tryck på kugghjulet och välj **Webbapp**
- Beskrivning: valfritt
- Kör som: **Jag**
- Vem har åtkomst: **Alla**

Tryck **Distribuera**. Första gången måste du godkänna behörigheter. Google varnar att skriptet är overifierat, vilket det är, det är ditt eget. Tryck Avancerat och sedan gå vidare.

Du får en adress som slutar på `/exec`. Kopiera den.

**Att veta:** att åtkomsten är satt till Alla betyder att vem som helst kan skicka in en rad. Det är därför inget publiceras utan att du skriver ja. Skräp hamnar i bladet och syns bara för dig.

---

## 4. Publicera bladet som CSV

Tillbaka i kalkylbladet: **Arkiv**, sedan **Dela**, sedan **Publicera på webben**.

- Välj bladet, inte hela dokumentet
- Format: **Kommaseparerade värden (.csv)**
- Tryck Publicera

Kopiera adressen. Den slutar på `output=csv`.

**Viktigt:** publicerade blad är läsbara för den som har adressen. Mejl och kontaktuppgifter till arbetsgivaren ligger i bladet. Appen visar dem inte, men de finns i filen. Vill du vara noggrann, flytta de två kolumnerna till ett separat blad när du granskat.

---

## 5. Klistra in båda adresserna i appen

Öppna `docs/index.html` och sök efter de här två raderna, de ligger nära varandra:

```js
var BLAD_CSV = "";
var SKICKA_URL = "";
```

Fyll i:

```js
var BLAD_CSV = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";
var SKICKA_URL = "https://script.google.com/macros/s/.../exec";
```

Spara, sedan:

```
git add .
git commit -m "Kopplade formuläret till bladet"
git push
```

---

## 6. Testa hela vägen

1. Öppna appen, gå till Hjälp och fliken Arbetsgivare
2. Fyll i formuläret med påhittade uppgifter, men ett riktigt organisationsnummer och en https-länk
3. Tryck skicka. Du ska få tacksidan
4. Kolla att raden dök upp i bladet
5. Skriv **ja** i kolumnen Godkänd
6. Ladda om appen med ett nytt nummer på slutet, till exempel `?v=999`
7. Jobbet ska ligga överst i listan, märkt "lagd upp av arbetsgivaren"
8. Radera **ja** igen, ladda om, och kolla att det försvann

Gå igenom alla åtta stegen. Det är enda sättet att veta att kedjan håller.

---

## Om något inte fungerar

**Tacksidan kom men ingen rad i bladet.** Skriptet är inte publicerat rätt. Gör om steg 3, och kolla att åtkomsten är satt till Alla.

**Mejlen öppnas i stället för tacksidan.** Appen kunde inte nå skriptet. Kolla att `SKICKA_URL` slutar på `/exec` och att du klistrat in den mellan citattecknen.

**Raden är godkänd men jobbet syns inte.** Kolla att `BLAD_CSV` slutar på `output=csv`, att det står **ja** med små bokstäver, och att länken i annonsen börjar med `https://`. Appen hoppar över rader med annat än https med flit.

**Ingenting alls händer.** Appen fungerar precis som förut om båda adresserna är tomma eller trasiga. Ingen användare märker något, så du kan felsöka i lugn och ro.
