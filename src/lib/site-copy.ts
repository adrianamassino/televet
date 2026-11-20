import { voseo } from "./voseo";

type L = Record<string, any>;
const addAR = <T extends L>(m: T): T => ({ ...m, "es-AR": voseo(m.es) });

/** Header menu labels. */
export const MENU = addAR({
  fr: { services: "Services", pricing: "Tarifs", about: "À propos", contact: "Contact", book: "Prendre rendez-vous" },
  it: { services: "Servizi", pricing: "Prezzi", about: "Chi siamo", contact: "Contatti", book: "Prenota una consulenza" },
  en: { services: "Services", pricing: "Pricing", about: "About", contact: "Contact", book: "Book a consultation" },
  es: { services: "Servicios", pricing: "Precios", about: "Quiénes somos", contact: "Contacto", book: "Reservar una consulta" },
  pt: { services: "Serviços", pricing: "Preços", about: "Sobre nós", contact: "Contacto", book: "Marcar consulta" },
  de: { services: "Leistungen", pricing: "Preise", about: "Über uns", contact: "Kontakt", book: "Termin buchen" },
  pl: { services: "Usługi", pricing: "Cennik", about: "O nas", contact: "Kontakt", book: "Umów konsultację" },
  nl: { services: "Diensten", pricing: "Tarieven", about: "Over ons", contact: "Contact", book: "Maak een afspraak" },
});

