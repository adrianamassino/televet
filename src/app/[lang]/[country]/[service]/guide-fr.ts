/**
 * French guide content for the two services Televet puts first (video and home visits).
 * Written as plain facts about how the service works on Televet; no medical claims, no invented prices or vets.
 * Shown on /fr/fr/{service} under the list of vets, and enough on its own for the page to be useful.
 */
type Guide = { lead: string; title: string; sections: { h: string; p?: string; li?: string[] }[]; steps: string[]; faq: { q: string; a: string }[]; cities?: boolean };
export const GUIDE_FR: Partial<Record<"video" | "home", Guide>> = {
  video: {
    title: "Téléconsultation vétérinaire : consulter un vétérinaire en visio",
    lead: "Un vétérinaire vous répond en vidéo, depuis chez vous, sans transport ni salle d'attente. Idéal pour un premier avis, un suivi ou une question sur la santé, l'alimentation ou le comportement de votre animal.",
    sections: [
      { h: "Quand la téléconsultation est utile", li: ["Un premier avis sur un symptôme récent (démangeaisons, perte d'appétit, petite boiterie, troubles digestifs légers)", "Le suivi après une opération ou un traitement", "Les questions d'alimentation, de poids, de comportement ou d'éducation", "Un animal stressé par le transport ou un propriétaire qui ne peut pas se déplacer", "Savoir s'il faut consulter en personne, et avec quelle urgence"] },
      { h: "Téléconseil ou téléconsultation ?", p: "Le téléconseil est un échange d'informations et d'orientation : le vétérinaire vous conseille sans poser de diagnostic. La téléconsultation est un acte vétérinaire à distance, encadré par la réglementation : selon la situation, le vétérinaire peut poser un diagnostic, et parfois prescrire, s'il estime disposer d'assez d'éléments. Chaque vétérinaire indique sur Televet ce qu'il propose." },
      { h: "Quand il faut aller tout de suite chez un vétérinaire", p: "Difficulté à respirer, saignement important, suspicion d'intoxication, convulsions, ventre gonflé et dur, animal qui ne se lève plus : rendez-vous immédiatement dans une clinique vétérinaire d'urgence. Une consultation en ligne ne doit jamais retarder des soins urgents." },
    ],
    steps: ["Choisissez un vétérinaire et un horaire libre", "Décrivez la situation et ajoutez des photos si besoin", "Payez en ligne : le montant est seulement réservé tant que le vétérinaire n'a pas confirmé", "À l'heure prévue, rejoignez la visio depuis votre téléphone ou ordinateur, sans rien installer"],
    faq: [
      { q: "Faut-il installer une application pour la visio ?", a: "Non. La visio s'ouvre dans le navigateur du téléphone ou de l'ordinateur à partir du lien reçu par e-mail ou depuis votre espace Televet." },
      { q: "Combien coûte une téléconsultation ?", a: "Chaque vétérinaire fixe son prix, affiché avant la réservation, frais de service compris. Vous ne payez rien de plus." },
      { q: "Que se passe-t-il si le vétérinaire refuse ou annule ?", a: "Le montant réservé sur votre carte est libéré, ou remboursé s'il avait déjà été débité." },
      { q: "Le vétérinaire peut-il prescrire un médicament à distance ?", a: "Cela dépend de la situation et de ce que le vétérinaire peut évaluer en vidéo. S'il estime qu'un examen est nécessaire, il vous orientera vers une consultation en personne." },
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
