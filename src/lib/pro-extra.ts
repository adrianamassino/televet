import { voseo } from "@/lib/voseo";
/** Extra sections for the vet landing page, from televet.co/veterinaire. France-specific rules: vets must check the Ordre's current rules. */
export interface ProExtra {
  moreBenefits: [string, string][];
  diffH: string; diffTa: [string, string]; diffTc: [string, string];
  regH: string; regIntro: string; regPts: string[]; regCond: string[]; regNote: string;
  rxH: string; rxP: string; rxPts: string[];
  free: string; moreFaq: [string, string][];
}
export const PRO_X: Record<string, ProExtra> = {
  fr: {
    moreBenefits: [["Innovant", "Utilisez Televet comme outil de prise de rendez-vous en ligne, ou connectez-le à votre plateforme de réservation existante. Vos clients réservent quand ça leur convient, de jour comme de nuit."], ["Simple et pratique", "Un logiciel dans le cloud, synchronisé avec votre logiciel de gestion et Google Agenda. Rien à installer : un ordinateur ou un smartphone connecté suffit."], ["Sécurisé", "Les données de vos clients et patients sont protégées. Les consultations en visio sont chiffrées et se déroulent via un lien unique partagé entre vous et le propriétaire. Le paiement se fait en ligne à la réservation."], ["Accessible", "Gardez le contact avec vos clients et leurs animaux à distance, même en vacances ou en déplacement, et gagnez en visibilité en ligne."]],
    diffH: "Téléconseil ou téléconsultation : quelle différence ?",
    diffTa: ["Téléconseil vétérinaire", "Des informations générales sur la santé animale, non personnalisées. Il ne donne lieu ni à un diagnostic ni à une prescription personnalisés."],
    diffTc: ["Téléconsultation vétérinaire", "Un acte vétérinaire à distance, qui peut aboutir à un diagnostic et à une prescription. Il est encadré par l'Ordre des vétérinaires et le ministère de l'Agriculture, et expérimenté depuis mai 2020."],
    regH: "Téléconsultation en France : ce qu'il faut savoir",
    regIntro: "La téléconsultation vétérinaire est strictement encadrée. Voici les points à vérifier avant de la proposer ; consultez toujours le site de l'Ordre pour les règles en vigueur.",
    regPts: ["Désigner un vétérinaire référent pour l'expérimentation auprès de l'Ordre", "Déclarer votre lieu d'exercice (DPE) via le formulaire de l'Ordre", "Informer votre assureur en responsabilité civile professionnelle (RCP)", "Vérifier les conditions générales de fonctionnement des établissements de soins vétérinaires (CGFESV)"],
    regCond: ["Seuls les vétérinaires inscrits à l'Ordre en France peuvent la pratiquer sur le territoire français", "Elle concerne vos propres patients : des animaux que vous avez examinés dans votre DPE au cours des 12 derniers mois", "Elle n'est pas autorisée lorsque le pronostic médical est à risque", "Tout outil de paiement est autorisé, à condition de sécuriser les données personnelles et bancaires du client"],
    regNote: "Ces règles concernent la France. Dans les autres pays, la réglementation diffère.",
    rxH: "Délivrer une ordonnance après une téléconsultation", rxP: "Lorsqu'une prescription est établie, elle doit parvenir au client dans un délai de 10 jours :",
    rxPts: ["envoi par courrier postal ou par voie électronique", "retrait de l'ordonnance à la clinique", "envoi du médicament dans un colis scellé et opaque"],
    free: "L'inscription est gratuite et sans engagement.",
    moreFaq: [["Quelle est la différence entre téléconseil et téléconsultation ?", "Le téléconseil donne des informations générales, sans diagnostic ni prescription personnalisés. La téléconsultation est un acte vétérinaire à distance, encadré, qui peut mener à un diagnostic et à une prescription."], ["Qui peut réaliser une téléconsultation, et avec quel moyen de paiement ?", "Seuls les vétérinaires inscrits à l'Ordre en France peuvent la réaliser sur le territoire français. Tout outil de paiement est autorisé s'il sécurise les données du client ; le paiement en ligne à la réservation est aussi possible sur Televet."], ["Comment délivrer une ordonnance ?", "Dans les 10 jours : envoi postal ou électronique, retrait à la clinique, ou médicament envoyé dans un colis scellé et opaque."]],
  },
  it: {
    moreBenefits: [["Innovativo", "Usa Televet come strumento di prenotazione online o collegalo alla tua piattaforma esistente. I tuoi clienti prenotano quando fa comodo a loro, di giorno e di notte."], ["Semplice e pratico", "Un software nel cloud, sincronizzato con il tuo gestionale e con Google Calendar. Niente da installare: basta un computer o uno smartphone connesso."], ["Sicuro", "I dati di clienti e pazienti sono protetti. Le visite in video sono cifrate e si svolgono tramite un link unico condiviso tra te e il proprietario. Il pagamento avviene online al momento della prenotazione."], ["Accessibile", "Resta in contatto con clienti e animali a distanza, anche in vacanza o in viaggio, e guadagna visibilità online."]],
    diffH: "Teleconsiglio o televisita: che differenza c'è?",
    diffTa: ["Teleconsiglio veterinario", "Informazioni generali sulla salute degli animali, non personalizzate. Non dà luogo a una diagnosi né a una prescrizione personalizzate."],
    diffTc: ["Televisita veterinaria", "Un atto veterinario a distanza che può portare a una diagnosi e a una prescrizione. In Francia è regolamentata dall'Ordine dei veterinari e dal ministero dell'Agricoltura, ed è in sperimentazione da maggio 2020."],
    regH: "Televisita in Francia: cosa sapere",
    regIntro: "La televisita veterinaria è rigorosamente regolamentata. Ecco cosa verificare prima di offrirla; consulta sempre il sito dell'Ordine per le regole in vigore.",
    regPts: ["Designare un veterinario referente per la sperimentazione presso l'Ordine", "Dichiarare la sede dell'attività (DPE) con il modulo dell'Ordine", "Informare la tua assicurazione di responsabilità civile professionale (RCP)", "Verificare le condizioni generali di funzionamento delle strutture veterinarie (CGFESV)"],
    regCond: ["Solo i veterinari iscritti all'Ordine in Francia possono praticarla sul territorio francese", "Riguarda i tuoi pazienti: animali che hai visitato nella tua sede negli ultimi 12 mesi", "Non è consentita quando la prognosi medica è a rischio", "Qualsiasi strumento di pagamento è ammesso, purché protegga i dati personali e bancari del cliente"],
    regNote: "Queste regole riguardano la Francia. Negli altri paesi la normativa è diversa.",
    rxH: "Consegnare una prescrizione dopo una televisita", rxP: "Quando viene emessa una prescrizione, deve arrivare al cliente entro 10 giorni:",
    rxPts: ["invio per posta o in forma elettronica", "ritiro della prescrizione in clinica", "invio del medicinale in un pacco sigillato e opaco"],
    free: "L'iscrizione è gratuita e senza impegno.",
    moreFaq: [["Che differenza c'è tra teleconsiglio e televisita?", "Il teleconsiglio dà informazioni generali, senza diagnosi né prescrizioni personalizzate. La televisita è un atto veterinario a distanza, regolamentato, che può portare a una diagnosi e a una prescrizione."], ["Chi può fare una televisita e con quale metodo di pagamento?", "In Francia solo i veterinari iscritti all'Ordine. Qualsiasi strumento di pagamento è ammesso se protegge i dati del cliente; su Televet si può anche pagare online al momento della prenotazione."], ["Come si consegna una prescrizione?", "Entro 10 giorni: invio postale o elettronico, ritiro in clinica, oppure medicinale spedito in un pacco sigillato e opaco."]],
  },
  en: {
    moreBenefits: [["Innovative", "Use Televet as your online booking tool, or connect it to the booking platform you already use. Clients book when it suits them, day or night."], ["Simple and practical", "Cloud software that syncs with your practice software and Google Calendar. Nothing to install: a connected computer or smartphone is enough."], ["Secure", "Client and patient data is protected. Video consultations are encrypted and run through a unique link shared between you and the owner. Payment is made online at booking."], ["Accessible", "Stay in touch with clients and their pets remotely, even on holiday or on the move, and improve your visibility online."]],
    diffH: "Tele-advice or teleconsultation: what is the difference?",
    diffTa: ["Veterinary tele-advice", "General, non-personalised information about animal health. It does not lead to a personalised diagnosis or prescription."],
    diffTc: ["Veterinary teleconsultation", "A remote veterinary act that can lead to a diagnosis and a prescription. In France it is regulated by the Veterinary Order and the Ministry of Agriculture, and has been in an experimental phase since May 2020."],
    regH: "Teleconsultation in France: what to know",
    regIntro: "Veterinary teleconsultation is strictly regulated. Here is what to check before offering it; always consult the Order's website for the rules currently in force.",
    regPts: ["Name a referent vet for the trial with the Order", "Register your practice location (DPE) through the Order's form", "Notify your professional liability insurer (RCP)", "Check the general operating conditions for veterinary establishments (CGFESV)"],
    regCond: ["Only vets registered with the Order in France may practise it on French territory", "It covers your own patients: animals you have examined at your practice within the past 12 months", "It is not permitted when the medical prognosis is at risk", "Any payment tool is allowed, provided the client's personal and banking data is secure"],
    regNote: "These rules apply to France. Other countries have different regulations.",
    rxH: "Issuing a prescription after a teleconsultation", rxP: "When a prescription is issued, it must reach the client within 10 days:",
    rxPts: ["sent by post or electronically", "collected by the client at the clinic", "medication sent in a sealed, opaque parcel"],
    free: "Sign-up is free, with no commitment.",
    moreFaq: [["What is the difference between tele-advice and teleconsultation?", "Tele-advice gives general information, with no personalised diagnosis or prescription. Teleconsultation is a regulated remote veterinary act that can lead to a diagnosis and a prescription."], ["Who can carry out a teleconsultation, and with which payment method?", "In France, only vets registered with the Order. Any payment tool is allowed if it keeps the client's data secure; on Televet the owner can also pay online when booking."], ["How is a prescription delivered?", "Within 10 days: by post or electronically, collected at the clinic, or medication sent in a sealed, opaque parcel."]],
  },
  es: {
    moreBenefits: [["Innovador", "Usa Televet como herramienta de reserva en línea, o conéctalo a la plataforma de reservas que ya utilizas. Tus clientes reservan cuando les conviene, de día o de noche."], ["Sencillo y práctico", "Un software en la nube, sincronizado con tu programa de gestión y con Google Calendar. No hay nada que instalar: basta un ordenador o un smartphone conectado."], ["Seguro", "Los datos de clientes y pacientes están protegidos. Las consultas por video están cifradas y se realizan mediante un enlace único compartido entre tú y el dueño. El pago se hace en línea al reservar."], ["Accesible", "Mantén el contacto con tus clientes y sus mascotas a distancia, incluso de vacaciones o de viaje, y gana visibilidad en línea."]],
    diffH: "Teleconsejo o teleconsulta: ¿qué diferencia hay?",
    diffTa: ["Teleconsejo veterinario", "Información general sobre la salud animal, no personalizada. No da lugar a un diagnóstico ni a una receta personalizados."],
    diffTc: ["Teleconsulta veterinaria", "Un acto veterinario a distancia que puede llevar a un diagnóstico y a una receta. En Francia está regulada por el Colegio de Veterinarios y el Ministerio de Agricultura, y se experimenta desde mayo de 2020."],
    regH: "Teleconsulta en Francia: lo que hay que saber",
    regIntro: "La teleconsulta veterinaria está estrictamente regulada. Esto es lo que conviene comprobar antes de ofrecerla; consulta siempre la web del Colegio para conocer las normas vigentes.",
    regPts: ["Designar un veterinario referente para la experimentación ante el Colegio", "Declarar tu lugar de ejercicio (DPE) con el formulario del Colegio", "Informar a tu aseguradora de responsabilidad civil profesional (RCP)", "Comprobar las condiciones generales de funcionamiento de los establecimientos veterinarios (CGFESV)"],
    regCond: ["Solo los veterinarios inscritos en el Colegio en Francia pueden practicarla en territorio francés", "Se limita a tus propios pacientes: animales que has examinado en tu centro en los últimos 12 meses", "No está permitida cuando el pronóstico médico está en riesgo", "Se admite cualquier medio de pago, siempre que proteja los datos personales y bancarios del cliente"],
    regNote: "Estas normas se aplican a Francia. En otros países la normativa es distinta.",
    rxH: "Entregar una receta tras una teleconsulta", rxP: "Cuando se emite una receta, debe llegar al cliente en un plazo de 10 días:",
    rxPts: ["envío por correo postal o por vía electrónica", "recogida de la receta en la clínica", "envío del medicamento en un paquete sellado y opaco"],
    free: "El registro es gratuito y sin compromiso.",
    moreFaq: [["¿Qué diferencia hay entre teleconsejo y teleconsulta?", "El teleconsejo da información general, sin diagnóstico ni receta personalizados. La teleconsulta es un acto veterinario a distancia, regulado, que puede llevar a un diagnóstico y a una receta."], ["¿Quién puede hacer una teleconsulta y con qué medio de pago?", "En Francia, solo los veterinarios inscritos en el Colegio. Se admite cualquier medio de pago si protege los datos del cliente; en Televet el dueño también puede pagar en línea al reservar."], ["¿Cómo se entrega una receta?", "En un plazo de 10 días: envío postal o electrónico, recogida en la clínica, o medicamento enviado en un paquete sellado y opaco."]],
  },
  pl: {
    moreBenefits: [["Innowacyjnie", "Używaj Televet jako narzędzia do rezerwacji online albo połącz go z platformą rezerwacji, z której już korzystasz. Klienci rezerwują, kiedy im pasuje, w dzień i w nocy."], ["Prosto i praktycznie", "Oprogramowanie w chmurze, zsynchronizowane z Twoim programem gabinetowym i Kalendarzem Google. Nic nie trzeba instalować: wystarczy komputer lub smartfon z internetem."], ["Bezpiecznie", "Dane klientów i pacjentów są chronione. Konsultacje wideo są szyfrowane i odbywają się przez unikalny link wspólny dla Ciebie i opiekuna. Płatność następuje online przy rezerwacji."], ["Dostępnie", "Utrzymuj kontakt z klientami i ich zwierzętami na odległość, także na urlopie czy w podróży, i zwiększ swoją widoczność w sieci."]],
    diffH: "Teleporada czy telekonsultacja: jaka jest różnica?",
    diffTa: ["Teleporada weterynaryjna", "Ogólne, niespersonalizowane informacje o zdrowiu zwierząt. Nie prowadzi do spersonalizowanej diagnozy ani recepty."],
    diffTc: ["Telekonsultacja weterynaryjna", "Zdalna czynność weterynaryjna, która może prowadzić do diagnozy i recepty. We Francji podlega nadzorowi Izby Weterynaryjnej i Ministerstwa Rolnictwa i jest testowana od maja 2020 r."],
    regH: "Telekonsultacja we Francji: co warto wiedzieć",
    regIntro: "Telekonsultacja weterynaryjna jest ściśle uregulowana. Oto, co sprawdzić, zanim zaczniesz ją oferować; zawsze zajrzyj na stronę Izby, by poznać obowiązujące przepisy.",
    regPts: ["Wyznaczyć weterynarza referenta eksperymentu w Izbie", "Zgłosić miejsce wykonywania zawodu (DPE) formularzem Izby", "Poinformować ubezpieczyciela od odpowiedzialności cywilnej zawodowej (RCP)", "Sprawdzić ogólne warunki funkcjonowania zakładów weterynaryjnych (CGFESV)"],
    regCond: ["Tylko weterynarze wpisani do Izby we Francji mogą ją prowadzić na terytorium Francji", "Dotyczy Twoich własnych pacjentów: zwierząt, które badałeś w swoim gabinecie w ciągu ostatnich 12 miesięcy", "Nie jest dozwolona, gdy rokowanie medyczne jest zagrożone", "Dozwolone jest każde narzędzie płatności, o ile zabezpiecza dane osobowe i bankowe klienta"],
    regNote: "Te zasady dotyczą Francji. W innych krajach przepisy są inne.",
    rxH: "Wydanie recepty po telekonsultacji", rxP: "Wystawiona recepta musi dotrzeć do klienta w ciągu 10 dni:",
    rxPts: ["wysłana pocztą lub elektronicznie", "odebrana przez klienta w klinice", "lek wysłany w zaklejonej, nieprzezroczystej paczce"],
    free: "Rejestracja jest bezpłatna i do niczego nie zobowiązuje.",
    moreFaq: [["Jaka jest różnica między teleporadą a telekonsultacją?", "Teleporada daje ogólne informacje, bez spersonalizowanej diagnozy ani recepty. Telekonsultacja to uregulowana zdalna czynność weterynaryjna, która może prowadzić do diagnozy i recepty."], ["Kto może przeprowadzić telekonsultację i jaką metodą płatności?", "We Francji tylko weterynarze wpisani do Izby. Dozwolone jest każde narzędzie płatności zabezpieczające dane klienta; w Televet opiekun może też zapłacić online przy rezerwacji."], ["Jak wydać receptę?", "W ciągu 10 dni: pocztą lub elektronicznie, odbiór w klinice albo lek w zaklejonej, nieprzezroczystej paczce."]],
  },
};
PRO_X["es-AR"] = voseo(PRO_X.es);