export const CONTACT = addAR({
  fr: { title: "Nous écrire", lead: "Une question, un partenariat, un souci avec un rendez-vous ? Écrivez-nous, nous répondons en général sous un jour ouvré.", name: "Votre nom", email: "Votre e-mail", topic: "Sujet", topics: ["Question générale", "Un rendez-vous", "Je suis vétérinaire / clinique", "Presse et partenariats"], msg: "Votre message", send: "Envoyer le message", sending: "Envoi…", ok: "Message envoyé. Nous vous répondons très vite.", err: "Le message n'a pas pu être envoyé. Vérifiez les champs ou écrivez à contact@televet.co.", urgent: "Votre animal est en danger (difficulté à respirer, saignement abondant, convulsions, intoxication) ? Ne passez pas par ce formulaire : rendez-vous immédiatement dans une clinique d'urgence." },
  it: { title: "Scrivici", lead: "Una domanda, una collaborazione, un problema con un appuntamento? Scrivici: rispondiamo di norma entro un giorno lavorativo.", name: "Il tuo nome", email: "La tua e-mail", topic: "Argomento", topics: ["Domanda generale", "Un appuntamento", "Sono un veterinario / una clinica", "Stampa e partnership"], msg: "Il tuo messaggio", send: "Invia il messaggio", sending: "Invio…", ok: "Messaggio inviato. Ti rispondiamo presto.", err: "Impossibile inviare il messaggio. Controlla i campi o scrivi a contact@televet.co.", urgent: "Il tuo animale è in pericolo (difficoltà respiratoria, forte emorragia, convulsioni, intossicazione)? Non usare questo modulo: vai subito in una clinica d'urgenza." },
  en: { title: "Contact us", lead: "A question, a partnership, a problem with an appointment? Write to us — we usually reply within one working day.", name: "Your name", email: "Your e-mail", topic: "Topic", topics: ["General question", "An appointment", "I'm a vet / clinic", "Press and partnerships"], msg: "Your message", send: "Send message", sending: "Sending…", ok: "Message sent. We'll get back to you shortly.", err: "The message could not be sent. Check the fields or write to contact@televet.co.", urgent: "Is your pet in danger (trouble breathing, heavy bleeding, seizures, poisoning)? Don't use this form — go to an emergency clinic right away." },
  es: { title: "Escríbenos", lead: "¿Una duda, una colaboración, un problema con un turno? Escríbenos: solemos responder en un día hábil.", name: "Tu nombre", email: "Tu e-mail", topic: "Asunto", topics: ["Consulta general", "Un turno", "Soy veterinario / clínica", "Prensa y alianzas"], msg: "Tu mensaje", send: "Enviar mensaje", sending: "Enviando…", ok: "Mensaje enviado. Te respondemos enseguida.", err: "No se pudo enviar el mensaje. Revisa los campos o escribe a contact@televet.co.", urgent: "¿Tu mascota está en peligro (dificultad para respirar, sangrado abundante, convulsiones, intoxicación)? No uses este formulario: ve de inmediato a una clínica de urgencias." },
  pt: { title: "Escreva-nos", lead: "Uma dúvida, uma parceria, um problema com uma consulta? Escreva-nos: respondemos normalmente em um dia útil.", name: "O seu nome", email: "O seu e-mail", topic: "Assunto", topics: ["Pergunta geral", "Uma consulta", "Sou veterinário / clínica", "Imprensa e parcerias"], msg: "A sua mensagem", send: "Enviar mensagem", sending: "A enviar…", ok: "Mensagem enviada. Respondemos em breve.", err: "Não foi possível enviar a mensagem. Verifique os campos ou escreva para contact@televet.co.", urgent: "O seu animal está em perigo (dificuldade respiratória, hemorragia, convulsões, intoxicação)? Não use este formulário: vá já a uma clínica de urgência." },
  de: { title: "Kontakt", lead: "Eine Frage, eine Partnerschaft, ein Problem mit einem Termin? Schreiben Sie uns – wir antworten in der Regel innerhalb eines Werktags.", name: "Ihr Name", email: "Ihre E-Mail", topic: "Thema", topics: ["Allgemeine Frage", "Ein Termin", "Ich bin Tierarzt / Praxis", "Presse und Partnerschaften"], msg: "Ihre Nachricht", send: "Nachricht senden", sending: "Wird gesendet…", ok: "Nachricht gesendet. Wir melden uns bald.", err: "Die Nachricht konnte nicht gesendet werden. Prüfen Sie die Felder oder schreiben Sie an contact@televet.co.", urgent: "Ist Ihr Tier in Gefahr (Atemnot, starke Blutung, Krampfanfälle, Vergiftung)? Nutzen Sie dieses Formular nicht – fahren Sie sofort zu einer Notfallpraxis." },
  pl: { title: "Napisz do nas", lead: "Pytanie, współpraca, problem z wizytą? Napisz – zwykle odpowiadamy w ciągu jednego dnia roboczego.", name: "Twoje imię", email: "Twój e-mail", topic: "Temat", topics: ["Pytanie ogólne", "Wizyta", "Jestem weterynarzem / lecznicą", "Prasa i partnerstwa"], msg: "Twoja wiadomość", send: "Wyślij wiadomość", sending: "Wysyłanie…", ok: "Wiadomość wysłana. Odpowiemy wkrótce.", err: "Nie udało się wysłać wiadomości. Sprawdź pola lub napisz na contact@televet.co.", urgent: "Twój zwierzak jest w niebezpieczeństwie (trudności z oddychaniem, silny krwotok, drgawki, zatrucie)? Nie używaj tego formularza – jedź od razu do kliniki dyżurnej." },
  nl: { title: "Contact", lead: "Een vraag, een samenwerking, een probleem met een afspraak? Schrijf ons – we antwoorden meestal binnen één werkdag.", name: "Uw naam", email: "Uw e-mail", topic: "Onderwerp", topics: ["Algemene vraag", "Een afspraak", "Ik ben dierenarts / praktijk", "Pers en partnerschappen"], msg: "Uw bericht", send: "Bericht versturen", sending: "Versturen…", ok: "Bericht verzonden. We reageren snel.", err: "Het bericht kon niet worden verzonden. Controleer de velden of mail naar contact@televet.co.", urgent: "Is uw dier in gevaar (ademnood, hevig bloedverlies, stuipen, vergiftiging)? Gebruik dit formulier niet – ga direct naar een spoedkliniek." },
});

