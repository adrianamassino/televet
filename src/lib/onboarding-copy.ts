import { brazilian } from "./brazilian";

/** What a vet still has to set up before the profile can take bookings. */
export type Missing = "profile" | "services" | "hours" | "payments";
type P = { kind: string; phone: string | null; postal_code: string | null; address: string | null; stripe_status: string; mp_status: string };

/** Pure check: which setup steps are missing for one practice. */
export function missingItems(p: P, services: { active: boolean; price_cents: number }[], openingRules: number): Missing[] {
  const out: Missing[] = [];
  if (!p.phone?.trim() || !p.postal_code?.trim() || (p.kind === "clinic" && !p.address?.trim())) out.push("profile");
  if (!services.some((s) => s.active && s.price_cents > 0)) out.push("services");
  if (openingRules < 1) out.push("hours");
  if (p.stripe_status !== "active" && p.mp_status !== "active") out.push("payments");
  return out;
}

type L = { s: string; last: string; hi: string; intro: string; todo: string; items: Record<Missing, string>; cta: string; help: string; stop: string };
const T: Record<string, L> = {
  fr: { s: "Terminez votre profil Televet", last: "Dernier rappel : terminez votre profil Televet", hi: "Bonjour", intro: "Votre compte Televet est créé, mais votre profil n'est pas encore complet : vos clients ne peuvent pas encore réserver avec vous.", todo: "Il reste à faire :",
    items: { profile: "Compléter vos coordonnées (téléphone, code postal, adresse)", services: "Ajouter au moins une consultation avec son prix", hours: "Indiquer vos horaires d'ouverture", payments: "Connecter votre compte de paiement pour être payé" }, cta: "Terminer mon profil", help: "Cela prend quelques minutes. Une question ? Répondez simplement à cet e-mail.", stop: "Vous recevez cet e-mail parce que vous avez créé un compte sur Televet." },
  it: { s: "Completa il tuo profilo Televet", last: "Ultimo promemoria: completa il tuo profilo Televet", hi: "Buongiorno", intro: "Il tuo account Televet è stato creato, ma il profilo non è ancora completo: i tuoi clienti non possono ancora prenotare con te.", todo: "Resta da fare:",
    items: { profile: "Completare i tuoi dati (telefono, CAP, indirizzo)", services: "Aggiungere almeno una visita con il suo prezzo", hours: "Indicare i tuoi orari di apertura", payments: "Collegare il conto per i pagamenti, così puoi essere pagato" }, cta: "Completa il mio profilo", help: "Bastano pochi minuti. Hai una domanda? Rispondi semplicemente a questa e-mail.", stop: "Ricevi questa e-mail perché hai creato un account su Televet." },
  en: { s: "Finish setting up your Televet profile", last: "Last reminder: finish setting up your Televet profile", hi: "Hello", intro: "Your Televet account is created, but your profile isn't complete yet, so clients can't book with you.", todo: "Still to do:",
    items: { profile: "Complete your details (phone, postal code, address)", services: "Add at least one consultation with its price", hours: "Set your opening hours", payments: "Connect your payment account so you get paid" }, cta: "Finish my profile", help: "It only takes a few minutes. Questions? Just reply to this e-mail.", stop: "You receive this e-mail because you created an account on Televet." },
  es: { s: "Termina tu perfil de Televet", last: "Último recordatorio: termina tu perfil de Televet", hi: "Hola", intro: "Tu cuenta de Televet está creada, pero tu perfil aún no está completo: tus clientes todavía no pueden reservar contigo.", todo: "Falta por hacer:",
    items: { profile: "Completar tus datos (teléfono, código postal, dirección)", services: "Añadir al menos una consulta con su precio", hours: "Indicar tus horarios de atención", payments: "Conectar tu cuenta de pagos para cobrar" }, cta: "Terminar mi perfil", help: "Solo lleva unos minutos. ¿Dudas? Responde a este e-mail.", stop: "Recibes este e-mail porque creaste una cuenta en Televet." },
  pt: { s: "Conclua o seu perfil na Televet", last: "Último lembrete: conclua o seu perfil na Televet", hi: "Olá", intro: "A sua conta Televet foi criada, mas o perfil ainda não está completo: os seus clientes ainda não podem marcar consigo.", todo: "Falta fazer:",
    items: { profile: "Completar os seus dados (telefone, código postal, morada)", services: "Adicionar pelo menos uma consulta com o seu preço", hours: "Indicar o seu horário de atendimento", payments: "Ligar a sua conta de pagamentos para receber" }, cta: "Concluir o meu perfil", help: "Demora apenas alguns minutos. Dúvidas? Responda a este e-mail.", stop: "Recebe este e-mail porque criou uma conta na Televet." },
  de: { s: "Schließen Sie Ihr Televet-Profil ab", last: "Letzte Erinnerung: Schließen Sie Ihr Televet-Profil ab", hi: "Hallo", intro: "Ihr Televet-Konto ist angelegt, aber Ihr Profil ist noch nicht vollständig: Kunden können noch nicht bei Ihnen buchen.", todo: "Noch zu erledigen:",
    items: { profile: "Angaben vervollständigen (Telefon, Postleitzahl, Adresse)", services: "Mindestens eine Konsultation mit Preis hinzufügen", hours: "Öffnungszeiten angeben", payments: "Zahlungskonto verbinden, um Geld zu erhalten" }, cta: "Profil abschließen", help: "Es dauert nur wenige Minuten. Fragen? Antworten Sie einfach auf diese E-Mail.", stop: "Sie erhalten diese E-Mail, weil Sie ein Konto bei Televet erstellt haben." },
  pl: { s: "Dokończ swój profil w Televet", last: "Ostatnie przypomnienie: dokończ swój profil w Televet", hi: "Dzień dobry", intro: "Twoje konto w Televet zostało utworzone, ale profil nie jest jeszcze kompletny: klienci nie mogą jeszcze umawiać się z Tobą.", todo: "Do zrobienia:",
    items: { profile: "Uzupełnij dane (telefon, kod pocztowy, adres)", services: "Dodaj co najmniej jedną konsultację z ceną", hours: "Podaj godziny pracy", payments: "Połącz konto płatnicze, aby otrzymywać wypłaty" }, cta: "Dokończ profil", help: "To zajmie kilka minut. Pytania? Odpowiedz na tego e-maila.", stop: "Otrzymujesz tę wiadomość, ponieważ założyłeś konto w Televet." },
  nl: { s: "Rond uw Televet-profiel af", last: "Laatste herinnering: rond uw Televet-profiel af", hi: "Hallo", intro: "Uw Televet-account is aangemaakt, maar uw profiel is nog niet compleet: klanten kunnen nog niet bij u boeken.", todo: "Nog te doen:",
    items: { profile: "Gegevens aanvullen (telefoon, postcode, adres)", services: "Minstens één consult met prijs toevoegen", hours: "Openingstijden invullen", payments: "Uw betaalaccount koppelen om betaald te worden" }, cta: "Mijn profiel afronden", help: "Het kost maar enkele minuten. Vragen? Beantwoord gewoon deze e-mail.", stop: "U ontvangt deze e-mail omdat u een account bij Televet hebt aangemaakt." },
};
T["pt-BR"] = brazilian(T.pt);
export const ONBOARDING_COPY = T;
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
/** Days after sign-up at which reminder 1, 2, 3, 4 and 5 are sent. */
export const REMINDER_DAYS = [1, 3, 7, 14, 30];

