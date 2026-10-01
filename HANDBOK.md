# Chansen, handbok

Allt om projektet samlat på ett ställe. Skriven 30 september 2026, när
sidan låg på version 124.

Den här filen finns för att ingenting ska gå förlorat om en konversation
tar slut, en dator går sönder eller någon annan behöver ta vid. Den som
läser den ska kunna fortsätta utan att fråga.

---

## 1. Vad Chansen är

En gratis webbsida som visar jobb med låga ingångskrav, på chansen.nu.

Det ligger omkring 40 000 jobbannonser i Platsbanken. En stor del kräver
flera års erfarenhet, utbildning eller yrkesbevis, även för arbeten man
lär sig på ett par veckor. Kraven står sällan i rubriken, utan längre ned
i annonsen. Den som söker sitt första jobb måste därför öppna varenda
annons för att se om den ens går att söka.

Nathalie kunde gå igenom femtio annonser och hitta två som gick att söka.
Det är den tiden som tar slut för folk, långt innan motivationen gör det.

Chansen läser alla annonser varje natt och sorterar bort dem med hårda
krav. Kvar blir omkring 1 400 jobb i över 220 kommuner.

**Öppnade för allmänheten:** 9 augusti 2026
**Drivs av:** Nathalie Andell, som privatperson, utan vinstsyfte
**Kostnad:** 169 kronor om året, för domänen

---

## 2. Regler som aldrig får brytas

Dessa gäller sidan, allt material och allt som sägs om Chansen.

**Lova aldrig jobb.** Sidan hittar annonser, den ger inga garantier. Säg
"jobb med låga ingångskrav" eller "jobb som går att söka", aldrig "jobb du
kan få".

**Påstå aldrig hur många som fått jobb.** Det mäts medvetet inte, eftersom
sidan saknar konton och spårning.

**Säg aldrig att Arbetsförmedlingen står bakom.** Jobben kommer från deras
öppna data, men sidan drivs av en privatperson. Använd aldrig deras
logotyp.

**Visa aldrig riktiga arbetsgivare i marknadsföring.** Använd påhittade
namn som "Exempel Livs AB", med riktiga orter.

**Säg bara "gratis"**, inte att det aldrig blir reklam eller konton.
Sådant kan ändras, och löften om framtiden ska undvikas.

**Visa aldrig jobb där lönen bara är provision.**

**Aldrig musik utan rättigheter i videor.** Lämna hellre videon utan ljud.

---

## 3. Så fungerar sorteringen

Varje natt hämtas alla annonser från Arbetsförmedlingens öppna API
JobSearch. Varje annons läses igenom och får poäng.

**Hinder drar ned poängen:** krav på utbildning, yrkesbevis, legitimation,
flera års erfarenhet, körkort.

**Tecken på att arbetsgivaren lär upp höjer poängen:** formuleringar som
"vi lär upp dig", "ingen erfarenhet krävs", "upplärning sker på plats".

**Vissa annonser sorteras bort direkt:** ren provisionslön, yrken som
alltid kräver legitimation.

**Under en viss poäng kommer jobbet inte med alls.** De med högst poäng
hamnar överst och märks "Bäst chans".

**Åldersfiltret** bygger på svensk arbetsmiljölagstiftning. Den som är
under 18 ser bara arbeten och arbetstider som är tillåtna enligt lag, och
under 16 gäller snävare regler. Skälet är att många unga inte själva vet
var gränserna går.

**Har en kommun få aktuella jobb** fylls listan på med resten av länet.
Den funktionen kom till efter kritik från användare i mindre orter.

---

## 4. Teknik

**Repo:** github.com/chansen-app/Chansen
**Publicering:** GitHub Pages från mappen `docs`, egen domän chansen.nu
**Byggt i:** HTML, CSS och JavaScript, utan ramverk
**Statistik:** Cloudflare Web Analytics och GoatCounter
**Kostnad:** noll kronor i månaden utöver domänen

### Filer i `docs`, alltså det som publiceras

| Fil | Vad den gör |
|---|---|
| `index.html` | Hela appen: kod, utseende och alla texter |
| `jobb.js` | Jobben, skrivs av nattkörningen |
| `egna-jobb.js` | Annonser arbetsgivare lämnat in, hanteras för hand |
| `sw.js` | Service worker, ser till att alla får senaste versionen |
| `sitemap.xml` | Adresser till Google, skrivs av nattkörningen |
| `jobb/*.html` | Ortssidor, en per kommun med minst fem jobb |
| `labb/norge.html` | Norsk prototyp, dold för sökmotorer |
| `labb/uk.html` | Engelsk prototyp, dold för sökmotorer |
| `labb/granska.html` | Chansen Admin, kräver inloggning |
| `labb/norge-jobb.js` | Norska jobben, skrivs av den norska körningen |

