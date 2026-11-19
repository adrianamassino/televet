/** Copy for the veterinarian landing page (/{lang}/{country}/pro). Claims are limited to what the platform does today. */
export interface ProCopy {
  title: string; description: string; h1: string; sub: string; cta: string; ctaNote: string;
  benefitsTitle: string; benefits: [string, string][]; stepsTitle: string; steps: string[];
  pets: string;
  ticket: { kind: string; when: string; s0: string; s1: string; paid: string; sample: string };
  faqTitle: string; faq: [string, string][]; legal: string; contact: string; home: string;
}

export const PRO: Record<string, ProCopy> = {
  fr: {
    pets: "Chiens, chats, lapins, oiseaux : chaque animal a son vétérinaire.",
    ticket: { kind: "Visio", when: "Aujourd'hui · 18:30", s0: "À confirmer", s1: "Confirmé", paid: "Payé en ligne", sample: "Exemple de rendez-vous" },
    title: "Televet Pro : consultations vétérinaires en ligne pour les vétérinaires", description: "Créez votre profil Televet, recevez des demandes de rendez-vous en visio, à domicile ou en clinique, avec agenda synchronisé et paiement en ligne.",
    h1: "Votre agenda, vos patients, à votre rythme", sub: "Televet met en relation les propriétaires d'animaux et les vétérinaires pour des consultations en visio, à domicile ou en clinique. Vous gardez la main sur vos horaires, vos tarifs et vos zones.", cta: "Créer mon profil", ctaNote: "Quelques minutes, sans engagement.",
    benefitsTitle: "Ce que Televet vous apporte", benefits: [
      ["Votre agenda reste le vôtre", "Connectez Google Agenda, iCal, Vetup, VetIt ou Petbooqz : les créneaux déjà pris disparaissent, sans double réservation."],
      ["Vous fixez vos règles", "Vos horaires, vos congés, la durée et le prix de chaque consultation, votre zone de déplacement à domicile."],
      ["Paiement en ligne", "Le propriétaire paie à la réservation ; vous recevez le règlement sur votre compte, via Stripe ou Mercado Pago selon le pays."],
      ["Visio intégrée", "Une salle sécurisée par rendez-vous, sans rien installer. Un brouillon de compte rendu peut être préparé à partir de l'échange, si le propriétaire y consent ; c'est vous qui le relisez, le corrigez et le validez."],
      ["Rappels automatiques", "Confirmation et rappels envoyés au propriétaire avant la consultation, pour moins de rendez-vous manqués."]],
    stepsTitle: "Comment ça marche", steps: ["Choisissez votre type d'activité : clinique, vétérinaire indépendant ou à domicile.", "Indiquez votre nom, votre ville et les consultations que vous proposez, avec leurs prix.", "Créez votre accès avec votre e-mail ou votre compte Google.", "Connectez votre agenda et vos paiements ; l'équipe Televet vérifie votre profil puis le publie."],
    faqTitle: "Questions de vétérinaires", faq: [
      ["Ma clinique figure déjà dans l'annuaire. Que faire ?", "Vous pouvez la revendiquer : nous vérifions la fiche Google de votre clinique, puis vous recevez un code sur une adresse e-mail professionnelle du même domaine que votre site. Les adresses gratuites (Gmail, etc.) ne sont pas acceptées. Vous pouvez aussi envoyer un document, que notre équipe vérifie."],
      ["Puis-je garder mon logiciel de gestion ?", "Oui. Televet se synchronise avec votre agenda pour ne proposer que les créneaux réellement libres."],
      ["Qui fixe mes tarifs ?", "Vous. Le prix de chaque consultation est celui que vous définissez et il est affiché au propriétaire avant la réservation."],
      ["Que se passe-t-il pour les données de la consultation ?", "L'enregistrement de l'échange n'est utilisé que pour préparer le brouillon de compte rendu, avec le consentement du propriétaire, puis il est supprimé une fois le compte rendu validé."]],
    legal: "Les règles de la télémédecine vétérinaire (diagnostic, prescription, premier contact) varient selon les pays : vous restez responsable de les respecter dans votre pratique.", contact: "Une question ? Écrivez-nous", home: "Retour à l'accueil" },
  it: {
    pets: "Cani, gatti, conigli, uccelli: ogni animale ha il suo veterinario.",
    ticket: { kind: "Video", when: "Oggi · 18:30", s0: "Da confermare", s1: "Confermato", paid: "Pagato online", sample: "Esempio di appuntamento" },
    title: "Televet Pro: visite veterinarie online per i veterinari", description: "Crea il tuo profilo Televet e ricevi richieste di visita in video, a domicilio o in clinica, con agenda sincronizzata e pagamento online.",
    h1: "La tua agenda, i tuoi pazienti, con i tuoi tempi", sub: "Televet mette in contatto proprietari di animali e veterinari per visite in video, a domicilio o in clinica. Orari, tariffe e zone le decidi tu.", cta: "Crea il mio profilo", ctaNote: "Pochi minuti, senza impegno.",
    benefitsTitle: "Cosa ti offre Televet", benefits: [
      ["La tua agenda resta tua", "Collega Google Calendar, iCal, Vetup, VetIt o Petbooqz: gli orari già occupati spariscono, senza doppie prenotazioni."],
      ["Le regole le fissi tu", "Orari, ferie, durata e prezzo di ogni visita, zona di spostamento per le visite a domicilio."],
      ["Pagamento online", "Il proprietario paga alla prenotazione; tu ricevi l'importo sul tuo conto, tramite Stripe o Mercado Pago a seconda del paese."],
      ["Video integrato", "Una stanza sicura per ogni appuntamento, senza installare nulla. Se il proprietario acconsente, può essere preparata una bozza del referto dalla conversazione; sei tu a rileggerla, correggerla e convalidarla."],
      ["Promemoria automatici", "Conferma e promemoria al proprietario prima della visita, per meno appuntamenti saltati."]],
    stepsTitle: "Come funziona", steps: ["Scegli il tipo di attività: clinica, veterinario indipendente o a domicilio.", "Indica nome, città e visite che offri, con i relativi prezzi.", "Crea l'accesso con la tua e-mail o con l'account Google.", "Collega agenda e pagamenti: il team Televet verifica il tuo profilo e lo pubblica."],
    faqTitle: "Domande dei veterinari", faq: [
      ["La mia clinica è già nell'elenco. Cosa faccio?", "Puoi rivendicarla: verifichiamo la scheda Google della clinica e ricevi un codice a un indirizzo e-mail professionale dello stesso dominio del sito. Gli indirizzi gratuiti (Gmail, ecc.) non sono accettati. In alternativa puoi inviare un documento, che il nostro team controlla."],
      ["Posso continuare a usare il mio gestionale?", "Sì. Televet si sincronizza con la tua agenda per proporre solo gli orari davvero liberi."],
      ["Chi decide le mie tariffe?", "Tu. Il prezzo di ogni visita è quello che stabilisci e viene mostrato al proprietario prima della prenotazione."],
      ["Che fine fanno i dati della visita?", "La registrazione della conversazione serve solo a preparare la bozza del referto, con il consenso del proprietario, e viene eliminata dopo la convalida del referto."]],
    legal: "Le regole sulla telemedicina veterinaria (diagnosi, prescrizione, primo contatto) cambiano da paese a paese: resta tua la responsabilità di rispettarle nella tua pratica.", contact: "Una domanda? Scrivici", home: "Torna alla home" },
  en: {
    pets: "Dogs, cats, rabbits, birds: every pet has their vet.",
    ticket: { kind: "Video", when: "Today · 6:30 pm", s0: "To confirm", s1: "Confirmed", paid: "Paid online", sample: "Example appointment" },
    title: "Televet Pro: online vet consultations for veterinarians", description: "Create your Televet profile and receive booking requests for video, home and clinic visits, with a synced agenda and online payment.",
    h1: "Your agenda, your patients, on your terms", sub: "Televet connects pet owners and vets for video, home and clinic visits. You stay in control of your hours, your prices and your area.", cta: "Create my profile", ctaNote: "A few minutes, no commitment.",
    benefitsTitle: "What Televet gives you", benefits: [
      ["Your agenda stays yours", "Connect Google Calendar, iCal, Vetup, VetIt or Petbooqz: slots already taken disappear, so no double bookings."],
      ["You set the rules", "Your hours, time off, the length and price of each consultation, and your home-visit area."],
      ["Online payment", "The owner pays when booking; you receive the payment in your account, through Stripe or Mercado Pago depending on the country."],
      ["Built-in video", "A secure room for each appointment, nothing to install. With the owner's consent, a draft report can be prepared from the conversation; you review, edit and validate it."],
      ["Automatic reminders", "Confirmation and reminders sent to the owner before the visit, for fewer no-shows."]],
    stepsTitle: "How it works", steps: ["Choose your type of practice: clinic, independent vet or home-visit vet.", "Enter your name, city and the consultations you offer, with their prices.", "Create your access with your e-mail or Google account.", "Connect your agenda and payments; the Televet team checks your profile and publishes it."],
    faqTitle: "Vets' questions", faq: [
      ["My clinic is already listed. What do I do?", "You can claim it: we check your clinic's Google listing, then you receive a code at a professional e-mail address on the same domain as your website. Free webmail (Gmail, etc.) is not accepted. You can also upload a document, which our team checks."],
      ["Can I keep my practice software?", "Yes. Televet syncs with your agenda so only genuinely free slots are offered."],
      ["Who sets my prices?", "You do. The price of each consultation is the one you set, and it is shown to the owner before booking."],
      ["What happens to the consultation data?", "The recording of the conversation is used only to prepare the draft report, with the owner's consent, and is deleted once the report is validated."]],
    legal: "Rules on veterinary telemedicine (diagnosis, prescribing, first contact) vary by country: you remain responsible for complying with them in your practice.", contact: "Questions? Write to us", home: "Back to home" },
  es: {
    pets: "Perros, gatos, conejos, aves: cada mascota tiene su veterinario.",
    ticket: { kind: "Video", when: "Hoy · 18:30", s0: "Por confirmar", s1: "Confirmada", paid: "Pagada online", sample: "Ejemplo de cita" },
    title: "Televet Pro: consultas veterinarias online para veterinarios", description: "Crea tu perfil en Televet y recibe solicitudes de cita por video, a domicilio o en clínica, con agenda sincronizada y pago online.",
    h1: "Tu agenda, tus pacientes, a tu ritmo", sub: "Televet conecta a propietarios de mascotas y veterinarios para consultas por video, a domicilio o en clínica. Tú decides tus horarios, tus tarifas y tu zona.", cta: "Crear mi perfil", ctaNote: "Unos minutos, sin compromiso.",
    benefitsTitle: "Lo que Televet te aporta", benefits: [
      ["Tu agenda sigue siendo tuya", "Conecta Google Calendar, iCal, Vetup, VetIt o Petbooqz: los horarios ocupados desaparecen, sin reservas dobles."],
      ["Tú pones las reglas", "Tus horarios, vacaciones, la duración y el precio de cada consulta y tu zona de visitas a domicilio."],
      ["Pago online", "El propietario paga al reservar; tú recibes el pago en tu cuenta, con Stripe o Mercado Pago según el país."],
      ["Video integrado", "Una sala segura para cada cita, sin instalar nada. Con el consentimiento del propietario, se puede preparar un borrador del informe a partir de la conversación; tú lo revisas, lo corriges y lo validas."],
      ["Recordatorios automáticos", "Confirmación y recordatorios al propietario antes de la consulta, para que falten menos a sus citas."]],
    stepsTitle: "Cómo funciona", steps: ["Elige tu tipo de actividad: clínica, veterinario independiente o a domicilio.", "Indica tu nombre, tu ciudad y las consultas que ofreces, con sus precios.", "Crea tu acceso con tu e-mail o tu cuenta de Google.", "Conecta tu agenda y tus pagos; el equipo de Televet revisa tu perfil y lo publica."],
    faqTitle: "Preguntas de veterinarios", faq: [
      ["Mi clínica ya aparece en el directorio. ¿Qué hago?", "Puedes reclamarla: verificamos la ficha de Google de tu clínica y recibes un código en un e-mail profesional del mismo dominio que tu web. No se aceptan correos gratuitos (Gmail, etc.). También puedes subir un documento que revisa nuestro equipo."],
      ["¿Puedo seguir usando mi software de gestión?", "Sí. Televet se sincroniza con tu agenda para ofrecer solo los horarios realmente libres."],
      ["¿Quién fija mis tarifas?", "Tú. El precio de cada consulta es el que defines y se muestra al propietario antes de reservar."],
      ["¿Qué pasa con los datos de la consulta?", "La grabación de la conversación solo sirve para preparar el borrador del informe, con el consentimiento del propietario, y se elimina cuando validas el informe."]],
    legal: "Las normas sobre telemedicina veterinaria (diagnóstico, prescripción, primer contacto) varían según el país: sigues siendo responsable de cumplirlas en tu práctica.", contact: "¿Dudas? Escríbenos", home: "Volver al inicio" },
  pt: {
    pets: "Cães, gatos, coelhos, aves: cada animal tem o seu veterinário.",
    ticket: { kind: "Vídeo", when: "Hoje · 18:30", s0: "Por confirmar", s1: "Confirmada", paid: "Pago online", sample: "Exemplo de marcação" },
    title: "Televet Pro: consultas veterinárias online para veterinários", description: "Crie o seu perfil na Televet e receba pedidos de consulta por vídeo, ao domicílio ou em clínica, com agenda sincronizada e pagamento online.",
    h1: "A sua agenda, os seus pacientes, ao seu ritmo", sub: "A Televet liga donos de animais e veterinários para consultas por vídeo, ao domicílio ou em clínica. Os horários, os preços e a zona são consigo.", cta: "Criar o meu perfil", ctaNote: "Poucos minutos, sem compromisso.",
    benefitsTitle: "O que a Televet lhe traz", benefits: [
      ["A sua agenda continua sua", "Ligue o Google Calendar, iCal, Vetup, VetIt ou Petbooqz: os horários ocupados desaparecem, sem marcações duplas."],
      ["As regras são suas", "Horários, férias, duração e preço de cada consulta e a zona das visitas ao domicílio."],
      ["Pagamento online", "O dono paga na marcação; recebe o pagamento na sua conta, via Stripe ou Mercado Pago consoante o país."],
      ["Vídeo integrado", "Uma sala segura para cada consulta, sem instalar nada. Com o consentimento do dono, pode ser preparado um rascunho do relatório a partir da conversa; é o veterinário que o revê, corrige e valida."],
      ["Lembretes automáticos", "Confirmação e lembretes ao dono antes da consulta, para menos faltas."]],
    stepsTitle: "Como funciona", steps: ["Escolha o tipo de atividade: clínica, veterinário independente ou ao domicílio.", "Indique o nome, a cidade e as consultas que oferece, com os preços.", "Crie o acesso com o seu e-mail ou conta Google.", "Ligue a agenda e os pagamentos; a equipa da Televet verifica o seu perfil e publica-o."],
    faqTitle: "Perguntas de veterinários", faq: [
      ["A minha clínica já está no diretório. O que faço?", "Pode reivindicá-la: verificamos a ficha Google da clínica e recebe um código num e-mail profissional do mesmo domínio do seu site. Não são aceites e-mails gratuitos (Gmail, etc.). Pode também enviar um documento, que a nossa equipa verifica."],
      ["Posso manter o meu software de gestão?", "Sim. A Televet sincroniza com a sua agenda para propor apenas horários realmente livres."],
      ["Quem define os meus preços?", "O próprio. O preço de cada consulta é o que definir e é mostrado ao dono antes da marcação."],
      ["O que acontece aos dados da consulta?", "A gravação da conversa só serve para preparar o rascunho do relatório, com o consentimento do dono, e é eliminada depois de o relatório ser validado."]],
    legal: "As regras sobre telemedicina veterinária (diagnóstico, prescrição, primeiro contacto) variam consoante o país: continua responsável por as cumprir na sua prática.", contact: "Dúvidas? Escreva-nos", home: "Voltar ao início" },
  de: {
    pets: "Hunde, Katzen, Kaninchen, Vögel: jedes Tier hat seinen Tierarzt.",
    ticket: { kind: "Video", when: "Heute · 18:30", s0: "Zu bestätigen", s1: "Bestätigt", paid: "Online bezahlt", sample: "Beispieltermin" },
    title: "Televet Pro: Online-Tierarztsprechstunde für Tierärzte", description: "Erstelle dein Televet-Profil und erhalte Terminanfragen für Video-, Haus- und Praxisbesuche – mit synchronisiertem Kalender und Online-Zahlung.",
    h1: "Dein Kalender, deine Patienten, dein Tempo", sub: "Televet verbindet Tierhalter und Tierärzte für Video-, Haus- und Praxisbesuche. Zeiten, Preise und Einsatzgebiet bestimmst du.", cta: "Mein Profil erstellen", ctaNote: "Wenige Minuten, unverbindlich.",
    benefitsTitle: "Was Televet dir bietet", benefits: [
      ["Dein Kalender bleibt deiner", "Verbinde Google Kalender, iCal, Vetup, VetIt oder Petbooqz: belegte Zeiten verschwinden, Doppelbuchungen gibt es nicht."],
      ["Du bestimmst die Regeln", "Deine Zeiten, Urlaub, Dauer und Preis jeder Beratung sowie dein Hausbesuchsgebiet."],
      ["Online-Zahlung", "Der Tierhalter zahlt bei der Buchung; du erhältst die Zahlung auf dein Konto, je nach Land über Stripe oder Mercado Pago."],
      ["Integrierte Videosprechstunde", "Ein sicherer Raum pro Termin, ohne Installation. Mit Einwilligung des Tierhalters kann aus dem Gespräch ein Berichtsentwurf erstellt werden; du prüfst, korrigierst und bestätigst ihn."],
      ["Automatische Erinnerungen", "Bestätigung und Erinnerungen an den Tierhalter vor dem Termin – weniger Ausfälle."]],
    stepsTitle: "So funktioniert es", steps: ["Wähle deine Tätigkeit: Praxis, selbstständiger Tierarzt oder Hausbesuche.", "Gib Name, Stadt und deine Leistungen mit Preisen an.", "Lege deinen Zugang mit E-Mail oder Google-Konto an.", "Verbinde Kalender und Zahlungen; das Televet-Team prüft dein Profil und veröffentlicht es."],
    faqTitle: "Fragen von Tierärzten", faq: [
      ["Meine Praxis ist schon im Verzeichnis. Was tun?", "Du kannst sie beanspruchen: Wir prüfen den Google-Eintrag deiner Praxis, danach erhältst du einen Code an eine berufliche E-Mail-Adresse mit derselben Domain wie deine Website. Kostenlose Adressen (Gmail usw.) werden nicht akzeptiert. Alternativ kannst du ein Dokument hochladen, das unser Team prüft."],
      ["Kann ich meine Praxissoftware behalten?", "Ja. Televet synchronisiert sich mit deinem Kalender und bietet nur wirklich freie Zeiten an."],
      ["Wer legt meine Preise fest?", "Du. Der Preis jeder Beratung ist der, den du festlegst, und wird dem Tierhalter vor der Buchung angezeigt."],
      ["Was passiert mit den Daten der Beratung?", "Die Aufzeichnung des Gesprächs dient nur dem Berichtsentwurf, mit Einwilligung des Tierhalters, und wird nach der Freigabe des Berichts gelöscht."]],
    legal: "Die Regeln zur tierärztlichen Telemedizin (Diagnose, Verschreibung, Erstkontakt) unterscheiden sich je nach Land: Du bleibst dafür verantwortlich, sie in deiner Praxis einzuhalten.", contact: "Fragen? Schreib uns", home: "Zur Startseite" },
  pl: {
    pets: "Psy, koty, króliki, ptaki: każde zwierzę ma swojego weterynarza.",
    ticket: { kind: "Wideo", when: "Dziś · 18:30", s0: "Do potwierdzenia", s1: "Potwierdzona", paid: "Opłacona online", sample: "Przykładowa wizyta" },
    title: "Televet Pro: konsultacje weterynaryjne online dla weterynarzy", description: "Załóż profil w Televet i przyjmuj zgłoszenia na wizyty wideo, domowe i w klinice – z zsynchronizowanym kalendarzem i płatnością online.",
    h1: "Twój kalendarz, Twoi pacjenci, Twoje tempo", sub: "Televet łączy właścicieli zwierząt z weterynarzami na wizyty wideo, domowe i w klinice. Godziny, ceny i obszar dojazdu ustalasz Ty.", cta: "Załóż profil", ctaNote: "Kilka minut, bez zobowiązań.",
    benefitsTitle: "Co daje Ci Televet", benefits: [
      ["Kalendarz pozostaje Twój", "Połącz Kalendarz Google, iCal, Vetup, VetIt lub Petbooqz: zajęte terminy znikają, bez podwójnych rezerwacji."],
      ["Ty ustalasz zasady", "Godziny pracy, urlopy, czas i cena każdej konsultacji oraz obszar wizyt domowych."],
      ["Płatność online", "Właściciel płaci przy rezerwacji; Ty otrzymujesz wpłatę na konto przez Stripe lub Mercado Pago, zależnie od kraju."],
      ["Wbudowane wideo", "Bezpieczny pokój na każdą wizytę, bez instalowania czegokolwiek. Za zgodą właściciela z rozmowy można przygotować szkic raportu; Ty go sprawdzasz, poprawiasz i zatwierdzasz."],
      ["Automatyczne przypomnienia", "Potwierdzenie i przypomnienia dla właściciela przed wizytą – mniej nieodbytych wizyt."]],
    stepsTitle: "Jak to działa", steps: ["Wybierz rodzaj działalności: klinika, niezależny weterynarz lub wizyty domowe.", "Podaj imię i nazwisko, miasto oraz oferowane konsultacje wraz z cenami.", "Utwórz dostęp za pomocą e-maila lub konta Google.", "Połącz kalendarz i płatności; zespół Televet sprawdza profil i go publikuje."],
    faqTitle: "Pytania weterynarzy", faq: [
      ["Moja klinika jest już w katalogu. Co robić?", "Możesz ją przejąć: sprawdzamy wizytówkę Google kliniki, a następnie otrzymujesz kod na służbowy adres e-mail w tej samej domenie co Twoja strona. Darmowe adresy (Gmail itp.) nie są akceptowane. Możesz też przesłać dokument, który sprawdzi nasz zespół."],
      ["Czy mogę zostać przy swoim oprogramowaniu?", "Tak. Televet synchronizuje się z Twoim kalendarzem i proponuje tylko naprawdę wolne terminy."],
      ["Kto ustala moje ceny?", "Ty. Cena każdej konsultacji jest taka, jaką ustalisz, i jest pokazywana właścicielowi przed rezerwacją."],
      ["Co dzieje się z danymi z konsultacji?", "Nagranie rozmowy służy tylko do przygotowania szkicu raportu, za zgodą właściciela, i jest usuwane po zatwierdzeniu raportu."]],
    legal: "Przepisy dotyczące telemedycyny weterynaryjnej (diagnoza, recepty, pierwszy kontakt) różnią się w zależności od kraju: odpowiadasz za ich przestrzeganie w swojej praktyce.", contact: "Pytania? Napisz do nas", home: "Wróć na stronę główną" },
  nl: {
    pets: "Honden, katten, konijnen, vogels: elk dier heeft zijn dierenarts.",
    ticket: { kind: "Video", when: "Vandaag · 18:30", s0: "Te bevestigen", s1: "Bevestigd", paid: "Online betaald", sample: "Voorbeeldafspraak" },
    title: "Televet Pro: online dierenartsconsulten voor dierenartsen", description: "Maak je Televet-profiel en ontvang aanvragen voor video-, huis- en praktijkbezoeken, met gesynchroniseerde agenda en online betaling.",
    h1: "Jouw agenda, jouw patiënten, jouw tempo", sub: "Televet verbindt dierhouders en dierenartsen voor video-, huis- en praktijkbezoeken. Jij bepaalt je uren, tarieven en werkgebied.", cta: "Mijn profiel maken", ctaNote: "Een paar minuten, vrijblijvend.",
    benefitsTitle: "Wat Televet je biedt", benefits: [
      ["Je agenda blijft van jou", "Koppel Google Agenda, iCal, Vetup, VetIt of Petbooqz: bezette tijden verdwijnen, dus geen dubbele boekingen."],
      ["Jij bepaalt de regels", "Je uren, vrije dagen, de duur en prijs van elk consult en je gebied voor huisbezoeken."],
      ["Online betaling", "De eigenaar betaalt bij het boeken; jij ontvangt de betaling op je rekening, via Stripe of Mercado Pago, afhankelijk van het land."],
      ["Ingebouwde video", "Een beveiligde ruimte per afspraak, niets te installeren. Met toestemming van de eigenaar kan uit het gesprek een conceptverslag worden opgesteld; jij leest het na, past het aan en keurt het goed."],
      ["Automatische herinneringen", "Bevestiging en herinneringen naar de eigenaar vóór het consult, voor minder gemiste afspraken."]],
    stepsTitle: "Hoe het werkt", steps: ["Kies je soort praktijk: kliniek, zelfstandig dierenarts of huisbezoeken.", "Vul je naam, stad en je consulten met prijzen in.", "Maak je toegang aan met je e-mail of Google-account.", "Koppel je agenda en betalingen; het Televet-team controleert je profiel en publiceert het."],
    faqTitle: "Vragen van dierenartsen", faq: [
      ["Mijn praktijk staat al in de gids. Wat nu?", "Je kunt hem claimen: we controleren de Google-vermelding van je praktijk en je ontvangt een code op een zakelijk e-mailadres met hetzelfde domein als je website. Gratis adressen (Gmail enz.) worden niet geaccepteerd. Je kunt ook een document uploaden dat ons team controleert."],
      ["Kan ik mijn praktijksoftware houden?", "Ja. Televet synchroniseert met je agenda en biedt alleen echt vrije tijden aan."],
      ["Wie bepaalt mijn tarieven?", "Jij. De prijs van elk consult is die je zelf instelt en wordt vóór het boeken aan de eigenaar getoond."],
      ["Wat gebeurt er met de gegevens van het consult?", "De opname van het gesprek wordt alleen gebruikt voor het conceptverslag, met toestemming van de eigenaar, en wordt verwijderd zodra het verslag is goedgekeurd."]],
    legal: "De regels voor veterinaire telegeneeskunde (diagnose, voorschrijven, eerste contact) verschillen per land: je blijft zelf verantwoordelijk voor naleving in je praktijk.", contact: "Vragen? Schrijf ons", home: "Terug naar home" },
};

import { voseo } from "@/lib/voseo";
PRO["es-AR"] = voseo(PRO.es);
