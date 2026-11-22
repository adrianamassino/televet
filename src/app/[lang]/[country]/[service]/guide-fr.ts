/**
 * French guide content for the two services Televet puts first (video and home visits).
 * Written as plain facts about how the service works on Televet; no medical claims, no invented prices or vets.
 * Shown on /fr/fr/{service} under the list of vets, and enough on its own for the page to be useful.
 */
type Guide = { lead: string; title: string; sections: { h: string; p?: string; li?: string[] }[]; steps: string[]; faq: { q: string; a: string }[]; cities?: boolean };
export const GUIDE_FR: Partial<Record<"video" | "home", Guide>> = {
  video: {
    title: "Téléconsultation et téléconseil vétérinaire en visio, à partir de 20 €",
    lead: "Un vétérinaire en quelques minutes, sans déplacement ni application à télécharger. Le téléconseil vous donne des informations générales sur la santé de votre animal avec un vétérinaire partenaire ; la téléconsultation permet de faire consulter votre animal à distance par votre vétérinaire traitant, pour un suivi personnalisé.",
    sections: [
      { h: "Téléconseil vétérinaire", p: "Avec un vétérinaire partenaire de Televet, en visio : informations générales sur la santé animale, orientation (faut-il consulter rapidement ?), alimentation, comportement, prévention. En France, le téléconseil ne donne lieu à aucun diagnostic ni à aucune ordonnance." },
      { h: "Téléconsultation vétérinaire", p: "Avec votre vétérinaire traitant, qui connaît déjà votre animal : suivi après une consultation ou une opération, point sur un traitement, contrôle. Gardez le lien avec votre vétérinaire habituel grâce à la télémédecine vétérinaire." },
      { h: "Nos domaines d'expertise", li: ["Téléconseil vétérinaire d'urgence, par nos vétérinaires télérégulateurs", "Nutrition", "Comportement", "Naturopathie", "NAC : lapin, furet, oiseau, poisson…", "Équin : cheval, âne"] },
      { h: "Simple, sécurisé, 24h/24", li: ["Aucune application à télécharger : la visio s'ouvre depuis un lien", "Lien confidentiel, partagé uniquement entre vous et le vétérinaire", "Paiement sécurisé en ligne par carte", "Prise de rendez-vous en ligne 24h/24"] },
      { h: "Quand il faut aller tout de suite chez un vétérinaire", p: "Difficulté à respirer, saignement important, suspicion d'intoxication, convulsions, ventre gonflé et dur, animal qui ne se lève plus : rendez-vous immédiatement dans une clinique vétérinaire d'urgence. Le téléconseil ne remplace pas l'examen clinique et ne doit jamais retarder des soins urgents." },
    ],
    steps: ["Choisissez téléconseil ou téléconsultation, puis un vétérinaire et un horaire", "Décrivez la situation et ajoutez des photos si besoin", "Payez en ligne : le montant est seulement réservé tant que le vétérinaire n'a pas confirmé", "À l'heure prévue, ouvrez le lien de la visio depuis votre téléphone ou ordinateur"],
    faq: [
      { q: "Combien coûte un téléconseil vétérinaire ?", a: "À partir de 20 €. Chaque vétérinaire fixe son prix, affiché avant la réservation, frais de service compris." },
      { q: "Puis-je obtenir une ordonnance en visio ?", a: "Non pour un téléconseil : en France, aucun diagnostic ni aucune ordonnance n'est établi lors d'un téléconseil vétérinaire. Pour une prescription, votre animal doit être examiné, par exemple lors d'une visite à domicile." },
      { q: "Faut-il installer une application ?", a: "Non. La visio s'ouvre dans le navigateur du téléphone ou de l'ordinateur, à partir du lien reçu." },
      { q: "Que se passe-t-il si le vétérinaire refuse ou annule ?", a: "Le montant réservé sur votre carte est libéré, ou remboursé s'il avait déjà été débité." },
    ],
  },
  home: {
    title: "Vétérinaire à domicile : le vétérinaire vient chez vous",
    lead: "Le vétérinaire se déplace chez vous : votre animal reste dans son environnement, sans transport ni salle d'attente. Pratique pour les animaux stressés, âgés, les portées, plusieurs animaux à la fois, ou si vous ne pouvez pas vous déplacer.",
    sections: [
      { h: "Ce que le vétérinaire peut faire à domicile", li: ["Consultation et examen clinique", "Vaccins, rappels et identification selon le matériel du vétérinaire", "Suivi des animaux âgés ou malades chroniques", "Conseils de prévention : vermifuges, antiparasitaires, alimentation", "Accompagnement de fin de vie dans le calme de la maison"] },
      { h: "Comment savoir si un vétérinaire vient jusqu'à chez vous", p: "Chaque vétérinaire indique sa zone de déplacement (distance autour de son point de départ ou liste de codes postaux). Saisissez votre adresse lors de la réservation : seuls les vétérinaires qui couvrent votre adresse sont proposés, avec un éventuel supplément de déplacement affiché à l'avance." },
      { h: "Le temps de trajet est prévu", p: "Les horaires proposés tiennent compte du trajet du vétérinaire entre deux visites : les rendez-vous sont plus fiables et le vétérinaire arrive à l'heure." },
    ],
    steps: ["Indiquez votre ville ou code postal", "Choisissez un vétérinaire qui se déplace chez vous et un horaire", "Donnez votre adresse et les informations d'accès (code, étage)", "Le vétérinaire reçoit votre adresse avec l'itinéraire et vient au rendez-vous"],
    faq: [
      { q: "Une visite à domicile coûte-t-elle plus cher ?", a: "Le prix est fixé par chaque vétérinaire et affiché avant la réservation, avec un éventuel supplément si vous êtes dans sa zone élargie." },
      { q: "Pour quels animaux ?", a: "Chiens et chats surtout ; certains vétérinaires voient aussi les NAC. Les espèces soignées sont indiquées sur le profil de chaque vétérinaire." },
      { q: "Que faire si personne ne se déplace dans ma ville ?", a: "Essayez la téléconsultation pour un premier avis, ou consultez l'annuaire des cliniques de votre ville." },
    ],
    cities: true,
  },
};