### Filer i roten

| Fil | Vad den gör |
|---|---|
| `hamta.js` | Nattkörningen: hämtar, sorterar, skriver ortssidor och sitemap |
| `labb/hamta-norge.js` | Samma för Norge, mot NAV |
| `labb/hamta-uk.js` | Samma för Storbritannien, mot Adzuna |
| `labb/hamta-utbildning.js` | Äldre experiment |

### Nattkörningar

| Tid (UTC) | Vad | Fil |
|---|---|---|
| 04:00 | Svenska jobben | `.github/workflows/uppdatera.yml` |
| 05:00 | Utbildningsjobb, labb | `utbildning.yml` |
| 06:00 | Norska jobben | `norge.yml` |
| 07:00 | Brittiska jobben | `uk.yml` |

Allt som ligger i mappen `labb` publiceras aldrig, eftersom GitHub Pages
bara tar mappen `docs`.

### Skydd i nattkörningen

Om den nya listan är mindre än 100 jobb, eller mindre än hälften av den
förra, avbryts körningen och den gamla listan behålls. Det kom till efter
den 21 september, då API:et inte svarade och hela listan skrevs över med
noll jobb.

---

## 5. Kommandon

### Lägga upp en ny version

```
git pull
move $HOME\Downloads\index.html docs\index.html -Force
git add .
git commit -m "Beskrivning utan a-ring och prickar"
git push
```

Skriv commit-texter utan å, ä och ö. De krånglar ibland i PowerShell och
kan kasta in dig i textredigeraren Vim.

### Om du hamnar i Vim

Tryck Escape, skriv `:q!` och tryck Enter. Fungerar det inte, stäng
fönstret. Ingenting går sönder.

### Om krockar uppstår

```
git pull --no-rebase -X ours --no-edit
git push
```

### Om PowerShell inte hittar git

```
$env:Path += ";C:\Program Files\Git\cmd"
```

### Byt redigerare en gång för alla

```
git config --global core.editor notepad
```

---

## 6. Testsviten

`testsvit.py` kör 19 tester mot en lokal kopia av sidan: filter, åldrar,
vyer, bakåtknapp, sparade jobb, CV, skydd mot trasiga jobb, felfångare,
larm, jobblänkar, borttagna jobb, mejlknappen och att inga ramar tillåts.

**Kör alltid hela sviten innan en ny version läggs upp.** Alla 19 ska vara
gröna.

---

## 7. Utseende

**Färger**

| Vad | Kod |
|---|---|
| Bakgrund | `#f5ead8` |
| Ljusare yta | `#ebddc5` |
| Text | `#201e1d` |
| Accent orange | `#c67139` |
| Knappar | `#ac5e2b` |
| Accent mörk | `#8c491a` |
| Accent djup | `#643312` |
| Ljus persika | `#fff2eb` |
| Ljusgrön | `#f0fae1`, text `#3d472b` |
| Brådskande | `#f7e3c0`, text `#6e4408` |
| Linjer | `#dcd3c4` |
| Dämpad text | `#645c50` |

Använd knappfärgen, inte accenten, när vit text ligger ovanpå.

**Typsnitt:** Caprasimo till rubriker och logotyp, Figtree till brödtext
och knappar. Båda gratis på Google Fonts.

**Nio av tio besökare är på mobil.** Allt ska byggas för mobil först.

---

## 8. Regler för tryckt material

En sak per affisch. Mycket luft, marginal minst 15 mm. Allt centrerat.

Rubriker i Caprasimo, i gemener, aldrig versaler, max två rader.
Brödtext i Figtree, max tre rader.

Enda tillåtna dekor är en tunn ram i accentfärg, 0,7 mm, rundade hörn.
Inga plustecken, vågor, gnistor, cirklar, foton eller mönster.

QR-koden minst 26 mm bred, på enfärgad botten, med ljus marginal runt om.
Måste gå att läsa i svartvit kopia.

Adressen skrivs alltid `chansen.nu`, med små bokstäver, utan https.

Skriv aldrig siffror som ändras, till exempel antalet jobb, på material
som ska stå framme länge. Skriv "nya jobb varje natt" i stället.

Nathalies skrivare saknar gult. Material som ska skrivas ut hemma måste
vara svartvitt eller gjort i en palett utan gult.

**Bordsställ** blir stadigast på papper runt 200 gram, men fungerar på
vanligt papper.

---