export const PRICING = addAR({
  fr: { title: "Tarifs", lead: "Des prix affichés avant de réserver, sans abonnement pour les propriétaires.", ownersH: "Pour les propriétaires", cards: [
      { n: "Téléconseil", p: "20 €", d: "Un conseil vétérinaire rapide par visio ou chat, pour savoir quoi faire et si une consultation est nécessaire.", pts: ["Réponse d'un vétérinaire", "Orientation vers la bonne prise en charge", "Sans diagnostic ni ordonnance"] },
      { n: "Téléconsultation", p: "Fixé par le vétérinaire", d: "Acte vétérinaire encadré, réservé aux animaux déjà suivis par le praticien, avec compte rendu écrit.", pts: ["Prix affiché avant de réserver", "Compte rendu validé par le vétérinaire", "Paiement en ligne sécurisé"] },
      { n: "Vétérinaire à domicile", p: "À partir de 80 €", d: "Le vétérinaire se déplace chez vous. Le tarif dépend de la zone et du praticien.", pts: ["Zone de déplacement vérifiée", "Créneaux réels", "Paiement en ligne"] }],
    vetsH: "Pour les vétérinaires et cliniques", vets: ["Inscription gratuite, sans abonnement ni engagement.", "Vous fixez vos tarifs, vos horaires et vos zones.", "Une commission uniquement sur les rendez-vous réservés et payés via Televet.", "Paiements versés directement sur votre compte (Stripe ou Mercado Pago)."], vetsCta: "Découvrir l'espace vétérinaires", note: "Les tarifs peuvent varier selon le pays et le praticien ; le prix final est toujours affiché avant la réservation.", book: "Trouver un vétérinaire" },
  it: { title: "Prezzi", lead: "Prezzi mostrati prima di prenotare, nessun abbonamento per i proprietari.", ownersH: "Per i proprietari", cards: [
      { n: "Teleconsiglio", p: "20 €", d: "Un consiglio veterinario rapido in video o chat, per capire cosa fare e se serve una visita.", pts: ["Risposta di un veterinario", "Orientamento verso la giusta presa in carico", "Senza diagnosi né ricetta"] },
      { n: "Videoconsulto", p: "Stabilito dal veterinario", d: "Atto veterinario regolamentato, per animali già seguiti dal professionista, con referto scritto.", pts: ["Prezzo mostrato prima di prenotare", "Referto validato dal veterinario", "Pagamento online sicuro"] },
      { n: "Veterinario a domicilio", p: "Da 80 €", d: "Il veterinario viene a casa tua. La tariffa dipende dalla zona e dal professionista.", pts: ["Zona di copertura verificata", "Orari reali", "Pagamento online"] }],
    vetsH: "Per veterinari e cliniche", vets: ["Iscrizione gratuita, senza abbonamento né vincoli.", "Decidi tu tariffe, orari e zone.", "Una commissione solo sugli appuntamenti prenotati e pagati tramite Televet.", "Pagamenti accreditati direttamente sul tuo conto (Stripe o Mercado Pago)."], vetsCta: "Scopri l'area veterinari", note: "Le tariffe possono variare per paese e professionista; il prezzo finale è sempre mostrato prima della prenotazione.", book: "Trova un veterinario" },
  en: { title: "Pricing", lead: "Prices shown before you book, no subscription for pet owners.", ownersH: "For pet owners", cards: [
      { n: "Tele-advice", p: "€20", d: "Quick veterinary advice by video or chat, to know what to do and whether a consultation is needed.", pts: ["Answer from a veterinarian", "Guidance to the right care", "No diagnosis or prescription"] },
      { n: "Video consultation", p: "Set by the vet", d: "A regulated veterinary act, for animals the practitioner already follows, with a written report.", pts: ["Price shown before booking", "Report validated by the vet", "Secure online payment"] },
      { n: "Home-visit vet", p: "From €80", d: "The vet comes to your home. The fee depends on the area and the practitioner.", pts: ["Service area checked", "Real availability", "Online payment"] }],
    vetsH: "For vets and clinics", vets: ["Free sign-up, no subscription, no commitment.", "You set your prices, hours and areas.", "A commission only on appointments booked and paid through Televet.", "Payouts go straight to your account (Stripe or Mercado Pago)."], vetsCta: "Discover the vet area", note: "Prices may vary by country and practitioner; the final price is always shown before booking.", book: "Find a vet" },
  es: { title: "Precios", lead: "Precios visibles antes de reservar, sin suscripción para los dueños.", ownersH: "Para dueños de mascotas", cards: [
      { n: "Teleconsejo", p: "20 €", d: "Un consejo veterinario rápido por video o chat, para saber qué hacer y si hace falta una consulta.", pts: ["Respuesta de un veterinario", "Orientación hacia la atención adecuada", "Sin diagnóstico ni receta"] },
      { n: "Teleconsulta", p: "Fijado por el veterinario", d: "Acto veterinario regulado, para animales que el profesional ya atiende, con informe escrito.", pts: ["Precio visible antes de reservar", "Informe validado por el veterinario", "Pago online seguro"] },
      { n: "Veterinario a domicilio", p: "Desde 80 €", d: "El veterinario va a tu casa. La tarifa depende de la zona y del profesional.", pts: ["Zona de cobertura verificada", "Horarios reales", "Pago online"] }],
    vetsH: "Para veterinarios y clínicas", vets: ["Registro gratuito, sin suscripción ni compromiso.", "Tú fijas precios, horarios y zonas.", "Una comisión solo sobre los turnos reservados y pagados a través de Televet.", "Los cobros llegan directo a tu cuenta (Stripe o Mercado Pago)."], vetsCta: "Conocer el espacio veterinarios", note: "Las tarifas pueden variar según el país y el profesional; el precio final siempre se muestra antes de reservar.", book: "Buscar un veterinario" },
});

