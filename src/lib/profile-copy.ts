/** Texts for the public clinic and vet pages (fr, it, en, es; other languages fall back to English). */
export interface PC {
  kind: Record<string, string>; types: Record<string, string>; book: string; bookFor: string; next: string; noSlot: string; min: string;
  nav: { about: string; team: string; services: string; hours: string; access: string; animals: string };
  about: string; team: string; services: string; hours: string; access: string; animals: string; langs: string; facilities: string; payments: string;
  bio: string; specialties: string; school: string; years: string; seeProfile: string; clinic: string; others: string;
  days: string[]; closed: string; call: string; website: string; directions: string; home: string; contact: string; verified: string;
  fac: Record<string, string>; pay: Record<string, string>; sp: Record<string, string>; from: string;
}
const EN: PC = {
  kind: { clinic: "Vet clinic", vet: "Veterinarian", home: "Home-visit vet" }, types: { video: "By video", home: "At home", clinic: "At the clinic", expertise: "Expert opinion" },
  book: "Book an appointment", bookFor: "Book with", next: "Next availability", noSlot: "See availability", min: "min",
  nav: { about: "About", team: "Team", services: "Consultations & fees", hours: "Opening hours", access: "Getting there", animals: "Animals treated" },
  about: "About", team: "The team", services: "Consultations and fees", hours: "Opening hours", access: "Getting there", animals: "Animals treated", langs: "Languages spoken", facilities: "On site", payments: "Payment methods",
  bio: "About", specialties: "Specialties", school: "Training", years: "years of experience", seeProfile: "View profile", clinic: "Works at", others: "Other vets at this clinic",
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], closed: "Closed", call: "Call", website: "Website", directions: "Directions", home: "Home", contact: "Report a mistake on this page", verified: "Profile on Televet",
  fac: { parking: "Parking", wheelchair: "Wheelchair access", pharmacy: "Pharmacy", lab: "Laboratory", xray: "X-ray", ultrasound: "Ultrasound", hospitalisation: "Hospitalisation", emergency: "Emergencies", surgery: "Surgery" },
  pay: { card: "Card", cash: "Cash", cheque: "Cheque", transfer: "Bank transfer", contactless: "Contactless" },
  sp: { dog: "Dogs", cat: "Cats", rabbit: "Rabbits", ferret: "Ferrets", bird: "Birds", horse: "Horses", reptile: "Reptiles", rodent: "Rodents", other: "Other pets" }, from: "from",
};
export const PROFILE: Record<string, PC> = {
  en: EN,
  fr: {
    ...EN, kind: { clinic: "Clinique vétérinaire", vet: "Vétérinaire", home: "Vétérinaire à domicile" }, types: { video: "En visio", home: "À domicile", clinic: "En clinique", expertise: "Avis d'expert" },
    book: "Prendre rendez-vous", bookFor: "Prendre rendez-vous avec", next: "Prochaine disponibilité", noSlot: "Voir les disponibilités",
    nav: { about: "Présentation", team: "Équipe", services: "Consultations et tarifs", hours: "Horaires", access: "Accès", animals: "Animaux soignés" },
    about: "Présentation", team: "L'équipe", services: "Consultations et tarifs", hours: "Horaires d'ouverture", access: "Accès", animals: "Animaux soignés", langs: "Langues parlées", facilities: "Sur place", payments: "Moyens de paiement",
    bio: "Présentation", specialties: "Spécialités", school: "Formation", years: "ans d'expérience", seeProfile: "Voir le profil", clinic: "Exerce à", others: "Autres vétérinaires de la clinique",
    days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"], closed: "Fermé", call: "Appeler", website: "Site web", directions: "Itinéraire", home: "Accueil", contact: "Signaler une erreur sur cette page", verified: "Profil sur Televet",
    fac: { parking: "Parking", wheelchair: "Accès handicapé", pharmacy: "Pharmacie", lab: "Laboratoire", xray: "Radiologie", ultrasound: "Échographie", hospitalisation: "Hospitalisation", emergency: "Urgences", surgery: "Chirurgie" },
    pay: { card: "Carte bancaire", cash: "Espèces", cheque: "Chèque", transfer: "Virement", contactless: "Sans contact" },
    sp: { dog: "Chiens", cat: "Chats", rabbit: "Lapins", ferret: "Furets", bird: "Oiseaux", horse: "Chevaux", reptile: "Reptiles", rodent: "Rongeurs", other: "Autres animaux" }, from: "dès",
  },
  it: {
    ...EN, kind: { clinic: "Clinica veterinaria", vet: "Veterinario", home: "Veterinario a domicilio" }, types: { video: "In video", home: "A domicilio", clinic: "In clinica", expertise: "Parere esperto" },
    book: "Prenota una visita", bookFor: "Prenota con", next: "Prima disponibilità", noSlot: "Vedi le disponibilità",
    nav: { about: "Presentazione", team: "Team", services: "Visite e tariffe", hours: "Orari", access: "Come arrivare", animals: "Animali curati" },
    about: "Presentazione", team: "Il team", services: "Visite e tariffe", hours: "Orari di apertura", access: "Come arrivare", animals: "Animali curati", langs: "Lingue parlate", facilities: "In sede", payments: "Metodi di pagamento",
    bio: "Presentazione", specialties: "Specialità", school: "Formazione", years: "anni di esperienza", seeProfile: "Vedi il profilo", clinic: "Esercita presso", others: "Altri veterinari della clinica",
    days: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"], closed: "Chiuso", call: "Chiama", website: "Sito web", directions: "Indicazioni", home: "Home", contact: "Segnala un errore in questa pagina", verified: "Profilo su Televet",
    fac: { parking: "Parcheggio", wheelchair: "Accesso disabili", pharmacy: "Farmacia", lab: "Laboratorio", xray: "Radiologia", ultrasound: "Ecografia", hospitalisation: "Degenza", emergency: "Urgenze", surgery: "Chirurgia" },
    pay: { card: "Carta", cash: "Contanti", cheque: "Assegno", transfer: "Bonifico", contactless: "Contactless" },
    sp: { dog: "Cani", cat: "Gatti", rabbit: "Conigli", ferret: "Furetti", bird: "Uccelli", horse: "Cavalli", reptile: "Rettili", rodent: "Roditori", other: "Altri animali" }, from: "da",
  },
  es: {
    ...EN, kind: { clinic: "Clínica veterinaria", vet: "Veterinario", home: "Veterinario a domicilio" }, types: { video: "Por video", home: "A domicilio", clinic: "En clínica", expertise: "Opinión experta" },
    book: "Pedir cita", bookFor: "Pedir cita con", next: "Próxima disponibilidad", noSlot: "Ver disponibilidad",
    nav: { about: "Presentación", team: "Equipo", services: "Consultas y tarifas", hours: "Horarios", access: "Cómo llegar", animals: "Animales atendidos" },
    about: "Presentación", team: "El equipo", services: "Consultas y tarifas", hours: "Horarios de atención", access: "Cómo llegar", animals: "Animales atendidos", langs: "Idiomas", facilities: "En el centro", payments: "Medios de pago",
    bio: "Presentación", specialties: "Especialidades", school: "Formación", years: "años de experiencia", seeProfile: "Ver perfil", clinic: "Ejerce en", others: "Otros veterinarios de la clínica",
    days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], closed: "Cerrado", call: "Llamar", website: "Sitio web", directions: "Cómo llegar", home: "Inicio", contact: "Informar de un error en esta página", verified: "Perfil en Televet",
    fac: { parking: "Estacionamiento", wheelchair: "Acceso para sillas de ruedas", pharmacy: "Farmacia", lab: "Laboratorio", xray: "Radiografía", ultrasound: "Ecografía", hospitalisation: "Hospitalización", emergency: "Urgencias", surgery: "Cirugía" },
    pay: { card: "Tarjeta", cash: "Efectivo", cheque: "Cheque", transfer: "Transferencia", contactless: "Sin contacto" },
    sp: { dog: "Perros", cat: "Gatos", rabbit: "Conejos", ferret: "Hurones", bird: "Aves", horse: "Caballos", reptile: "Reptiles", rodent: "Roedores", other: "Otras mascotas" }, from: "desde",
  },
};
export const pc = (lang: string) => PROFILE[lang] ?? EN;

/** Merge opening rules into per-weekday lines, Monday first: "09:00–12:30, 14:00–19:00". */
export function hoursByDay(rules: { weekday: number; start_time: string; end_time: string }[]): { day: number; ranges: string }[] {
  const hm = (s: string) => s.slice(0, 5);
  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const list = rules.filter((r) => r.weekday === day).map((r) => [hm(r.start_time), hm(r.end_time)] as const).sort((a, b) => a[0].localeCompare(b[0]));
    const merged: [string, string][] = [];
    for (const [s, e] of list) { const last = merged[merged.length - 1]; if (last && s <= last[1]) last[1] = e > last[1] ? e : last[1]; else merged.push([s, e]); }
    return { day, ranges: merged.map(([s, e]) => `${s}–${e}`).join(", ") };
  });
}
