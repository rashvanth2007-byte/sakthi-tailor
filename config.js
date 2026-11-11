// Sakthi Tailor & Garments - site settings.
// This is the ONE file to edit when shop details change. Everything on the
// website (branch cards, maps, WhatsApp links, social icons) reads from here.
//
// Leave a value as "" (empty) and the site shows a polite "to be added"
// message instead, in the visitor's language.

window.SITE = {
  // Country code + number, digits only (used for WhatsApp links)
  whatsapp: "919789651814",
  // Shown on screen and used for tel: links
  phoneDisplay: "97896 51814",
  phoneTel: "+919789651814",

  // Paste the full profile links here, e.g. "https://www.instagram.com/sakthitailor"
  social: {
    instagram: "",
    facebook: ""
  },

  // Two branches. For the map, either fill "mapQuery" with the exact Google
  // Maps search text (shop name + street + town), or leave it "" to use
  // "address". Write "address" and "hours" in the language you want shown
  // to everyone (Tamil + English together works well).
  branches: [
    {
      address: "Attur Main Road, opp. Canara Bank, Namagiripettai, Rasipuram Tk, Namakkal Dt – 637406",
      hours: "",          // e.g. "Mon–Sat 9:30 AM – 8:30 PM · Sun 10 AM – 1 PM"
      landmark: true,     // shows the "opposite Canara Bank" note under the address
      phoneDisplay: "97896 51814",
      phoneTel: "+919789651814",
      // The shop has no Google Maps listing yet and the owner said the earlier bank pin was the
      // wrong spot, so the map shows the town only. Replace with the exact pin ("lat,lng") or the
      // listing's name once known.
      mapQuery: "Namagiripettai, Tamil Nadu 637406"
    },
    {
      address: "",
      hours: "",
      phoneDisplay: "97896 51814",
      phoneTel: "+919789651814",
      mapQuery: ""
    }
  ]
};
