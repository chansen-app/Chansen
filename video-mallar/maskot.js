/*  Chansens maskot, gemensam för alla videomallar.

    Ett C med ansikte, byggt på appikonen. Ritad från grunden, så det
    finns inga rättigheter att tänka på. Den står längst ned och berättar
    i en pratbubbla. Ingen röst, så videorna fungerar utan ljud.

    Användning i en mall:
      Maskot.repliker(["Hej!", "Andra repliken", "Sista"]);
      Maskot.rita(t, synlighet, lage)
        synlighet  en lista med hur synlig varje replik är just nu, 0 till 1
        lage       "vinkar" eller "pekar"                                 */

(function () {
  var SVG =
    '<svg class="maskot" id="maskot" viewBox="0 0 320 320">' +
      '<path d="M 44 180 Q 18 190 22 214" fill="none" stroke="#c67139" stroke-width="20" stroke-linecap="round"/>' +
      '<rect x="40" y="40" width="240" height="240" rx="64" fill="#c67139"/>' +
      '<path d="M 222 112 A 82 82 0 1 0 226 204" fill="none" stroke="#f5ead8" stroke-width="22"/>' +
      // Armen ritas efter kroppen, annars hamnar den bakom.
      '<g id="maskot-arm"><path d="M 0 0 L 50 0" fill="none" stroke="#c67139" stroke-width="20" stroke-linecap="round"/></g>' +
      '<g id="maskot-ogon">' +
        '<ellipse cx="138" cy="150" rx="13" ry="17" fill="#201e1d"/>' +
        '<ellipse cx="184" cy="150" rx="13" ry="17" fill="#201e1d"/>' +
        '<circle cx="142" cy="144" r="4.5" fill="#fff6ee"/>' +
        '<circle cx="188" cy="144" r="4.5" fill="#fff6ee"/>' +
      '</g>' +
      '<ellipse cx="120" cy="182" rx="12" ry="7" fill="#e89a6a" opacity=".8"/>' +
      '<ellipse cx="204" cy="182" rx="12" ry="7" fill="#e89a6a" opacity=".8"/>' +
      '<path d="M 146 184 Q 161 198 176 184" fill="none" stroke="#201e1d" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="100" y="270" width="44" height="26" rx="13" fill="#8c491a"/>' +
      '<rect x="176" y="270" width="44" height="26" rx="13" fill="#8c491a"/>' +
    '</svg>';

  var bubbla, repliker = [];

  function klamp(x) { return Math.max(0, Math.min(1, x)); }
  function mjuk(x) { x = klamp(x); return 1 - Math.pow(1 - x, 3); }

  document.body.insertAdjacentHTML("beforeend", '<div class="bubbla" id="bubbla"></div>' + SVG);
  bubbla = document.getElementById("bubbla");

  window.Maskot = {
    repliker: function (texter) {
      bubbla.innerHTML = "";
      repliker = texter.map(function (text) {
        var el = document.createElement("div");
        el.className = "repl";
        el.textContent = text;
        bubbla.appendChild(el);
        return el;
      });
    },

    rita: function (t, synlighet, lage) {
      // Bubblan poppar fram i början.
      var bp = mjuk((t - 0.2) / 0.5);
      bubbla.style.opacity = bp;
      bubbla.style.transform = "scale(" + (0.85 + 0.15 * bp) + ")";
      repliker.forEach(function (el, i) { el.style.opacity = synlighet[i] || 0; });

      // Guppar lite hela tiden och blinkar ibland.
      document.getElementById("maskot").style.transform =
        "translateY(" + (Math.sin(t * Math.PI * 1.6) * 8) + "px)";
      var blink = (t % 3.2) > 3.05 ? 0.1 : 1;
      document.getElementById("maskot-ogon").setAttribute("transform",
        "translate(0 150) scale(1 " + blink + ") translate(0 -150)");

      // Vinklarna pekar utåt, annars hamnar armen över kroppen och syns inte.
      var vinkel = lage === "pekar"
        ? -62 + Math.sin(t * Math.PI * 1.2) * 4
        : -50 + Math.sin(t * Math.PI * 3) * 18;
      document.getElementById("maskot-arm").setAttribute("transform",
        "translate(274 172) rotate(" + vinkel + ")");
    }
  };
})();