## 9. Mejllistan

**Tjänst:** Sender. Formulär: stats.sender.net/forms/e1w8Oq/view
**Avsändare:** nyhetsbrev@chansen.nu
**Grupp:** Jobbtips
**Bekräftelsesteg:** på

**DNS**, alla verifierade:
- SPF: `v=spf1 include:spf.improvmx.com include:sendersrv.com ~all`
- DKIM: `sender._domainkey` pekar på `dkim.sendersrv.com`
- DMARC: `v=DMARC1; p=none;`
- MX: mx1 och mx2 hos ImprovMX, vidarebefordrar till chansen.jobb@gmail.com

**Problem som lösts:** bekräftelsemejlen hamnade i skräpposten, bara tre
av tretton bekräftade. Sender flyttade kontot till en annan utskicksväg
den 30 september, och därefter kom mejlen fram. Supportkontakt: Lucas.

---

## 10. Annonser från arbetsgivare, och Chansen Admin

Arbetsgivare kan lägga upp jobb gratis via formuläret på sidan. Varje
annons granskas av en människa innan den publiceras.

### Vägen en annons tar

Formuläret skickar till ett Google Apps Script, som sparar annonsen i ett
kalkylark. Där får den ett nummer, CH-0001 och uppåt, och kontrolleras
automatiskt.

**Nekas direkt:** felaktigt organisationsnummer, ingen lön angiven,
orimlig lön, länk som saknas eller inte börjar med https, formuleringar
som tyder på provisionsjobb, eller saknade obligatoriska fält.

**Märks men nekas inte:** mejl från gratisdomän, att mejl och länk ligger
på olika domäner, kort beskrivning, bemanningsföretag, krav på utdrag ur
belastningsregistret.

Organisationsnumret kontrolleras med samma kontrollsiffra som
Bolagsverket använder, så påhittade nummer stoppas.

### Chansen Admin

Granskningssidan ligger på `chansen.nu/labb/granska.html`, är dold för
sökmotorer och kräver inloggning. Den går att lägga till på hemskärmen
och fungerar då som en app.

**Inloggning** med användarnamn och lösenord. Lösenord sparas aldrig i
klartext, bara som ett avtryck med salt. En inloggning gäller tolv
timmar.

**Konton hanteras i Apps Script:** funktionen `skapaKonto` lägger till
eller byter lösenord, `taBortKonto` tar bort, `visaKonton` listar dem.
Skriv namn och lösenord i funktionen, kör den, och ta bort lösenordet ur
koden efteråt.

**Vad man kan göra:** se allt arbetsgivaren fyllt i, se kontrollerna i
grönt, gult och rött, se en förhandsgranskning av hur annonsen kommer se
ut, ändra ett fält genom att klicka på det, godkänna, neka, mejla
arbetsgivaren med en av tre mallar, och ta bort en publicerad annons när
tjänsten är tillsatt.

**Översikten högst upp** visar hur många som kommit in, väntar, godkänts
och nekats, plus vad som oftast går fel. Det säger om formuläret behöver
ändras.

Allt loggas med tidpunkt och vem som gjorde det.

### Personuppgifter

Kontaktuppgifter till den som skickat in publiceras aldrig, bara det hen
valt ska synas i annonsen. Nekade annonser och sådana vars sista
ansökningsdag passerat raderas automatiskt efter sex månader, genom ett
skript som körs varje natt klockan tre.

Information om detta står i formuläret och på Om-sidan. Se även
`REGISTERFORTECKNING.md`.

### Att lägga in en annons för hand

Går fortfarande, i `docs/egna-jobb.js`. Fältet `id` ger annonsen en egen
adress, till exempel `chansen.nu/#jobb-hundskotare-hudiksvall`. Fältet
`ansok` kan vara en mejladress, och då byter knappen text till "Ansök via
mejl". Annonser försvinner av sig själva efter sista ansökningsdag.

**Kontrollera alltid** organisationsnumret mot allabolag eller
Bolagsverket, att företaget finns på riktigt, och att lönen är angiven
eller att de följer kollektivavtal.

**Första annonsen:** Hudiksvalls Hundcenter, hundskötare, inlämnad av Li
Sandberg den 27 september.

## 11. Prototyper i andra länder

Allt ligger i mappen `labb` och publiceras aldrig, utom den norska sidan
som ligger i `docs/labb` och är dold för sökmotorer.

### Norge

**Data:** NAV:s öppna flöde, pam-stilling-feed.nav.no. Nyckeln hämtas
automatiskt, men en egen kan begäras från nav.team.arbeidsplassen@nav.no.

