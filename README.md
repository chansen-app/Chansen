# Chansen

En jobbtjänst som visar jobb med låga ingångskrav, och som hjälper användaren hela vägen till en skickad ansökan.

## Vad problemet är

De flesta jobbsajter sorterar annonser efter datum. Det gör att den som söker sitt första jobb får bläddra genom hundratals annonser som kräver erfarenhet, utbildning eller körkort innan hen hittar en enda som går att söka.

Chansen sorterar i stället efter vad annonsen faktiskt kräver, och visar överst de jobb där kraven är lägst.

## Vem den är för

Alla som söker jobb med låga ingångskrav. Tjänsten är byggd med förstagångssökande i åtanke, men den är öppen för alla och stänger inte ute någon på grund av ålder, bakgrund eller något annat.

Tjänsten är gratis att använda och kommer alltid att vara det.

## Principer

Dessa gäller före alla funktioner. Går en funktion emot dem byggs den inte.

**Vi profilerar inte användare.** Tjänsten frågar aldrig om etnicitet, kön, hälsa, religion, brottshistorik eller något annat som skulle kunna användas för att sortera bort en människa. Det som sparas är praktiskt: ort, tillgänglighet och om användaren har körkort. Det sparas i användarens egen enhet, inte hos oss.

**Vi märker jobb, vi märker inte människor.** All information som visas handlar om vad annonsen kräver. Aldrig om vem användaren är eller vad vi tror om hens chanser.

**Vi gömmer inte jobb.** Ett jobb där något krav saknas läggs längre ned i listan med en tydlig rad om vad som saknas, så att användaren själv kan avgöra. Det enda som filtreras bort helt är arbetsuppgifter som enligt lag inte får utföras av den som är under 18.

**Vi lovar ingenting.** Tjänsten visar om användaren uppfyller kraven i annonsen. Den påstår aldrig att någon kommer att få jobbet, och den räknar inte ut sannolikheter.

**Vi tar inte betalt av jobbsökande.** Ingen avgift, ingen premiumnivå, ingen funktion som kräver betalning för att synas bättre.

## Så fungerar rangordningen

Varje annons får poäng utifrån vad den kräver:

Höjer poängen: erfarenhet krävs inte, ingen utbildning krävs, arbetsgivaren skriver att de utbildar på plats, deltid eller säsong, samma ort som användaren, arbetstider som matchar användarens tillgänglighet.

Sänker poängen eller utesluter: krav på körkort som användaren saknar, krav på examen eller legitimation, krav på flera års erfarenhet.

Poängen mäter hur många hinder som står mellan användaren och en ansökan. Den mäter inte personen.

## Registerutdrag

Vissa jobb kräver utdrag ur belastningsregistret, till exempel arbete med barn. Varje annons märks utifrån vad som faktiskt står i den: nämner den utdrag eller inte. Det finns ett filter för jobb där utdrag inte nämns.

Filtret lovar ingenting. En arbetsgivare kan begära utdrag även om annonsen inte säger det, och det skrivs ut i tjänsten så att ingen blir överraskad senare.

Tjänsten frågar aldrig användaren om hens bakgrund och lagrar ingenting om den. Filtret finns för att ingen ska behöva lägga tid på en ansökan som ändå stoppas, och det används utan att någon behöver berätta något.

## Data och licens

Jobbannonserna hämtas från Arbetsförmedlingens öppna API JobSearch, via JobTech Dev. Ett skript hämtar och rangordnar annonserna en gång per dygn.

**Källa:** Platsbanken, Arbetsförmedlingen.

**Licens för datan:** Creative Commons Erkännande-DelaLika, CC BY-SA. Villkoren
innebär att källan ska anges, och att den som bearbetar och sprider datan vidare
måste göra det under samma licens.

Chansen sorterar och rangordnar annonserna, vilket räknas som en bearbetning.
Filerna `docs/jobb.js` och `docs/jobb.json` delas därför under samma licens,
CC BY-SA. Se https://creativecommons.org/licenses/by-sa/4.0/deed.sv

Villkoren i sin helhet finns hos https://jobtechdev.se

**Licens för koden:** ingen licens är vald än. Det betyder att vanlig
upphovsrätt gäller och att koden inte får återanvändas utan tillstånd.
Väljs en licens senare påverkar det inte datan ovan, som styrs av
Arbetsförmedlingens villkor.

**Ansvar:** innehållet i varje annons ansvarar arbetsgivaren för. Chansen
skapar inga egna annonser och kontrollerar inte uppgifterna i dem, förutom
de annonser arbetsgivare skickat in direkt till tjänsten.

## Status

Under utveckling. Första versionen omfattar en ort.

## Kontakt

chansen.jobb@gmail.com
