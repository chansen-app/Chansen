# Registerförteckning, Chansen

Enligt artikel 30 i dataskyddsförordningen. Upprättad 1 oktober 2026,
uppdaterad 25 oktober 2026.

Den här filen beskriver vilka personuppgifter Chansen behandlar, varför,
hur länge och var de finns. Den ska kunna visas upp om någon frågar, och
den ska uppdateras när något ändras.

---

## Personuppgiftsansvarig

Nathalie Andell, privatperson.
chansen.jobb@gmail.com

Chansen drivs utan vinstsyfte och har inga anställda.

---

## 1. Prenumeranter på mejllistan

**Vad som behandlas:** mejladress. Dessutom tidpunkt och IP-adress vid
anmälan, som registreras av utskickstjänsten.

**Varför:** för att kunna skicka mejl om nya jobb på Chansen, och för att
kunna visa att personen själv anmält sig.

**Rättslig grund:** samtycke, artikel 6.1 a. Samtycket lämnas genom att
personen fyller i sin adress och sedan bekräftar via ett mejl.

**Varifrån:** personen själv, via formuläret på chansen.nu.

**Var uppgifterna finns:** hos Sender.net, som är personuppgiftsbiträde.
Tjänsten drivs inom EU.

**Hur länge:** tills personen avregistrerar sig, vilket går att göra med
ett klick i varje utskick. Adressen raderas då.

**Delas med:** ingen utöver Sender.

**Hur utskicken görs:** varje tisdag gör ett skript på GitHub ett
utkast till nyhetsbrev och lägger upp det i Sender. Skriptet hämtar
aldrig prenumeranternas adresser, det anger bara vilken grupp utkastet
ska till. Nathalie skickar sedan utkastet själv.

**Åldersgräns:** minst 13 år för att anmäla sig själv.

---

## 2. Arbetsgivare som skickar in en annons

**Vad som behandlas:** kontaktpersonens namn, mejladress och
telefonnummer. Dessutom uppgifterna om jobbet, som inte är
personuppgifter.

**Varför:** för att kunna granska annonsen och kontakta den som skickat
in den.

**Rättslig grund:** berättigat intresse, artikel 6.1 f. Intresset är att
kunna hantera en annons som personen själv skickat in, och behandlingen
är begränsad till vad det kräver.

**Varifrån:** personen själv, via formuläret på chansen.nu.

**Var uppgifterna finns:** i ett kalkylark hos Google, kopplat till
chansen.jobb@gmail.com. Åtkomst sker via Chansen Admin, som kräver
användarnamn och lösenord.

**Hur länge:** nekade och borttagna annonser raderas samma natt, både
annonsen och kontaktpersonens uppgifter. Publicerade annonser raderas
natten efter sista ansökningsdagen. Annonser utan sista ansökningsdag
raderas 90 dagar efter att de godkändes. Raderingen sker automatiskt
varje natt klockan 3, genom ett schemalagt skript hos Google.

Vill personen få sina uppgifter och sin annons borttagna tidigare görs
det på begäran till chansen.jobb@gmail.com.

**Delas med:** ingen. Kontaktuppgifterna publiceras aldrig, varken i
annonsen eller någon annanstans. Endast det arbetsgivaren själv valt ska
synas i annonsen publiceras.

---

## 3. Synpunkter via Tyck till

**Vad som behandlas:** svaren på frågorna och fritext som personen själv
skriver. Dessutom ålder, ort och antal jobb som visades, som personen
själv valt i appen, och vilken version av sidan som användes.
Mejladress om personen själv väljer att lämna den.

**Varför:** för att förstå vad som fungerar och vad som saknas på
Chansen. Ålder och ort visar om sidan fungerar sämre för en viss grupp
eller plats, och antalet jobb visar om det fanns för få jobb att välja
bland. Versionen gör det möjligt att hitta fel. Mejladressen används
bara för att kunna svara.

**Rättslig grund:** berättigat intresse, artikel 6.1 f. Intresset är att
kunna förbättra Chansen utifrån det personen själv berättar. Mejladressen
är frivillig.