**Villkor:** bara aktiva annonser får sparas, och kontaktuppgifter sparas
aldrig.

**Sorteringen** skiljer på krav och önskemål. "Krever erfaring" sorterar
bort annonsen, medan "erfaring er ønskelig, men ikke et krav" bara ger ett
litet avdrag. Nynorska former måste finnas med, annars slipper till
exempel en lärartjänst igenom eftersom den stavas "lærar".

**Åldersreglerna** följer arbeidsmiljøloven kapitel 11 och skiljer sig
från de svenska. Nattförbud från 21 i stället för 22, och gränsen hänger
på skolplikt snarare än ålder. Är det oklart markeras jobbet som 18 år.

**Sidan:** chansen.nu/labb/norge.html. Den har ingen service worker och
laddar datan med en tidsstämpel, så att ingen kan fastna på en gammal
version. Hjälpsidan innehåller bara fliken om att söka jobb, eftersom de
andra handlar om svensk lag. Mejllistan och arbetsgivarformuläret är
avstängda.

**Kvar att göra:** hela sidans text är fortfarande på svenska.

### Storbritannien

**Data:** Adzunas API. Nyckel registreras gratis på developer.adzuna.com
och ligger som Secrets på GitHub med namnen `ADZUNA_ID` och `ADZUNA_KEY`.
Gratisnivån tål omkring 250 anrop om dagen, och körningen gör runt 28.

**Metoden är omvänd.** Adzuna ger bara de första 500 tecknen av annonsen,
och kraven står längre ned. Därför söker vi i stället efter annonser som
själva anger att erfarenhet inte krävs, och kontrollerar sedan i rubrik
och utdrag att det verkligen står så. Adzunas frassökning är inte exakt.

**Sorteras bort:** säljjobb i alla former, eftersom lönen inte går att
kontrollera. Och "placement programmes", alltså kurser som säljs som jobb.

**Alla brittiska jobb markeras som 18 år.** Reglerna för yngre sätts av
varje kommun och kräver ofta arbetstillstånd från skolan.

### Utbildningsjobb, det äldsta experimentet

Ligger i `labb/hamta-utbildning.js` med egen nattkörning klockan 05.
Tanken var att fånga jobb som kräver utbildning, alltså motsatsen till
Chansen, för att se hur stor skillnaden faktiskt är. Resultatet ligger i
`labb/utbildningsjobb.json` och används inte till något i dag, men datan
är användbar om man vill visa hur liten andel av arbetsmarknaden som är
öppen utan erfarenhet.

### Danmark

Ingen öppen data. Jobnet drivs av Styrelsen for Arbejdsmarked og
Rekruttering, och man måste ansöka om att bli användare. Kontakt:
spoc@star.dk. Nathalies morbror i Danmark hjälper till med språket.

Jobindex blockerar automatisk hämtning i sin robots-fil. Job-zonen
blockerar inte tekniskt, men datan är ändå deras och kräver tillstånd.

---

## 12. Vad som fungerat för spridningen

**Det som gett mest:** Facebookgrupper, ortssidorna som hittas via Google,
och personliga kontakter.

**Det som inte gett något:** kalla mejl till studie- och yrkesvägledare,
och samtal till växlar där ingen svarar.

**Det som fungerar bäst av allt:** att Nathalie själv pratar med människor,
i telefon eller på plats. Inte mejl.

**Viktig insikt:** den som sagt ja en gång säger nästan alltid ja igen. En
främling säger nästan alltid nej.

### Kontakter

**Göteborgs Stads vägledningscentrum** har granskat sidan och kommit fram
till att den kan användas som verktyg för elever.
- Meja Stridsberg, SYV på Burgården, vill ha material och ett samtal
- Elisabeth Lundquist, processledare, tipsar redan ungdomar om sidan

**Anna Petersson** på Arbetsmarknad och vuxenutbildning kan inte
rekommendera externa tjänster, men tipsade om Framtidshubbarna, som drivs
av Göteborgs Stadsmission tillsammans med staden.

**KRIS Göteborg** har tagit emot material.

**Podden SYV står vasintesyo**, med Lasse Persson. Avsnittet släpps den 15
november 2026.

**Maria Dalhage**, produktägare för öppna data på Arbetsförmedlingen, är
positiv och har erbjudit fortsatt kontakt.

---

## 13. Siffror, per 30 september 2026

| Vad | Siffra |
|---|---|
| Jobb efter sortering | omkring 1 400 |
| Kommuner | 290 |
| Ortssidor | 73 |
| Användningar sedan 9 augusti | omkring 4 000 |
| Klickar vidare till en riktig annons | en av tre |
| På mobil | nio av tio |
| Visningar på Facebook | 120 000 |
| Versioner | över hundra |

