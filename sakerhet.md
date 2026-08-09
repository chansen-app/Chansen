# Säkerhet, det som faktiskt spelar roll

Chansen har ingen server och ingen databas. Det finns inget att bryta sig in i.
Den enda vägen in är dina konton. Fixar du listan nedan är du klar.

Allt här är gratis.

---

## 1. Tvåstegsverifiering, det viktigaste av allt

Utan detta räcker ett lösenord för att någon ska kunna ändra hela sidan.

**GitHub**
Settings, Password and authentication, Two-factor authentication.
Välj appmetod, inte sms. Spara återställningskoderna någonstans du hittar dem.

**Google**, kontot som har kalkylbladet och Apps Script
myaccount.google.com, Säkerhet, Tvåstegsverifiering.

**Mejlen chansen.jobb@gmail.com**
Den är återställningsväg till allt annat. Kommer någon åt den kommer de åt resten.

Gör alla tre. Det tar tio minuter och är värt mer än allt annat på listan.

---

## 2. Tre olika lösenord

Samma lösenord på GitHub, Google och mejlen betyder att ett läckt lösenord ger
bort allihop. Använd tre olika, gärna långa fraser du kommer ihåg.

Kolla om din mejl läckt någonstans på haveibeenpwned.com. Det är gratis och tar
tio sekunder.

---

## 3. Kolla vem som har tillgång

**GitHub:** repots Settings, Collaborators. Där ska bara du stå.

**Google:** öppna kalkylbladet, tryck Dela. Där ska bara du stå. Kom ihåg att
den publicerade csv-versionen är läsbar för den som har adressen, det är
meningen, men själva bladet ska vara privat.

**Google-konto:** myaccount.google.com, Säkerhet, Appar med åtkomst till ditt
konto. Ta bort sådant du inte känner igen.

---

## 4. Vad som redan är fixat i koden

Det här behöver du inte göra, det är gjort:

- All text från annonser och arbetsgivare skrivs ut som text, aldrig som kod.
  En annons kan alltså inte köra något i besökarens webbläsare.
- Länkar som inte börjar med https tas bort automatiskt.
- Sidan får bara ladda saker från Google Fonts, Google Sheets och Cloudflare.
  Allt annat blockeras av webbläsaren, även om någon fick in en främmande
  adress i koden.
- Skriptet som tar emot annonser kortar av för långa texter, kräver att
  företagsnamn och jobbtitel finns, och stoppar fler än 40 inskick per dygn.
- Ingenting publiceras utan att du skrivit ja.

---

## 5. Sådant du inte behöver oroa dig för

**Att någon skickar skräp till formuläret.** Det hamnar bara i ditt blad och
syns för ingen annan. Radera raderna.

**Att någon kopierar sidan.** Koden är publik och det går inte att hindra.
Det skadar dig inte, det är namnet och användarna som är värda något.

**Virus och intrång i själva sidan.** Det finns ingen kod som körs på en server,
så det finns inget att smitta.

---

## 6. Om något ändå händer

Märker du att något ändrats som du inte gjort:

1. Byt lösenord på GitHub, Google och mejlen, i den ordningen
2. Slå på tvåstegsverifiering om det inte redan är på
3. Titta i repots historik under Commits och se vad som ändrats
4. Du kan alltid gå tillbaka till en tidigare version, allt finns sparat

Det är en av fördelarna med Git: ingenting går att förstöra permanent.
