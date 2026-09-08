/*  Egna, granskade jobb
    ─────────────────────────────────────────────────────────────
    Lägg BARA in jobb du själv kontrollerat. Checklista:

      1. Organisationsnummer finns hos Bolagsverket eller allabolag.se
      2. Företaget har en egen sajt, och jobbet stämmer med den
      3. Mejlet kom från företagets egen domän, inte gmail eller hotmail
      4. Du har ringt ett nummer du själv letat fram, inte det i mejlet
      5. Lön är angiven. Ingen provision utan grundlön
      6. Ingen investering, ingen avgift, inget "bli din egen chef"
      7. Länken går till företagets egen sida och börjar med https

    Ta bort jobbet när det inte gäller längre.
*/

const EGNA_JOBB = [

  // Kopiera mallen nedan, ta bort snedstrecken, och fyll i.
  //
  // {
  //   titel: "Butiksbiträde, helger",
  //   arbetsgivare: "Företaget AB",
  //   ort: "Malmö",
  //   omfattning: "Deltid",
  //   anstallningsform: "Behovsanställning",
  //   kategori: "Butik",
  //   erfarenhetKravs: false,
  //   korkortKravs: false,
  //   utdrag: "framgar inte",
  //   minderarigOk: true,
  //   poang: 9,
  //   lank: "https://foretaget.se/jobb",
  //   sistaAnsokningsdag: "2026-09-30T23:59:59"
  // },

];

/*  Kategorier som fungerar med filtren:
    Sälj, Kundtjänst, Butik, Lager och logistik, Restaurang och café,
    Städ, Vård och omsorg, Barn och skola, Industri och produktion, Kontor

    utdrag: "kravs" om de begär utdrag, annars "framgar inte"
    minderarigOk: false om jobbet inte får utföras av den som är under 18
    poang: 9 eller mer ger Bäst chans, 6 till 8 ger Värd att söka   */
