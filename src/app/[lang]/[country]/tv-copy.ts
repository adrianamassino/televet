import { voseo } from "@/lib/voseo";
/** Brand copy for the redesigned home: final call to action, species gallery caption. */
export const TV: Record<string, { finalH: string; finalP: string; discover: string; gallery: string; call: string }> = {
  fr: { finalH: "Votre animal mérite une attention d'expert.", finalP: "Réservez en ligne en quelques clics : à domicile, en visio ou en clinique.", discover: "Découvrir nos services", gallery: "Chaque animal, son vétérinaire", call: "Consultation en visio" },
  it: { finalH: "Il tuo animale merita un'attenzione da esperti.", finalP: "Prenota online in pochi clic: a domicilio, in video o in clinica.", discover: "Scopri i nostri servizi", gallery: "Ogni animale, il suo veterinario", call: "Consulto in video" },
  en: { finalH: "Your pet deserves expert attention.", finalP: "Book online in a few clicks: at home, by video or at the clinic.", discover: "Discover our services", gallery: "Every pet, the right vet", call: "Video consultation" },
  es: { finalH: "Tu mascota merece atención experta.", finalP: "Reserva en línea en pocos clics: a domicilio, por video o en clínica.", discover: "Descubre nuestros servicios", gallery: "Cada mascota, su veterinario", call: "Consulta por video" },
  pt: { finalH: "O seu animal merece atenção especializada.", finalP: "Marque online em poucos cliques: ao domicílio, por vídeo ou na clínica.", discover: "Descubra os nossos serviços", gallery: "Cada animal, o seu veterinário", call: "Consulta por vídeo" },
  de: { finalH: "Ihr Tier verdient fachkundige Aufmerksamkeit.", finalP: "Buchen Sie online in wenigen Klicks: zu Hause, per Video oder in der Praxis.", discover: "Unsere Leistungen entdecken", gallery: "Jedes Tier, der passende Tierarzt", call: "Video-Sprechstunde" },
  pl: { finalH: "Twój zwierzak zasługuje na fachową opiekę.", finalP: "Zarezerwuj online w kilku kliknięciach: w domu, przez wideo lub w klinice.", discover: "Poznaj nasze usługi", gallery: "Każdy zwierzak, właściwy weterynarz", call: "Konsultacja wideo" },
  nl: { finalH: "Uw huisdier verdient deskundige aandacht.", finalP: "Boek online in een paar klikken: thuis, via video of in de praktijk.", discover: "Ontdek onze diensten", gallery: "Elk dier, de juiste dierenarts", call: "Videoconsult" },
};
TV["es-AR"] = voseo(TV.es);
