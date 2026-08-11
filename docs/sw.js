/*  Chansen — service worker
 *
 *  Uppgift: se till att den installerade appen alltid visar den senaste
 *  versionen, men ändå fungerar utan internet.
 *
 *  Strategi: nätet först. Varje gång appen öppnas hämtas sidan på nytt.
 *  Lyckas det sparas kopian. Misslyckas det, till exempel i tunnelbanan,
 *  visas den sparade kopian i stället för ett felmeddelande.
 */

const CACHE = "chansen-v1";

// Det appen behöver för att kunna visas offline.
const GRUND = [
  "./",
  "./index.html",
  "./jobb.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  // ta över direkt, vänta inte på att gamla flikar stängs
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(GRUND).catch(function () { /* enstaka fil kan saknas */ });
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (nycklar) {
      return Promise.all(
        nycklar.map(function (n) { if (n !== CACHE) return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  const url = new URL(e.request.url);

  // bara vår egen sida hanteras här, resten går som vanligt
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(function (svar) {
        // spara en färsk kopia för nästa gång nätet saknas
        const kopia = svar.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, kopia); });
        return svar;
      })
      .catch(function () {
        // inget nät: visa det vi har
        return caches.match(e.request).then(function (traff) {
          return traff || caches.match("./index.html");
        });
      })
  );
});