Siffrorna kommer från trafikstatistiken. Det går inte att säga hur många
som fått anställning, eftersom sidan saknar konton och inte mäter något om
enskilda personer. Det är ett medvetet val.

---

## 14. Om AI

Koden är skriven med AI som verktyg. Idén, funktionerna, reglerna,
designen och spridningen är Nathalies.

**Säg det rakt ut.** Att vara öppen med det gör frågan ofarlig, och ingen
kan avslöja något som redan sagts.

**Gränsen går** vid att kunna beskriva vad man gjort, och vid att ansvaret,
utvecklingen och idéerna ligger hos människan. Att inte kunna förklara
varje kodrad är inte samma sak.

**Jämförelsen som fungerar:** en grundare som anlitar en programmerare har
fortfarande byggt sitt företag. Säg "anlita", inte "anställa".

---

## 15. Arbetssätt som fungerat

**Kör alltid testsviten innan något läggs upp.**

**Testa mot riktig data, inte gissningar.** Det norska ordfiltret blev bra
först när jag räknade fram de vanligaste formuleringarna ur riktiga
annonser i stället för att gissa.

**Spara skälen.** Varje jobb i prototyperna sparar varför det kom med.
Det gör att filtret går att rätta utan att kunna språket flytande.

**Ändra en sak i taget och titta på resultatet.** Nästan varje förbättring
i det här projektet har kommit av att någon sagt att något ser konstigt ut.

**Lyssna på användarna.** Filtret för bemanningsföretag, länsutfyllnaden,
de tydligare frågorna och knappen "Ansök via mejl" kom alla från
kommentarer.

---

## 16. Framtidsplaner

Det här är riktningen, inte löften. Ingenting av det ska sägas till
utomstående som om det vore bestämt.

### Det som är bestämt

**Chansen ska vara gratis för alla som söker jobb.** Det står fast oavsett
vad som händer med finansieringen.

**Ingen ska kunna betala för att synas högre upp.** Ordningen styrs bara
av hur få hinder annonsen har. Det är hela grunden för att sidan går att
lita på, och det är därför ett företag är en svår fråga: betalda annonser
skulle påverka vilka jobb som kommer in.

**Sidan ska fortsätta fungera utan konton och utan spårning.**

### Nära i tiden

**Podden släpps 15 november.** Det är dagen att höra av sig till alla på
en gång: studie- och yrkesvägledarna, Framtidshubbarna, Maria på
Arbetsförmedlingen och grupperna.

**Mötet med Meja** på Burgården, som vill veta mer och dela ut kort.

**Fler arbetsgivarannonser.** Den första kom in i september. Varje ny
annons är ett bevis på att tjänsten fungerar åt två håll.

**Danmark**, om svaret från STAR blir positivt.

### Längre fram, oklart

**Ett sätt att mäta om lösningen hjälper.** I dag går det inte att säga hur
många som fått jobb, och det är ett medvetet val. Frågan är om det går att
mäta utan att spåra någon. Inget är löst, och ingenting ska lovas.

**Norden och Storbritannien på riktigt.** Prototyperna visar att det går.
Det som saknas är översättning, lokala lagregler och någon som kan
språket.

**Eventuellt företag.** Osäkert och inte genomtänkt. Skälet till tveksamhet
är principiellt, inte praktiskt, se ovan om betalda annonser.

**Samarbeten med konton som når rätt människor.** En lärarstudent med
studentkonto har erbjudit sig att hjälpa till. Ersättning på ett par tusen
i månaden är inte hållbart i dag, eftersom Chansen inte drar in något och
allt skulle betalas ur egen ficka.

### Vad Sami sagt

Mentorn Sami vill se att man kan sätta ett mål och driva mot det, inte
bara att siffrorna blir stora. Det som imponerar är att kunna säga: jag
bestämde X, gjorde Y, och det gav Z, och det här fungerade inte så nu
provar jag något annat.

Kontakta honom när siffrorna är i mål, inte innan.

---

## 17. Pending

- Ortssidor på norska och engelska saknas
- Arbetsgivarformuläret finns bara på svenska
- Personuppgiftsbiträdesavtal med Google saknas, se registerförteckningen
- Hela den norska och brittiska sidans text är på svenska
- Arbetsgivarformuläret finns bara i den svenska versionen
- Danmark: väntar på svar om tillgång till Jobnet
- Cloudflare: kolla att hoppen i foten försvunnit efter version 119
- Google Search Console: kontrollera att sitemap lästs in
