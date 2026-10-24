---
description: Skriv ett inlägg till en grupp, med ortens egna siffror
argument-hint: gruppen eller orten, till exempel "Jobb i Borås"
---

Nathalie ska posta om Chansen i den här gruppen eller orten:

$ARGUMENTS

1. Ta reda på vilken ort det gäller. Är det oklart, fråga.
2. Läs siffrorna ur docs/jobb.js med node, för den orten:
   - hur många jobb som finns just nu
   - hur många där erfarenhet inte krävs (erfarenhetKravs är false)
   - hur många på deltid
   - hur många som går att söka för den som är under 18 (minderarigOk)
   - de tre vanligaste branscherna, utan "Övrigt"
   - hur många som kom de senaste sju dagarna
   Skriv ut siffrorna och datumet jobben hämtades (UPPDATERAD), så att Nathalie kan kontrollera dem.
3. Har orten färre än fem jobb, säg det och föreslå att i stället skriva om hela länet.

Skriv sedan ett inlägg på svenska för gruppen:

- Börja med det lokala: orten och en riktig siffra.
- Kort. Fyra till sex rader. Lätt att läsa på mobilen.
- Nämn aldrig arbetsgivare, jobbtitlar från riktiga annonser eller text ur annonser.
- Lova aldrig jobb. Säg "jobb som går att söka" eller "där erfarenhet inte krävs".
- Inga tankstreck, inga modeord, inget skryt.
- Skriv bara "gratis". Aldrig "inget konto", "ingen inloggning", "anonymt" eller "ingen reklam".
- Avsluta med chansen.nu på en egen rad. Inga långa länkar.
- Högst tre hashtaggar, till exempel #jobb och orten utan å, ä och ö.

Ge också en kortare version på en rad, för en story eller en bild.

Märk gärna länken med gruppen i statistiken. Föreslå då en kodad länk med `node .\privat\ny-lank.js Ort kodord`, och påminn om att lägga länken bakom en text, så att den inte syns.
