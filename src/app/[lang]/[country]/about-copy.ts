/** Long-form home copy (about, mission, specialties, FAQ, contact). Prices and regulatory claims are deliberately not asserted here. */
export type AboutTxt = {
  aboutH: string; about: string[]; missionH: string; mission: string[]; missionPts: string[];
  specH: string; specLead: string; spec: { t: string; d: string }[];
  faqH: string; faq: { q: string; a: string }[];
  contactH: string; contactP: string; contactBtn: string; place: string;
};
export const ABOUT: Record<string, AboutTxt> = {
  fr: {
    aboutH: "Leur bien-être, notre passion",
    about: [
      "Televet est née d'un constat simple : emmener un animal chez le vétérinaire peut être compliqué, stressant et parfois impossible. Un chat qui panique dans sa caisse de transport, un chien âgé qui ne supporte plus la voiture, un foyer avec plusieurs animaux, un week-end sans cabinet ouvert à proximité… Nous voulons rendre le soin vétérinaire plus accessible, plus doux et plus humain.",
      "Nous rassemblons sur une même plateforme des vétérinaires diplômés qui se déplacent à domicile, répondent en visioconférence ou reçoivent en cabinet. Vous choisissez le format qui convient à votre animal, vous réservez en ligne en quelques clics, puis vous recevez un compte-rendu écrit après la consultation.",
      "Notre équipe est basée à Station F, à Paris, et travaille main dans la main avec des vétérinaires et des cliniques pour construire un service fiable, simple à utiliser et respectueux de l'animal comme de son propriétaire.",
    ],
    missionH: "Notre mission : des soins de qualité, au plus près de vous",
    mission: [
      "Nous croyons qu'un animal soigné dans son environnement est un animal moins stressé, et que des propriétaires bien informés prennent de meilleures décisions pour la santé de leur compagnon.",
      "Chaque vétérinaire présent sur Televet est un professionnel diplômé, et nos vétérinaires partenaires en France respectent les règles de l'Ordre national des vétérinaires dans le cadre du décret n°2020-526 du 5 mai 2020 relatif à l'expérimentation de la télémédecine vétérinaire. Conformément à ce cadre, aucune prescription ni aucun diagnostic n'est établi à distance en France. La téléconsultation ne remplace pas un examen clinique lorsqu'il est nécessaire : le vétérinaire vous le dit et vous oriente vers la bonne solution, y compris en urgence.",
    ],
    missionPts: ["Des vétérinaires diplômés, identifiés et présentés avec leurs spécialités", "Un parcours de réservation simple, sans appel ni attente", "Un compte-rendu écrit après chaque consultation", "Une orientation claire vers une clinique en cas d'urgence"],
    specH: "Des spécialités pour tous les besoins",
    specLead: "Quel que soit votre animal, retrouvez un vétérinaire qui connaît bien son espèce et ses besoins.",
    spec: [
      { t: "Téléconseil d'urgence", d: "Un doute, un symptôme inquiétant, une situation qui vous stresse : des vétérinaires qui font le tri répondent en visio pour chiens, chats et autres petits animaux, et vous disent s'il faut consulter en urgence ou si vous pouvez attendre." },
      { t: "Nutrition", d: "Ration adaptée à l'âge, à la race et à l'état de santé, surpoids, allergies alimentaires, croquettes ou ration ménagère : un plan alimentaire clair et un suivi dans la durée." },
      { t: "Comportement", d: "Anxiété de séparation, aboiements, malpropreté, agressivité, peurs : comprendre l'origine du problème et mettre en place des solutions concrètes avec un vétérinaire formé au comportement." },
      { t: "Naturopathie", d: "Une approche complémentaire pour accompagner votre animal au quotidien : hygiène de vie, alimentation, confort et prévention, en complément du suivi vétérinaire." },
      { t: "NAC", d: "Lapins, furets, oiseaux, poissons rouges et autres nouveaux animaux de compagnie : des vétérinaires qui connaissent leurs particularités, souvent mal prises en charge près de chez soi." },
      { t: "Équin", d: "Chevaux et ânes : conseils, suivi et orientation à distance, pour gagner du temps et éviter des déplacements quand ils ne sont pas nécessaires." },
    ],
    faqH: "Questions fréquentes",
    faq: [
      { q: "Comment fonctionne un vétérinaire à domicile ?", a: "Vous réservez un créneau en ligne, indiquez votre adresse et le motif de la consultation. Le vétérinaire se déplace avec son matériel, examine votre animal chez vous et vous remet un compte-rendu écrit." },
      { q: "Qu'est-ce qu'une téléconsultation vétérinaire ?", a: "C'est une consultation en visio avec un vétérinaire diplômé. Elle convient pour un avis rapide, un suivi, des conseils ou pour décider si une visite physique est nécessaire. Elle ne remplace pas un examen clinique lorsque celui-ci est indispensable." },
      { q: "Quand dois-je plutôt aller en clinique ou aux urgences ?", a: "En cas de difficulté à respirer, de saignement important, de traumatisme, de convulsions, d'ingestion de produit toxique ou de forte douleur, contactez immédiatement une clinique d'urgence. Une téléconsultation n'est pas adaptée à ces situations." },
      { q: "Quels animaux peuvent être pris en charge ?", a: "Chiens, chats, lapins, rongeurs, oiseaux et reptiles. Les compétences varient selon les vétérinaires : consultez leur profil pour connaître les espèces prises en charge." },
      { q: "Comment réserver et comment suis-je prévenu ?", a: "La réservation se fait en ligne en quelques clics. Vous recevez une confirmation et des rappels par e-mail, puis un compte-rendu après la consultation." },
      { q: "Je suis vétérinaire : comment rejoindre Televet ?", a: "Créez votre espace vétérinaire, renseignez votre profil, vos disponibilités et vos services. Vous recevez ensuite des réservations de propriétaires de votre secteur." },
    ],
    contactH: "Une question ? Écrivez-nous", contactP: "Notre équipe vous répond par e-mail dans les meilleurs délais.", contactBtn: "Nous écrire", place: "Station F, Paris",
  },
  it: {
    aboutH: "Il loro benessere, la nostra passione",
    about: [
      "Televet nasce da un'osservazione semplice: portare un animale dal veterinario può essere complicato, stressante e a volte impossibile. Un gatto che si agita nel trasportino, un cane anziano che non sopporta più l'auto, una casa con più animali, un fine settimana senza ambulatori aperti vicino a te… Vogliamo rendere la cura veterinaria più accessibile, più dolce e più umana.",
      "Riuniamo su un'unica piattaforma veterinari abilitati che vengono a casa, rispondono in videochiamata o ricevono in ambulatorio. Scegli il formato più adatto al tuo animale, prenoti online in pochi clic e dopo la visita ricevi un referto scritto.",
      "Il nostro team ha sede a Station F, a Parigi, e lavora insieme a veterinari e cliniche per costruire un servizio affidabile, semplice da usare e rispettoso sia dell'animale sia di chi se ne prende cura.",
    ],
    missionH: "La nostra missione: cure di qualità, vicino a te",
    mission: [
      "Crediamo che un animale curato nel proprio ambiente sia meno stressato, e che proprietari ben informati prendano decisioni migliori per la salute del loro compagno.",
      "Ogni veterinario presente su Televet è un professionista abilitato, e i nostri veterinari partner in Francia rispettano le regole dell'Ordine nazionale dei veterinari nell'ambito del decreto n°2020-526 del 5 maggio 2020 sulla sperimentazione della telemedicina veterinaria. In questo quadro, in Francia non vengono fatte prescrizioni né diagnosi a distanza. La televisita non sostituisce la visita clinica quando questa è necessaria: il veterinario te lo dice e ti indirizza verso la soluzione giusta, anche in urgenza.",
    ],
    missionPts: ["Veterinari abilitati, identificati e presentati con le loro specialità", "Una prenotazione semplice, senza telefonate né attese", "Un referto scritto dopo ogni visita", "Un'indicazione chiara per rivolgersi a una clinica in caso di urgenza"],
    specH: "Specialità per ogni esigenza",
    specLead: "Qualunque sia il tuo animale, trova un veterinario che conosce bene la sua specie e le sue esigenze.",
    spec: [
      { t: "Teleconsulto d'urgenza", d: "Un dubbio, un sintomo preoccupante, una situazione che ti agita: veterinari che fanno il triage rispondono in video per cani, gatti e altri piccoli animali e ti dicono se serve una visita urgente o se puoi aspettare." },
      { t: "Alimentazione", d: "Razione adatta a età, razza e stato di salute, sovrappeso, allergie alimentari, crocchette o dieta casalinga: un piano alimentare chiaro e un controllo nel tempo." },
      { t: "Comportamento", d: "Ansia da separazione, abbaiare, pulizia, aggressività, paure: capire l'origine del problema e trovare soluzioni concrete con un veterinario formato sul comportamento." },
      { t: "Naturopatia", d: "Un approccio complementare per accompagnare il tuo animale ogni giorno: stile di vita, alimentazione, comfort e prevenzione, in aggiunta al controllo veterinario." },
      { t: "Animali esotici (NAC)", d: "Conigli, furetti, uccelli, pesci rossi e altri nuovi animali da compagnia: veterinari che ne conoscono le particolarità, spesso difficili da trovare vicino a casa." },
      { t: "Equini", d: "Cavalli e asini: consigli, controllo e orientamento a distanza, per risparmiare tempo ed evitare spostamenti quando non servono." },
    ],
    faqH: "Domande frequenti",
    faq: [
      { q: "Come funziona il veterinario a domicilio?", a: "Prenoti un orario online, indichi l'indirizzo e il motivo della visita. Il veterinario arriva con la sua attrezzatura, visita l'animale a casa tua e ti consegna un referto scritto." },
      { q: "Che cos'è una televisita veterinaria?", a: "È una visita in videochiamata con un veterinario abilitato. È adatta per un parere rapido, un controllo, consigli o per capire se serve una visita di persona. Non sostituisce la visita clinica quando questa è indispensabile." },
      { q: "Quando devo andare in clinica o al pronto soccorso?", a: "In caso di difficoltà respiratorie, forte sanguinamento, trauma, convulsioni, ingestione di sostanze tossiche o dolore intenso, contatta subito una clinica d'urgenza. La televisita non è adatta a queste situazioni." },
      { q: "Quali animali si possono curare?", a: "Cani, gatti, conigli, roditori, uccelli e rettili. Le competenze variano da veterinario a veterinario: consulta il profilo per sapere quali specie segue." },
      { q: "Come si prenota e come vengo avvisato?", a: "La prenotazione si fa online in pochi clic. Ricevi conferma e promemoria via e-mail, poi un referto dopo la visita." },
      { q: "Sono un veterinario: come entro in Televet?", a: "Crea la tua area veterinari, compila profilo, disponibilità e servizi. Riceverai poi prenotazioni da proprietari della tua zona." },
    ],
    contactH: "Una domanda? Scrivici", contactP: "Il nostro team ti risponde via e-mail il prima possibile.", contactBtn: "Scrivici", place: "Station F, Parigi",
  },
  en: {
    aboutH: "Their wellbeing, our passion",
    about: [
      "Televet started from a simple observation: taking a pet to the vet can be complicated, stressful and sometimes impossible. A cat that panics in its carrier, an elderly dog that can no longer cope with the car, a home with several animals, a weekend with no clinic open nearby. We want veterinary care to be more accessible, gentler and more human.",
      "We bring together, on one platform, qualified vets who visit you at home, answer by video call or see you at their clinic. You choose the format that suits your pet, book online in a few clicks, and receive a written report after the consultation.",
      "Our team is based at Station F in Paris and works closely with vets and clinics to build a service that is reliable, easy to use and respectful of both pets and their owners.",
    ],
    missionH: "Our mission: quality care, close to you",
    mission: [
      "We believe a pet cared for in its own environment is a calmer pet, and that well-informed owners make better decisions for their companion's health.",
      "Every vet on Televet is a qualified professional, and our partner vets in France follow the rules of the French Veterinary Order under decree no. 2020-526 of 5 May 2020 on veterinary telemedicine trials. Under that framework, no prescriptions or diagnoses are made remotely in France. Online consultations do not replace a physical examination when one is needed: the vet will tell you and point you to the right solution, including in an emergency.",
    ],
    missionPts: ["Qualified vets, identified and presented with their specialties", "Simple booking: no phone calls, no waiting", "A written report after every consultation", "Clear guidance to a clinic when it is an emergency"],
    specH: "Specialties for every need",
    specLead: "Whatever your pet, find a vet who knows its species and its needs.",
    spec: [
      { t: "Emergency tele-advice", d: "A worry, a concerning symptom, a stressful moment: triage vets answer by video for dogs, cats and other small pets, and tell you whether you need urgent care or can wait." },
      { t: "Nutrition", d: "A diet suited to age, breed and health, weight, food allergies, kibble or home-prepared meals: a clear feeding plan and follow-up over time." },
      { t: "Behaviour", d: "Separation anxiety, barking, house-training, aggression, fears: understand where the problem comes from and put practical solutions in place with a behaviour-trained vet." },
      { t: "Naturopathy", d: "A complementary approach to support your pet day to day: lifestyle, diet, comfort and prevention, alongside regular veterinary care." },
      { t: "Small and exotic pets", d: "Rabbits, ferrets, birds, goldfish and other newer companion animals: vets who know their particular needs, often hard to find locally." },
      { t: "Equine", d: "Horses and donkeys: advice, follow-up and guidance remotely, saving time and avoiding call-outs when they are not needed." },
    ],
    faqH: "Frequently asked questions",
    faq: [
      { q: "How does a home-visit vet work?", a: "You book a slot online and give your address and the reason for the visit. The vet comes with their equipment, examines your pet at home and gives you a written report." },
      { q: "What is an online vet consultation?", a: "A video consultation with a qualified vet. It suits a quick opinion, follow-up care, advice, or deciding whether an in-person visit is needed. It does not replace a physical examination when one is essential." },
      { q: "When should I go to a clinic or emergency vet instead?", a: "For breathing difficulty, heavy bleeding, trauma, seizures, ingestion of something toxic or severe pain, contact an emergency clinic straight away. An online consultation is not suitable for these." },
      { q: "Which animals can be seen?", a: "Dogs, cats, rabbits, rodents, birds and reptiles. Skills vary by vet, so check each profile to see which species they treat." },
      { q: "How do I book and how will I be notified?", a: "Booking takes a few clicks online. You get a confirmation and email reminders, then a report after the consultation." },
      { q: "I'm a vet: how do I join Televet?", a: "Create your vet account, fill in your profile, availability and services. You will then receive bookings from owners in your area." },
    ],
    contactH: "Questions? Write to us", contactP: "Our team replies by email as soon as possible.", contactBtn: "Contact us", place: "Station F, Paris",
  },
  es: {
    aboutH: "Su bienestar, nuestra pasión",
    about: [
      "Televet nace de una observación sencilla: llevar a un animal al veterinario puede ser complicado, estresante y a veces imposible. Un gato que entra en pánico en su transportín, un perro mayor que ya no tolera el coche, un hogar con varios animales, un fin de semana sin clínica abierta cerca… Queremos que la atención veterinaria sea más accesible, más amable y más humana.",
      "Reunimos en una sola plataforma a veterinarios titulados que van a tu casa, atienden por videollamada o reciben en clínica. Eliges el formato que mejor encaja con tu mascota, reservas en línea en pocos clics y recibes un informe por escrito tras la consulta.",
      "Nuestro equipo tiene su sede en Station F, en París, y trabaja junto a veterinarios y clínicas para construir un servicio fiable, fácil de usar y respetuoso con los animales y con quienes los cuidan.",
    ],
    missionH: "Nuestra misión: atención de calidad, cerca de ti",
    mission: [
      "Creemos que un animal atendido en su propio entorno está más tranquilo, y que unos dueños bien informados toman mejores decisiones para la salud de su compañero.",
      "Cada veterinario de Televet es un profesional titulado, y nuestros veterinarios asociados en Francia respetan las normas del Colegio Nacional de Veterinarios en el marco del decreto n.º 2020-526 de 5 de mayo de 2020 sobre la experimentación de la telemedicina veterinaria. Con este marco, en Francia no se hacen recetas ni diagnósticos a distancia. La teleconsulta no sustituye la exploración clínica cuando es necesaria: el veterinario te lo dirá y te orientará hacia la solución adecuada, también en una urgencia.",
    ],
    missionPts: ["Veterinarios titulados, identificados y presentados con sus especialidades", "Reserva sencilla, sin llamadas ni esperas", "Un informe escrito después de cada consulta", "Orientación clara hacia una clínica en caso de urgencia"],
    specH: "Especialidades para cada necesidad",
    specLead: "Sea cual sea tu mascota, encuentra un veterinario que conozca bien su especie y sus necesidades.",
    spec: [
      { t: "Teleconsejo de urgencia", d: "Una duda, un síntoma preocupante, un momento de estrés: veterinarios que hacen triaje responden por video para perros, gatos y otros animales pequeños, y te dicen si necesitas atención urgente o puedes esperar." },
      { t: "Nutrición", d: "Alimentación adaptada a la edad, la raza y la salud, sobrepeso, alergias alimentarias, pienso o dieta casera: un plan claro y seguimiento en el tiempo." },
      { t: "Comportamiento", d: "Ansiedad por separación, ladridos, higiene, agresividad, miedos: entender el origen del problema y aplicar soluciones concretas con un veterinario formado en comportamiento." },
      { t: "Naturopatía", d: "Un enfoque complementario para acompañar a tu mascota a diario: estilo de vida, alimentación, confort y prevención, junto al seguimiento veterinario." },
      { t: "Animales exóticos (NAC)", d: "Conejos, hurones, aves, peces de colores y otras mascotas menos habituales: veterinarios que conocen sus particularidades, difíciles de encontrar cerca de casa." },
      { t: "Equinos", d: "Caballos y burros: consejos, seguimiento y orientación a distancia, para ahorrar tiempo y evitar desplazamientos cuando no hacen falta." },
    ],
    faqH: "Preguntas frecuentes",
    faq: [
      { q: "¿Cómo funciona un veterinario a domicilio?", a: "Reservas una hora en línea e indicas tu dirección y el motivo de la consulta. El veterinario acude con su material, examina a tu mascota en casa y te entrega un informe por escrito." },
      { q: "¿Qué es una teleconsulta veterinaria?", a: "Es una consulta por videollamada con un veterinario titulado. Sirve para una opinión rápida, un seguimiento, consejos o para decidir si hace falta una visita presencial. No sustituye la exploración clínica cuando es imprescindible." },
      { q: "¿Cuándo debo ir a una clínica o a urgencias?", a: "Ante dificultad para respirar, hemorragia importante, traumatismo, convulsiones, ingestión de tóxicos o dolor intenso, acude de inmediato a una clínica de urgencias. La teleconsulta no es adecuada en estos casos." },
      { q: "¿Qué animales se atienden?", a: "Perros, gatos, conejos, roedores, aves y reptiles. Las competencias varían según el veterinario: consulta su perfil para saber qué especies trata." },
      { q: "¿Cómo reservo y cómo me avisan?", a: "La reserva se hace en línea en pocos clics. Recibes confirmación y recordatorios por correo, y después un informe de la consulta." },
      { q: "Soy veterinario: ¿cómo me uno a Televet?", a: "Crea tu espacio de veterinario, completa tu perfil, disponibilidad y servicios. Después recibirás reservas de dueños de tu zona." },
    ],
    contactH: "¿Dudas? Escríbenos", contactP: "Nuestro equipo responde por correo lo antes posible.", contactBtn: "Escríbenos", place: "Station F, París",
  },
};
