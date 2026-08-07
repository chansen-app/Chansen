async function kolla() {
 const url = "https://jobsearch.api.jobtechdev.se/search?q=malm%C3%B6&experience=false&limit=100";
  const svar = await fetch(url);
  const data = await svar.json();

  console.log("Totalt: " + JSON.stringify(data.total));
  console.log("Annonser i svaret: " + data.hits.length);

  let utan = 0;
  for (const a of data.hits) {
    if (a.experience_required === false) utan++;
  }
  console.log("Utan krav pa erfarenhet: " + utan);

  if (data.hits.length > 0) {
    console.log("Exempel: " + data.hits[0].headline);
    console.log("Erfarenhet kravs: " + data.hits[0].experience_required);
  }
}

kolla();