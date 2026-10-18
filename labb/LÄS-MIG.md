# Labb

Här ligger saker som är under utveckling.

## Vad som syns och inte

GitHub Pages publicerar bara det som ligger i mappen `docs`. Det som ligger
här i `labb` syns därför inte på chansen.nu.

Men repot är offentligt på GitHub. Allt här går att läsa där. Lägg därför
aldrig något här som inte får synas, till exempel namn, kontaktuppgifter
eller nycklar. Sådant hör hemma i mappen `privat`, som aldrig följer med
till GitHub.

Skripten här skriver också filer till `docs/labb`, till exempel
`norge-jobb.js` och `uk-jobb.js`. De syns på chansen.nu, men sidorna är
dolda för sökmotorer.

## Vad som ligger här nu

`hamta-norge.js`, `hamta-uk.js` och `hamta-reed.js` hämtar jobb till
prototyperna för Norge och Storbritannien. De körs varje natt.

`hamta-utbildning.js` — hämtar annonser och sorterar dem efter vilken
utbildning de kräver. Motsatsen till Chansen: i stället för att sålla bort
krav letar den efter dem.

Kör den med:

    node .\labb\hamta-utbildning.js

Den skriver `labb/utbildningsjobb.json` och skriver ut en sammanfattning.
Ingenting av det hamnar på sidan.

## Vad vi vet om datan

- Fältet för utbildningskrav är bara ifyllt i 8 procent av annonserna,
  så det går inte att lita på. Samma problem som med erfarenhetsfältet.
- Yrkesområde, yrkesgrupp och yrke är ifyllda i 100 procent.
- Hälften av annonserna nämner ett utbildningsord i texten, oftast
  examen, legitimation, eftergymnasial eller civilingenjör.

Slutsatsen är att urvalet måste bygga på annonstexten, precis som i Chansen.
Skillnaden är att orden används för att välja in i stället för att välja bort.