**Varifrån:** personen själv, via formuläret Tyck till på chansen.nu.

**Var uppgifterna finns:** i fliken Synpunkter i samma kalkylark hos
Google som annonserna. Fliken är aldrig publicerad. Åtkomst sker via
Chansen Admin, som kräver användarnamn och lösenord.

**Hur länge:** mejladressen raderas automatiskt efter 30 dagar, varje
natt klockan 3. Synpunkten sparas sedan utan adress, tills den raderas i
Chansen Admin. Vill personen få sin synpunkt eller mejladress borttagen
tidigare görs det på begäran till chansen.jobb@gmail.com.

**Delas med:** ingen.

---

## 4. Besökare på sidan

**Vad som behandlas:** inga personuppgifter.

Svaren på frågorna, sparade jobb och CV lagras i besökarens egen
webbläsare och skickas aldrig till Chansen. Det gäller också
referenspersoner som besökaren själv skriver in i sitt CV.

Besöksstatistik samlas in med Cloudflare Web Analytics och GoatCounter.
Ingen av dem använder cookies, spårar enskilda besökare eller sparar
uppgifter som kan kopplas till en person.

---

## 5. Konton i Chansen Admin

**Vad som behandlas:** användarnamn och ett avtryck av lösenordet.
Lösenordet sparas aldrig i klartext.

**Varför:** för att styra vem som får granska inskickade annonser, och
för att kunna se vem som godkänt eller nekat en annons.

**Rättslig grund:** berättigat intresse, artikel 6.1 f.

**Var uppgifterna finns:** i inställningarna för skriptet hos Google.

**Hur länge:** tills kontot tas bort. En inloggning gäller tolv timmar.

---

## Tekniska och organisatoriska åtgärder

Chansen Admin kräver användarnamn och lösenord. Lösenord sparas som
avtryck med salt, aldrig i klartext.

Inloggningen gäller tolv timmar och förnyas inte automatiskt.

Varje godkännande, nekande, ändring och borttagning loggas med tidpunkt
och vem som gjorde det.

Inga nycklar eller lösenord finns i källkoden, som är öppet publicerad
på GitHub. De ligger i separata inställningar. Nyckeln till Sender ligger
som en secret på GitHub, och skriptet som använder den får bara läsa
listan med grupper och skapa utkast.

Mejladresser, telefonnummer och personnummer tas bort ur annonstexterna
innan de sparas. En spärr stoppar uppladdning av personuppgifter och
nycklar till GitHub, både från datorn och från nattkörningarna.

Sidan serveras enbart över https.

---

## Rättigheter

Den vars uppgifter behandlas har rätt att få veta vad som finns sparat,
få felaktiga uppgifter rättade, få uppgifterna raderade, och att invända
mot behandlingen.

Begäran görs till chansen.jobb@gmail.com och besvaras utan onödigt
dröjsmål, senast inom en månad.

Klagomål kan lämnas till Integritetsskyddsmyndigheten, imy.se.

---

## Att se över

Dessa punkter är inte lösta i dag, och bör åtgärdas om verksamheten
växer, får intäkter eller börjar hantera fler annonser.

**Personuppgiftsbiträdesavtal med Google.** Uppgifterna om arbetsgivare
ligger i ett kalkylark på ett vanligt Google-konto. Ett formellt avtal
ingår i Google Workspace, som kostar omkring 850 kronor om året.

**Överföring till tredje land.** Google kan behandla uppgifter utanför
EU. Det regleras av standardavtalsklausuler och av EU:s beslut om
skyddsnivån i USA, men bör följas upp.

**Versionshistorik hos Google.** Google sparar en versionshistorik för
kalkylark. Rader som raderats kan därför finnas kvar i historiken en tid.
Historiken går bara att nå med samma inloggning som kalkylarket.

**Juridisk genomgång.** Den här förteckningen är skriven utan juridisk
rådgivning och bör granskas av någon sakkunnig innan verksamheten växer.
