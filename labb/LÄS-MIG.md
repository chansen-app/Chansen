# Labb

Här ligger saker som är under utveckling och **inte** ska publiceras.

## Varför den här mappen är säker

GitHub Pages publicerar bara det som ligger i mappen `docs`. Allt som ligger
här i `labb` finns på din dator och i din git-historik, men syns inte på
chansen.nu och kan inte nås av besökare.

Lägg alltså aldrig något du vill publicera här, och lägg aldrig något
halvfärdigt i `docs`.

## Vad som ligger här nu

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