export const LEGAL_DOCS = ["privacy", "terms", "medical"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

export const LEGAL_LABEL = addAR({
  fr: { privacy: "Confidentialité", terms: "Conditions d'utilisation", medical: "Avertissement médical" },
  it: { privacy: "Privacy", terms: "Condizioni d'uso", medical: "Avvertenza medica" },
  en: { privacy: "Privacy", terms: "Terms of use", medical: "Medical disclaimer" },
  es: { privacy: "Privacidad", terms: "Condiciones de uso", medical: "Aviso médico" },
  pt: { privacy: "Privacidade", terms: "Condições de utilização", medical: "Aviso médico" },
  de: { privacy: "Datenschutz", terms: "Nutzungsbedingungen", medical: "Medizinischer Hinweis" },
  pl: { privacy: "Prywatność", terms: "Regulamin", medical: "Zastrzeżenie medyczne" },
  nl: { privacy: "Privacy", terms: "Gebruiksvoorwaarden", medical: "Medische disclaimer" },
});

/** Draft legal texts (FR/IT/EN). Other languages fall back to English. To be reviewed by a lawyer before launch. */
export const LEGAL = {
  fr: {
    draft: "Version provisoire à valider par un juriste avant la mise en ligne.",
    privacy: [["Qui sommes-nous", "Televet est éditée par [raison sociale et adresse du siège à compléter], Paris, France. Contact : contact@televet.co."],
      ["Données collectées", "Compte (nom, e-mail), animaux (nom, espèce, race, âge), rendez-vous, adresse pour les visites à domicile, messages envoyés au chat et au formulaire de contact. Pour les vétérinaires : informations professionnelles et de paiement."],
      ["Pourquoi", "Fournir le service (réservation, paiement, visio, compte rendu), envoyer confirmations et rappels, répondre à vos demandes, sécuriser la plateforme et respecter nos obligations légales."],
      ["Visioconsultation et compte rendu", "La transcription n'est créée qu'avec le consentement du propriétaire. Elle sert uniquement à préparer un brouillon de compte rendu que le vétérinaire relit et valide, puis elle est supprimée."],
      ["Destinataires", "Le vétérinaire choisi, nos prestataires techniques (hébergement, e-mail, paiement, visio, calendrier) et, si la loi l'impose, les autorités. Nous ne vendons pas vos données."],
      ["Conservation", "Pendant la vie du compte puis pour les durées légales. Les conversations du chat sont purgées automatiquement après une période limitée."],
      ["Vos droits", "Accès, rectification, effacement, limitation, opposition et portabilité en écrivant à contact@televet.co. Vous pouvez saisir la CNIL (cnil.fr)."]],
    terms: [["Objet", "Televet met en relation des propriétaires d'animaux et des vétérinaires indépendants ou des cliniques pour des consultations à domicile, en vidéo ou en clinique."],
      ["Rôle de Televet", "Televet est une plateforme technique de réservation, de paiement et de visioconférence. Les actes vétérinaires sont réalisés sous la seule responsabilité des vétérinaires."],
      ["Compte et réservation", "Vous garantissez l'exactitude des informations fournies. Le prix, la durée et les conditions d'annulation sont affichés avant la réservation."],
      ["Paiement", "Le paiement en ligne est traité par nos prestataires (Stripe, Mercado Pago) ; Televet ne conserve pas vos données bancaires."],
      ["Annulation", "Les règles d'annulation et de report sont indiquées lors de la réservation et dans l'e-mail de confirmation."],
      ["Responsabilité", "Televet n'est pas un service d'urgence. En cas de danger vital pour l'animal, rendez-vous immédiatement dans une clinique d'urgence."],
      ["Droit applicable", "Droit français. Les consommateurs conservent les droits impératifs de leur pays de résidence."]],
    medical: [["Ce que la plateforme n'est pas", "Un service d'urgence, ni un remplacement d'un examen clinique lorsque celui-ci est nécessaire."],
      ["Téléconseil", "Conseil général d'orientation : il ne constitue ni un diagnostic personnalisé ni une prescription."],
      ["Téléconsultation", "Acte vétérinaire encadré par la réglementation, réservé aux animaux déjà suivis par le praticien selon les conditions légales en vigueur. Le vétérinaire peut vous orienter vers une consultation physique."],
      ["Urgence", "Difficulté à respirer, saignement abondant, traumatisme, convulsions, intoxication, douleur intense : allez immédiatement dans une clinique d'urgence vétérinaire."]],
  },
  it: {
    draft: "Versione provvisoria da validare con un legale prima della pubblicazione.",
    privacy: [["Chi siamo", "Televet è gestita da [ragione sociale e sede legale da completare], Parigi, Francia. Contatto: contact@televet.co."],
      ["Dati raccolti", "Account (nome, e-mail), animali (nome, specie, razza, età), appuntamenti, indirizzo per le visite a domicilio, messaggi inviati alla chat e al modulo contatti. Per i veterinari: dati professionali e di pagamento."],
      ["Perché", "Erogare il servizio (prenotazione, pagamento, video, referto), inviare conferme e promemoria, rispondere alle richieste, proteggere la piattaforma e rispettare gli obblighi di legge."],
      ["Videoconsulto e referto", "La trascrizione viene creata solo con il consenso del proprietario. Serve unicamente a preparare una bozza di referto che il veterinario rilegge e valida; poi viene cancellata."],
      ["Destinatari", "Il veterinario scelto, i nostri fornitori tecnici (hosting, e-mail, pagamenti, video, calendario) e, se richiesto dalla legge, le autorità. Non vendiamo i tuoi dati."],
      ["Conservazione", "Per la durata dell'account e poi per i termini di legge. Le conversazioni della chat sono cancellate automaticamente dopo un periodo limitato."],
      ["I tuoi diritti", "Accesso, rettifica, cancellazione, limitazione, opposizione e portabilità scrivendo a contact@televet.co. Puoi rivolgerti al Garante (garanteprivacy.it) o alla CNIL."]],
    terms: [["Oggetto", "Televet mette in contatto proprietari di animali e veterinari indipendenti o cliniche per visite a domicilio, in video o in clinica."],
      ["Ruolo di Televet", "Televet è una piattaforma tecnica di prenotazione, pagamento e videochiamata. Gli atti veterinari sono eseguiti sotto la sola responsabilità dei veterinari."],
      ["Account e prenotazione", "Garantisci l'esattezza dei dati forniti. Prezzo, durata e condizioni di annullamento sono mostrati prima della prenotazione."],
      ["Pagamento", "Il pagamento online è gestito dai nostri fornitori (Stripe, Mercado Pago); Televet non conserva i dati bancari."],
      ["Annullamento", "Le regole di annullamento e spostamento sono indicate in fase di prenotazione e nell'e-mail di conferma."],
      ["Responsabilità", "Televet non è un servizio di emergenza. In caso di pericolo di vita per l'animale, recati subito in una clinica d'urgenza."],
      ["Legge applicabile", "Legge francese. I consumatori mantengono i diritti inderogabili del proprio paese di residenza."]],
    medical: [["Cosa non è la piattaforma", "Non è un servizio di emergenza né un sostituto della visita clinica quando questa è necessaria."],
      ["Teleconsiglio", "Consiglio generale di orientamento: non è una diagnosi personalizzata né una prescrizione."],
      ["Videoconsulto", "Atto veterinario regolamentato, riservato ad animali già seguiti dal professionista secondo le condizioni di legge. Il veterinario può indirizzarti a una visita in presenza."],
      ["Urgenza", "Difficoltà respiratoria, forte emorragia, trauma, convulsioni, intossicazione, dolore intenso: vai subito in una clinica veterinaria d'urgenza."]],
  },
  en: {
    draft: "Draft version — to be reviewed by a lawyer before launch.",
    privacy: [["Who we are", "Televet is operated by [legal entity name and registered address to be completed], Paris, France. Contact: contact@televet.co."],
      ["Data we collect", "Account (name, e-mail), pets (name, species, breed, age), appointments, address for home visits, messages sent to the chat and contact form. For vets: professional and payout details."],
      ["Why", "To provide the service (booking, payment, video, report), send confirmations and reminders, answer your requests, secure the platform and meet legal obligations."],
      ["Video consultation and report", "A transcript is created only with the owner's consent. It is used only to prepare a draft report that the vet reviews and validates, and is then deleted."],
      ["Recipients", "The vet you choose, our technical providers (hosting, e-mail, payments, video, calendar) and, where the law requires, authorities. We do not sell your data."],
      ["Retention", "For the life of your account and then for legal periods. Chat conversations are purged automatically after a limited period."],
      ["Your rights", "Access, rectification, erasure, restriction, objection and portability by writing to contact@televet.co. You may complain to your data-protection authority (in France, the CNIL)."]],
    terms: [["Purpose", "Televet connects pet owners with independent vets or clinics for home visits, video consultations and clinic appointments."],
      ["Televet's role", "Televet is a technical platform for booking, payment and video calls. Veterinary acts are carried out under the sole responsibility of the vets."],
      ["Account and booking", "You guarantee the information you provide is accurate. Price, duration and cancellation terms are shown before you book."],
      ["Payment", "Online payment is handled by our providers (Stripe, Mercado Pago); Televet does not store your card details."],
      ["Cancellation", "Cancellation and rescheduling rules are shown when you book and in the confirmation e-mail."],
      ["Liability", "Televet is not an emergency service. If your pet's life is in danger, go to an emergency clinic immediately."],
      ["Governing law", "French law. Consumers keep the mandatory rights of their country of residence."]],
    medical: [["What the platform is not", "It is not an emergency service, nor a replacement for a clinical examination when one is needed."],
      ["Tele-advice", "General guidance only: it is neither a personalised diagnosis nor a prescription."],
      ["Video consultation", "A veterinary act regulated by law, reserved for animals the practitioner already follows under the conditions in force. The vet may direct you to an in-person visit."],
      ["Emergency", "Trouble breathing, heavy bleeding, trauma, seizures, poisoning, severe pain: go to an emergency veterinary clinic immediately."]],
  },
} as Record<string, Record<string, any>>;
