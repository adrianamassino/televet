/**
 * Televet catalogue of consultations: one shared list so that every vet names the same consultation the same way,
 * and the name is shown in the visitor's language. Pure module (browser, server, tests).
 *
 * services.catalog_code holds the code of the chosen entry; services.custom_name stays empty for a catalogue entry
 * (the name then follows the visitor's language). A vet can still write a consultation in their own words: catalog_code
 * "custom" + custom_name, shown as written.
 *
 * Each entry: code, category, ways it can be done (v video, h home, c clinic, e vet-to-vet), usual minutes,
 * names "en|fr|it|es|pt|de|pl|nl", optional extra search words (any language), optional animals it concerns.
 */
export const CONSULT_LANGS = ["en", "fr", "it", "es", "pt", "de", "pl", "nl"] as const;
export type Mode = "video" | "home" | "clinic" | "expertise";
const MODE: Record<string, Mode> = { v: "video", h: "home", c: "clinic", e: "expertise" };

export interface Consult { code: string; category: string; modes: Mode[]; minutes: number; names: Record<string, string>; words: string; species?: string[] }

const CATS_RAW: [string, string][] = [
  ["general", "General consultations|Consultations générales|Visite generali|Consultas generales|Consultas gerais|Allgemeine Untersuchungen|Konsultacje ogólne|Algemene consulten"],
  ["prevention", "Prevention, vaccines and paperwork|Prévention, vaccins et formalités|Prevenzione, vaccini e documenti|Prevención, vacunas y trámites|Prevenção, vacinas e documentos|Vorsorge, Impfungen und Dokumente|Profilaktyka, szczepienia i dokumenty|Preventie, vaccinaties en papieren"],
  ["behaviour", "Behaviour and education|Comportement et éducation|Comportamento ed educazione|Comportamiento y educación|Comportamento e educação|Verhalten und Erziehung|Zachowanie i wychowanie|Gedrag en opvoeding"],
  ["nutrition", "Nutrition|Nutrition|Nutrizione|Nutrición|Nutrição|Ernährung|Żywienie|Voeding"],
  ["skin", "Skin, ears and eyes|Peau, oreilles et yeux|Pelle, orecchie e occhi|Piel, oídos y ojos|Pele, ouvidos e olhos|Haut, Ohren und Augen|Skóra, uszy i oczy|Huid, oren en ogen"],
  ["dental", "Teeth|Dents|Denti|Dientes|Dentes|Zähne|Zęby|Gebit"],
  ["medicine", "Internal medicine|Médecine interne|Medicina interna|Medicina interna|Medicina interna|Innere Medizin|Choroby wewnętrzne|Interne geneeskunde"],
  ["mobility", "Mobility and pain|Mobilité et douleur|Mobilità e dolore|Movilidad y dolor|Mobilidade e dor|Bewegung und Schmerz|Ruch i ból|Beweging en pijn"],
  ["reproduction", "Reproduction|Reproduction|Riproduzione|Reproducción|Reprodução|Fortpflanzung|Rozród|Voortplanting"],
  ["surgery", "Surgery|Chirurgie|Chirurgia|Cirugía|Cirurgia|Chirurgie|Chirurgia|Chirurgie"],
  ["diagnostics", "Tests and imaging|Examens et imagerie|Esami e diagnostica per immagini|Pruebas e imagen|Exames e imagiologia|Untersuchungen und Bildgebung|Badania i diagnostyka obrazowa|Onderzoeken en beeldvorming"],
  ["care", "Care and treatments|Soins et traitements|Cure e trattamenti|Cuidados y tratamientos|Cuidados e tratamentos|Pflege und Behandlungen|Zabiegi i leczenie|Verzorging en behandelingen"],
  ["emergency", "Emergencies|Urgences|Urgenze|Urgencias|Urgências|Notfälle|Nagłe przypadki|Spoed"],
  ["end_of_life", "End of life|Fin de vie|Fine vita|Final de vida|Fim de vida|Lebensende|Koniec życia|Levenseinde"],
  ["exotic", "Exotic pets (NAC)|NAC (nouveaux animaux de compagnie)|Animali esotici|Animales exóticos|Animais exóticos|Exoten und Heimtiere|Zwierzęta egzotyczne|Exotische dieren"],
  ["equine", "Horses|Chevaux et équidés|Cavalli ed equini|Caballos y equinos|Cavalos e equinos|Pferde|Konie|Paarden"],
  ["farm", "Farm animals|Animaux d'élevage|Animali da allevamento|Animales de granja|Animais de produção|Nutztiere|Zwierzęta gospodarskie|Landbouwhuisdieren"],
  ["vets", "Between vets|Entre vétérinaires|Tra veterinari|Entre veterinarios|Entre veterinários|Unter Tierärzten|Między weterynarzami|Tussen dierenartsen"],
];

const DOG_CAT = ["dog", "cat"], EXOTIC = ["rabbit", "rodent", "small_mammal", "bird", "reptile", "aquatic"], EQ = ["equine"], FARM = ["farm"];

const RAW: [string, string, string, number, string, string?, string[]?][] = [
  // general
  ["general_consult", "general", "vhc", 30, "General consultation|Consultation générale|Visita generica|Consulta general|Consulta geral|Allgemeine Untersuchung|Konsultacja ogólna|Algemeen consult", "visit visite visita check examen"],
  ["first_consult", "general", "hc", 40, "First consultation (new patient)|Première consultation (nouveau patient)|Prima visita (nuovo paziente)|Primera consulta (nuevo paciente)|Primeira consulta (novo paciente)|Erstuntersuchung (neuer Patient)|Pierwsza wizyta (nowy pacjent)|Eerste consult (nieuwe patiënt)"],
  ["followup", "general", "vhc", 20, "Follow-up consultation|Consultation de suivi|Visita di controllo|Consulta de seguimiento|Consulta de acompanhamento|Kontrolluntersuchung|Wizyta kontrolna|Controleconsult", "control controle contrôle recheck"],
  ["second_opinion", "general", "vc", 30, "Second opinion|Deuxième avis|Secondo parere|Segunda opinión|Segunda opinião|Zweitmeinung|Druga opinia|Second opinion"],
  ["advice_call", "general", "v", 15, "Quick vet advice|Téléconseil vétérinaire|Consulenza veterinaria rapida|Consejo veterinario rápido|Aconselhamento veterinário rápido|Kurze tierärztliche Beratung|Szybka porada weterynaryjna|Kort dierenartsadvies", "conseil advice consiglio consejo question domanda pregunta teleconseil"],
  ["results_review", "general", "v", 15, "Test results explained|Explication de résultats d'analyses|Spiegazione degli esami|Explicación de resultados de análisis|Explicação de resultados de análises|Befundbesprechung|Omówienie wyników badań|Bespreking van uitslagen", "analyse bilan resultats lab"],
  ["annual_checkup", "general", "hc", 30, "Annual health check|Bilan de santé annuel|Check-up annuale|Chequeo anual|Check-up anual|Jährlicher Gesundheitscheck|Coroczny przegląd zdrowia|Jaarlijkse gezondheidscheck", "checkup bilan"],
  ["puppy_kitten", "general", "hc", 40, "Puppy or kitten first visit|Première visite chiot ou chaton|Prima visita cucciolo o gattino|Primera visita cachorro o gatito|Primeira consulta cachorro ou gatinho|Welpen- oder Kitten-Erstbesuch|Pierwsza wizyta szczeniaka lub kociaka|Eerste bezoek pup of kitten", "puppy kitten chiot chaton cucciolo gattino cachorro gatito", DOG_CAT],
  ["senior_check", "general", "hc", 40, "Senior pet check-up|Bilan senior|Visita geriatrica|Revisión geriátrica|Check-up sénior|Senioren-Check|Badanie zwierzęcia seniora|Seniorencheck", "old age vieux anziano viejo geriatric"],
  ["pre_purchase", "general", "hc", 45, "Pre-purchase or adoption check|Visite avant achat ou adoption|Visita pre-acquisto o adozione|Revisión antes de compra o adopción|Avaliação antes de compra ou adoção|Ankaufs- oder Adoptionsuntersuchung|Badanie przed zakupem lub adopcją|Aankoop- of adoptiekeuring", "adoption adozione adopcion achat acquisto compra"],
  ["post_op_check", "general", "vhc", 20, "Post-operative check|Contrôle post-opératoire|Controllo post-operatorio|Control postoperatorio|Controlo pós-operatório|Nachkontrolle nach der Operation|Kontrola pooperacyjna|Postoperatieve controle", "operation operazione cicatrice scar"],
  // prevention
  ["vaccination", "prevention", "hc", 20, "Vaccination|Vaccination|Vaccinazione|Vacunación|Vacinação|Impfung|Szczepienie|Vaccinatie", "vaccine vaccin vaccino vacuna rappel booster richiamo refuerzo"],
  ["vaccine_rabies", "prevention", "hc", 20, "Rabies vaccination|Vaccination antirabique|Vaccino antirabbico|Vacuna antirrábica|Vacina antirrábica|Tollwutimpfung|Szczepienie przeciw wściekliźnie|Rabiësvaccinatie", "rage rabbia rabia tollwut"],
  ["microchip", "prevention", "hc", 15, "Microchipping (identification)|Identification par puce électronique|Applicazione del microchip|Implantación de microchip|Colocação de microchip|Chippen (Kennzeichnung)|Czipowanie|Chippen (identificatie)", "puce chip identification tatouage icad anagrafe"],
  ["deworming", "prevention", "vhc", 15, "Worming and flea / tick prevention|Vermifuge et antiparasitaires (puces, tiques)|Sverminazione e antiparassitari (pulci, zecche)|Desparasitación (pulgas, garrapatas)|Desparasitação (pulgas, carraças)|Entwurmung und Floh-/Zeckenschutz|Odrobaczanie i ochrona przed pchłami i kleszczami|Ontworming en vlooien-/tekenpreventie", "vermifuge worms vers vermi parasites pulci zecche puces tiques pulgas garrapatas fleas ticks"],
  ["leishmaniasis", "prevention", "vhc", 20, "Leishmaniasis prevention|Prévention de la leishmaniose|Prevenzione della leishmaniosi|Prevención de la leishmaniosis|Prevenção da leishmaniose|Leishmaniose-Vorsorge|Profilaktyka leiszmaniozy|Preventie van leishmaniose", "leishmania", ["dog"]],
  ["heartworm", "prevention", "hc", 20, "Heartworm test and prevention|Dépistage et prévention de la dirofilariose|Test e prevenzione della filariosi|Test y prevención de la dirofilariosis|Teste e prevenção da dirofilariose|Herzwurm-Test und -Vorsorge|Test i profilaktyka dirofilariozy|Hartwormtest en -preventie", "filaria", DOG_CAT],
  ["passport", "prevention", "hc", 20, "Pet passport|Passeport européen pour animal|Passaporto europeo per animali|Pasaporte europeo para mascotas|Passaporte europeu para animais|EU-Heimtierausweis|Paszport dla zwierząt|Europees dierenpaspoort"],
  ["travel_certificate", "prevention", "hc", 30, "Travel health certificate|Certificat sanitaire pour voyager|Certificato sanitario per viaggiare|Certificado sanitario para viajar|Certificado sanitário de viagem|Gesundheitszeugnis für Reisen|Świadectwo zdrowia na podróż|Gezondheidscertificaat voor op reis", "voyage viaggio viaje avion aereo plane export"],
  ["travel_advice", "prevention", "v", 15, "Travel advice for your pet|Conseils avant un voyage|Consigli prima di un viaggio|Consejos antes de viajar|Conselhos antes de viajar|Reiseberatung|Porada przed podróżą|Reisadvies", "voyage viaggio viaje vacances vacanze"],
  ["health_certificate", "prevention", "hc", 20, "Health certificate|Certificat de bonne santé|Certificato di buona salute|Certificado de buena salud|Atestado de saúde|Gesundheitszeugnis|Zaświadczenie o stanie zdrowia|Gezondheidsverklaring", "certificat certificato certificado attestation"],
  ["behaviour_assessment", "prevention", "c", 60, "Behavioural assessment (biting or dangerous dog)|Évaluation comportementale (chien mordeur ou catégorisé)|Valutazione comportamentale (cane morsicatore)|Evaluación de conducta (perro mordedor o peligroso)|Avaliação comportamental (cão mordedor ou perigoso)|Wesenstest (Beißvorfall, Listenhund)|Ocena behawioralna (pies gryzący lub groźny)|Gedragstest (bijtende of gevaarlijke hond)", "morsure bite morso mordedura categorie", ["dog"]],
  // behaviour
  ["behaviour", "behaviour", "vhc", 60, "Behaviour consultation|Consultation comportementale|Visita comportamentale|Consulta de etología|Consulta de comportamento|Verhaltensberatung|Konsultacja behawioralna|Gedragsconsult", "comportement aggression aggressivita agresividad anxiety ansia ansiedad stress aboiement barking abbaio ladrido peur fear paura miedo"],
  ["separation_anxiety", "behaviour", "vh", 45, "Separation anxiety|Anxiété de séparation|Ansia da separazione|Ansiedad por separación|Ansiedade de separação|Trennungsangst|Lęk separacyjny|Verlatingsangst", "alone seul solo destruction"],
  ["puppy_education", "behaviour", "vh", 45, "Puppy education advice|Conseils d'éducation du chiot|Consigli di educazione del cucciolo|Consejos de educación del cachorro|Conselhos de educação do cachorro|Welpenerziehung|Porady wychowawcze dla szczeniąt|Opvoedadvies voor pups", "education training dressage addestramento adiestramiento", ["dog"]],
  ["litter_problems", "behaviour", "vh", 30, "House-soiling and litter problems|Malpropreté (litière)|Problemi con la lettiera|Problemas con el arenero|Problemas com a caixa de areia|Unsauberkeit (Katzenklo)|Problemy z kuwetą|Zindelijkheidsproblemen (kattenbak)", "litiere lettiera arenero pipi marking marquage", ["cat"]],
  // nutrition
  ["nutrition", "nutrition", "vhc", 30, "Nutrition consultation|Consultation nutrition|Consulenza nutrizionale|Consulta de nutrición|Consulta de nutrição|Ernährungsberatung|Konsultacja żywieniowa|Voedingsconsult", "alimentation diet dieta regime croquettes crocchette pienso barf food cibo comida"],
  ["weight", "nutrition", "vhc", 30, "Weight management (overweight)|Suivi du poids (surpoids)|Controllo del peso (sovrappeso)|Control de peso (sobrepeso)|Controlo de peso (excesso de peso)|Gewichtsmanagement (Übergewicht)|Kontrola wagi (nadwaga)|Gewichtsbeheersing (overgewicht)", "obesite obesita obesidad obesity poids peso"],
  ["food_allergy", "nutrition", "vhc", 30, "Food allergy or intolerance|Allergie ou intolérance alimentaire|Allergia o intolleranza alimentare|Alergia o intolerancia alimentaria|Alergia ou intolerância alimentar|Futtermittelallergie oder -unverträglichkeit|Alergia lub nietolerancja pokarmowa|Voedselallergie of -intolerantie"],
  // skin, ears, eyes
  ["dermatology", "skin", "vhc", 30, "Dermatology (skin, coat, itching)|Dermatologie (peau, poils, démangeaisons)|Dermatologia (pelle, pelo, prurito)|Dermatología (piel, pelo, picor)|Dermatologia (pele, pelo, comichão)|Dermatologie (Haut, Fell, Juckreiz)|Dermatologia (skóra, sierść, świąd)|Dermatologie (huid, vacht, jeuk)", "grattage scratching gratta rasca perte de poils hair loss caduta pelo caida pelo plaque eczema"],
  ["allergy", "skin", "vhc", 30, "Allergies|Allergies|Allergie|Alergias|Alergias|Allergien|Alergie|Allergieën", "allergie atopie atopy"],
  ["ears", "skin", "vhc", 20, "Ear problems (otitis)|Problèmes d'oreilles (otite)|Problemi alle orecchie (otite)|Problemas de oídos (otitis)|Problemas de ouvidos (otite)|Ohrenprobleme (Otitis)|Problemy z uszami (zapalenie ucha)|Oorproblemen (oorontsteking)", "oreille orecchio oido ear otite"],
  ["eyes", "skin", "vhc", 30, "Eye problems (ophthalmology)|Problèmes d'yeux (ophtalmologie)|Problemi agli occhi (oftalmologia)|Problemas de ojos (oftalmología)|Problemas de olhos (oftalmologia)|Augenprobleme (Augenheilkunde)|Problemy z oczami (okulistyka)|Oogproblemen (oogheelkunde)", "oeil occhio ojo eye conjonctivite congiuntivite conjuntivitis"],
  ["lump_check", "skin", "vhc", 20, "Lump or mass to check|Grosseur ou masse à examiner|Nodulo o massa da controllare|Bulto o masa a revisar|Nódulo ou massa a avaliar|Knoten oder Schwellung abklären|Guz lub zgrubienie do sprawdzenia|Bult of zwelling laten nakijken", "boule bosse nodule tumeur tumore tumor bulto"],
  // dental
  ["dental_check", "dental", "vhc", 20, "Dental check|Contrôle dentaire|Controllo dentale|Revisión dental|Avaliação dentária|Zahnkontrolle|Kontrola zębów|Gebitscontrole", "dents denti dientes teeth haleine alito aliento bad breath gencives"],
  ["dental_scaling", "dental", "c", 60, "Dental scaling and cleaning|Détartrage|Detartrasi (pulizia dei denti)|Limpieza dental|Destartarização|Zahnsteinentfernung|Usuwanie kamienia nazębnego|Gebitsreiniging", "tartre tartaro sarro"],
  ["tooth_extraction", "dental", "c", 60, "Tooth extraction|Extraction dentaire|Estrazione dentale|Extracción dental|Extração dentária|Zahnextraktion|Ekstrakcja zęba|Tandextractie"],
  // internal medicine
  ["digestive", "medicine", "vhc", 30, "Digestive problems (vomiting, diarrhoea)|Troubles digestifs (vomissements, diarrhée)|Disturbi digestivi (vomito, diarrea)|Problemas digestivos (vómitos, diarrea)|Problemas digestivos (vómitos, diarreia)|Verdauungsprobleme (Erbrechen, Durchfall)|Problemy trawienne (wymioty, biegunka)|Spijsverteringsproblemen (braken, diarree)", "vomi vomito diarrhee diarrea constipation stitichezza estrenimiento"],
  ["urinary", "medicine", "vhc", 30, "Urinary problems|Troubles urinaires|Problemi urinari|Problemas urinarios|Problemas urinários|Harnwegsprobleme|Problemy z układem moczowym|Urinewegproblemen", "cystite cistite cistitis pipi urine sang blood sangue calculs"],
  ["kidney", "medicine", "vhc", 30, "Kidney disease follow-up|Suivi de maladie rénale|Controllo della malattia renale|Seguimiento de enfermedad renal|Acompanhamento de doença renal|Verlaufskontrolle Nierenerkrankung|Kontrola choroby nerek|Opvolging nierziekte", "rein rene rinon insuffisance renale"],
  ["diabetes", "medicine", "vhc", 30, "Diabetes follow-up|Suivi du diabète|Controllo del diabete|Seguimiento de diabetes|Acompanhamento de diabetes|Diabetes-Kontrolle|Kontrola cukrzycy|Opvolging diabetes", "insuline insulina glycemie"],
  ["hormones", "medicine", "vhc", 30, "Hormonal disorders (thyroid…)|Troubles hormonaux (thyroïde…)|Disturbi ormonali (tiroide…)|Trastornos hormonales (tiroides…)|Distúrbios hormonais (tiroide…)|Hormonstörungen (Schilddrüse…)|Zaburzenia hormonalne (tarczyca…)|Hormonale aandoeningen (schildklier…)", "cushing addison hyperthyroidie endocrinologie"],
  ["respiratory", "medicine", "vhc", 30, "Breathing problems or cough|Troubles respiratoires ou toux|Problemi respiratori o tosse|Problemas respiratorios o tos|Problemas respiratórios ou tosse|Atemprobleme oder Husten|Problemy z oddychaniem lub kaszel|Ademhalingsproblemen of hoest", "toux tosse tos cough eternuement sneezing starnuti estornudos coryza"],
  ["cardiology", "medicine", "vhc", 40, "Heart (cardiology)|Cœur (cardiologie)|Cuore (cardiologia)|Corazón (cardiología)|Coração (cardiologia)|Herz (Kardiologie)|Serce (kardiologia)|Hart (cardiologie)", "coeur cuore corazon heart souffle soffio soplo murmur"],
  ["neurology", "medicine", "vhc", 40, "Neurology (seizures, balance)|Neurologie (crises, équilibre)|Neurologia (crisi, equilibrio)|Neurología (convulsiones, equilibrio)|Neurologia (convulsões, equilíbrio)|Neurologie (Anfälle, Gleichgewicht)|Neurologia (napady, równowaga)|Neurologie (aanvallen, evenwicht)", "epilepsie epilessia epilepsia convulsion paralysie"],
  ["oncology", "medicine", "vhc", 40, "Cancer (oncology)|Cancer (oncologie)|Tumori (oncologia)|Cáncer (oncología)|Cancro (oncologia)|Krebs (Onkologie)|Nowotwory (onkologia)|Kanker (oncologie)", "tumeur tumore tumor chimiotherapie chemio"],
  ["infectious", "medicine", "vhc", 30, "Infectious disease|Maladie infectieuse|Malattia infettiva|Enfermedad infecciosa|Doença infecciosa|Infektionskrankheit|Choroba zakaźna|Infectieziekte", "infection virus parvovirose fiv felv leptospirose"],
  ["unwell", "medicine", "vhc", 20, "Tired, not eating or fever|Fatigue, perte d'appétit ou fièvre|Stanchezza, inappetenza o febbre|Cansancio, falta de apetito o fiebre|Cansaço, falta de apetite ou febre|Müdigkeit, Appetitlosigkeit oder Fieber|Osłabienie, brak apetytu lub gorączka|Lusteloos, eet niet of koorts", "malade sick malato enfermo abattu fievre febbre fiebre appetit"],
  // mobility
  ["lameness", "mobility", "hc", 30, "Limping (lameness)|Boiterie|Zoppia|Cojera|Claudicação|Lahmheit|Kulawizna|Kreupelheid", "boite zoppica cojea limp patte zampa pata"],
  ["orthopaedics", "mobility", "hc", 40, "Joints and bones (orthopaedics)|Articulations et os (orthopédie)|Articolazioni e ossa (ortopedia)|Articulaciones y huesos (ortopedia)|Articulações e ossos (ortopedia)|Gelenke und Knochen (Orthopädie)|Stawy i kości (ortopedia)|Gewrichten en botten (orthopedie)", "arthrose artrosi artrosis arthritis dysplasie displasia hanche anca cadera ligament"],
  ["physiotherapy", "mobility", "hc", 45, "Physiotherapy and rehabilitation|Physiothérapie et rééducation|Fisioterapia e riabilitazione|Fisioterapia y rehabilitación|Fisioterapia e reabilitação|Physiotherapie und Reha|Fizjoterapia i rehabilitacja|Fysiotherapie en revalidatie", "kine kinesitherapie hydrotherapie"],
  ["osteopathy", "mobility", "hc", 45, "Osteopathy|Ostéopathie|Osteopatia|Osteopatía|Osteopatia|Osteopathie|Osteopatia|Osteopathie"],
  ["acupuncture", "mobility", "hc", 45, "Acupuncture|Acupuncture|Agopuntura|Acupuntura|Acupunctura|Akupunktur|Akupunktura|Acupunctuur"],
  ["pain", "mobility", "vhc", 30, "Pain management|Prise en charge de la douleur|Terapia del dolore|Tratamiento del dolor|Controlo da dor|Schmerztherapie|Leczenie bólu|Pijnbestrijding", "douleur dolore dolor pain mal"],
  // reproduction
  ["reproduction", "reproduction", "vhc", 30, "Reproduction and breeding|Reproduction et élevage|Riproduzione e allevamento|Reproducción y cría|Reprodução e criação|Fortpflanzung und Zucht|Rozród i hodowla|Voortplanting en fokkerij", "eleveur allevatore criador breeder portee cucciolata camada"],
  ["pregnancy", "reproduction", "hc", 30, "Pregnancy follow-up|Suivi de gestation|Controllo della gravidanza|Seguimiento de la gestación|Acompanhamento da gestação|Trächtigkeitsuntersuchung|Kontrola ciąży|Drachtigheidscontrole", "gestation gravidanza embarazo prenez incinta mise bas parto birth"],
  ["heat_mating", "reproduction", "vhc", 20, "Heat and mating advice|Chaleurs et saillie|Calore e accoppiamento|Celo y monta|Cio e cobrição|Läufigkeit und Deckberatung|Cieczka i krycie|Loopsheid en dekking", "chaleur calore celo cio saillie monta"],
  ["neuter_consult", "reproduction", "vhc", 20, "Spay or neuter consultation|Consultation avant stérilisation ou castration|Visita prima della sterilizzazione|Consulta antes de la esterilización|Consulta antes da esterilização|Beratung vor der Kastration|Konsultacja przed sterylizacją lub kastracją|Consult voor sterilisatie of castratie", "sterilisation castration sterilizzazione castrazione esterilizacion castracion"],
  // surgery
  ["neutering", "surgery", "c", 60, "Spay or neuter surgery|Stérilisation ou castration|Sterilizzazione o castrazione|Esterilización o castración|Esterilização ou castração|Kastration|Sterylizacja lub kastracja|Sterilisatie of castratie", "sterilisation castration sterilizzazione castrazione esterilizacion castracion ovariectomie"],
  ["surgery_consult", "surgery", "vc", 30, "Pre-surgery consultation|Consultation pré-opératoire|Visita pre-operatoria|Consulta prequirúrgica|Consulta pré-cirúrgica|Voruntersuchung vor der Operation|Konsultacja przedoperacyjna|Pre-operatief consult", "operation operazione cirugia anesthesie anestesia"],
  ["soft_tissue_surgery", "surgery", "c", 90, "Soft-tissue surgery|Chirurgie des tissus mous|Chirurgia dei tessuti molli|Cirugía de tejidos blandos|Cirurgia de tecidos moles|Weichteilchirurgie|Chirurgia tkanek miękkich|Weke-delenchirurgie"],
  ["orthopaedic_surgery", "surgery", "c", 120, "Orthopaedic surgery|Chirurgie orthopédique|Chirurgia ortopedica|Cirugía ortopédica|Cirurgia ortopédica|Orthopädische Chirurgie|Chirurgia ortopedyczna|Orthopedische chirurgie", "fracture frattura fractura ligament croise crociato cruzado"],
  ["lump_removal", "surgery", "c", 60, "Lump removal|Retrait d'une masse|Asportazione di noduli|Extirpación de bultos|Remoção de nódulos|Entfernung von Knoten|Usunięcie guza|Verwijderen van een bult", "exerese tumeur tumore tumor"],
  ["stitches", "surgery", "hc", 15, "Stitch removal|Retrait des points|Rimozione dei punti|Retirada de puntos|Remoção de pontos|Fäden ziehen|Zdjęcie szwów|Hechtingen verwijderen", "fils punti puntos sutures"],
  // diagnostics
  ["blood_test", "diagnostics", "hc", 20, "Blood test|Prise de sang (bilan sanguin)|Esami del sangue|Análisis de sangre|Análises ao sangue|Blutuntersuchung|Badanie krwi|Bloedonderzoek", "sang sangue sangre analyses analisi analisis"],
  ["urine_test", "diagnostics", "hc", 15, "Urine test|Analyse d'urine|Esame delle urine|Análisis de orina|Análise de urina|Urinuntersuchung|Badanie moczu|Urineonderzoek"],
  ["stool_test", "diagnostics", "hc", 15, "Stool test|Analyse de selles (coproscopie)|Esame delle feci|Análisis de heces|Análise de fezes|Kotuntersuchung|Badanie kału|Ontlastingsonderzoek", "coproscopie feci heces parasites"],
  ["xray", "diagnostics", "c", 30, "X-ray|Radiographie|Radiografia|Radiografía|Radiografia|Röntgen|RTG (prześwietlenie)|Röntgenfoto", "radio rx raggi"],
  ["ultrasound", "diagnostics", "hc", 30, "Ultrasound scan|Échographie|Ecografia|Ecografía|Ecografia|Ultraschall|USG (badanie ultrasonograficzne)|Echografie", "echo eco"],
  ["echocardiography", "diagnostics", "c", 45, "Heart ultrasound (echocardiography)|Échocardiographie|Ecocardiografia|Ecocardiografía|Ecocardiografia|Herzultraschall|Echo serca|Echocardiografie"],
  ["ecg", "diagnostics", "hc", 30, "ECG|Électrocardiogramme (ECG)|Elettrocardiogramma (ECG)|Electrocardiograma (ECG)|Eletrocardiograma (ECG)|EKG|EKG|ECG", "electrocardiogram"],
  ["endoscopy", "diagnostics", "c", 60, "Endoscopy|Endoscopie|Endoscopia|Endoscopia|Endoscopia|Endoskopie|Endoskopia|Endoscopie", "corps etranger corpo estraneo cuerpo extrano"],
  ["ct_mri", "diagnostics", "c", 60, "CT scan or MRI|Scanner ou IRM|TAC o risonanza magnetica|TAC o resonancia magnética|TAC ou ressonância magnética|CT oder MRT|Tomografia komputerowa lub rezonans|CT-scan of MRI", "scanner irm risonanza tac tomographie"],
  ["biopsy", "diagnostics", "c", 30, "Biopsy or cytology|Biopsie ou cytologie|Biopsia o citologia|Biopsia o citología|Biópsia ou citologia|Biopsie oder Zytologie|Biopsja lub cytologia|Biopsie of cytologie", "cytoponction ago aspirato"],
  // care
  ["injection", "care", "hc", 15, "Injection or treatment given by the vet|Injection ou administration d'un traitement|Iniezione o somministrazione di una terapia|Inyección o administración de un tratamiento|Injeção ou administração de tratamento|Injektion oder Medikamentengabe|Zastrzyk lub podanie leku|Injectie of toediening van medicatie", "piqure puntura inyeccion perfusion flebo"],
  ["wound_care", "care", "hc", 20, "Wound care and dressing|Soins de plaie et pansement|Medicazione di ferite|Curación de heridas|Tratamento de feridas e pensos|Wundversorgung und Verband|Opatrywanie ran|Wondverzorging en verband", "plaie ferita herida pansement bandage"],
  ["nail_trim", "care", "hc", 15, "Nail trim|Coupe des griffes|Taglio delle unghie|Corte de uñas|Corte de unhas|Krallen schneiden|Obcinanie pazurów|Nagels knippen", "griffes unghie unas ongles claws"],
  ["anal_glands", "care", "hc", 15, "Anal gland emptying|Vidange des glandes anales|Svuotamento delle ghiandole perianali|Vaciado de glándulas anales|Esvaziamento das glândulas anais|Analdrüsen entleeren|Opróżnianie gruczołów okołoodbytowych|Anaalklieren legen", "glandes ghiandole glandulas", DOG_CAT],
  ["prescription_renewal", "care", "vhc", 15, "Prescription renewal|Renouvellement d'ordonnance|Rinnovo della ricetta|Renovación de receta|Renovação de receita|Rezeptverlängerung|Odnowienie recepty|Herhaalrecept", "ordonnance ricetta receta prescription medicament farmaco medicamento"],
  ["chronic_followup", "care", "vhc", 20, "Chronic disease follow-up|Suivi de maladie chronique|Controllo di una malattia cronica|Seguimiento de enfermedad crónica|Acompanhamento de doença crónica|Kontrolle bei chronischer Erkrankung|Kontrola choroby przewlekłej|Opvolging chronische ziekte", "chronique cronica cronica traitement long terme"],
  ["grooming", "care", "hc", 60, "Grooming and bath|Toilettage et bain|Toelettatura e bagno|Peluquería y baño|Tosquia e banho|Fellpflege und Baden|Pielęgnacja i kąpiel|Trimmen en wassen", "toilettage toelettatura peluqueria tosa trimming tonte coupe", DOG_CAT],
  ["hospitalisation", "care", "c", 60, "Hospitalisation|Hospitalisation|Ricovero|Hospitalización|Internamento|Stationäre Aufnahme|Hospitalizacja|Opname", "hospitalisation ricovero ingreso"],
  ["integrative", "care", "vhc", 45, "Homeopathy and herbal medicine|Homéopathie et phytothérapie|Omeopatia e fitoterapia|Homeopatía y fitoterapia|Homeopatia e fitoterapia|Homöopathie und Phytotherapie|Homeopatia i ziołolecznictwo|Homeopathie en fytotherapie", "naturel naturale natural plantes"],
  // emergency
  ["emergency", "emergency", "vhc", 30, "Emergency|Urgence|Urgenza|Urgencia|Urgência|Notfall|Nagły przypadek|Spoedgeval", "urgent urgente garde guardia notfall"],
  ["triage", "emergency", "v", 15, "Is it urgent? Quick triage|Est-ce urgent ? Orientation rapide|È urgente? Valutazione rapida|¿Es urgente? Orientación rápida|É urgente? Triagem rápida|Ist es dringend? Schnelle Einschätzung|Czy to pilne? Szybka ocena|Is het dringend? Snelle triage", "urgence urgenza urgencia triage"],
  ["poisoning", "emergency", "vhc", 20, "Suspected poisoning|Suspicion d'intoxication|Sospetto avvelenamento|Sospecha de intoxicación|Suspeita de intoxicação|Vergiftungsverdacht|Podejrzenie zatrucia|Vermoedelijke vergiftiging", "intoxication empoisonnement avvelenamento envenenamiento chocolat cioccolato chocolate mange ingere poison plante"],
  ["injury", "emergency", "hc", 30, "Injury or accident|Blessure ou accident|Ferita o incidente|Herida o accidente|Ferimento ou acidente|Verletzung oder Unfall|Uraz lub wypadek|Verwonding of ongeval", "blessure ferita herida accident trauma morsure bite"],
  // end of life
  ["palliative", "end_of_life", "vhc", 40, "Palliative care|Soins palliatifs|Cure palliative|Cuidados paliativos|Cuidados paliativos|Palliativversorgung|Opieka paliatywna|Palliatieve zorg", "fin de vie fine vita final"],
  ["quality_of_life", "end_of_life", "vh", 30, "Quality-of-life assessment|Évaluation de la qualité de vie|Valutazione della qualità di vita|Evaluación de la calidad de vida|Avaliação da qualidade de vida|Beurteilung der Lebensqualität|Ocena jakości życia|Beoordeling van de levenskwaliteit"],
  ["euthanasia", "end_of_life", "hc", 60, "Euthanasia|Euthanasie|Eutanasia|Eutanasia|Eutanásia|Einschläferung (Euthanasie)|Eutanazja|Euthanasie", "endormir addormentare dormir"],
  ["pet_loss", "end_of_life", "v", 30, "Pet loss support|Accompagnement après la perte d'un animal|Sostegno dopo la perdita dell'animale|Acompañamiento tras la pérdida de un animal|Apoio após a perda do animal|Begleitung nach dem Verlust eines Tieres|Wsparcie po stracie zwierzęcia|Begeleiding na het verlies van een dier", "deuil lutto duelo grief"],
  // exotic pets
  ["exotic_consult", "exotic", "vhc", 30, "Exotic pet consultation|Consultation NAC|Visita animali esotici|Consulta de animales exóticos|Consulta de animais exóticos|Exoten-Sprechstunde|Konsultacja zwierząt egzotycznych|Consult exotische dieren", "nac exotique esotico exotico", EXOTIC],
  ["rabbit_consult", "exotic", "hc", 30, "Rabbit consultation|Consultation lapin|Visita del coniglio|Consulta de conejo|Consulta de coelho|Kaninchen-Sprechstunde|Konsultacja królika|Konijnenconsult", "lapin coniglio conejo", ["rabbit"]],
  ["rodent_consult", "exotic", "hc", 30, "Rodent consultation|Consultation rongeurs|Visita dei roditori|Consulta de roedores|Consulta de roedores|Nager-Sprechstunde|Konsultacja gryzoni|Knaagdierenconsult", "cobaye cochon d'inde hamster rat chinchilla", ["rodent"]],
  ["bird_consult", "exotic", "hc", 30, "Bird consultation|Consultation oiseaux|Visita degli uccelli|Consulta de aves|Consulta de aves|Vogel-Sprechstunde|Konsultacja ptaków|Vogelconsult", "oiseau uccello ave perroquet pappagallo loro", ["bird"]],
  ["reptile_consult", "exotic", "hc", 30, "Reptile consultation|Consultation reptiles|Visita dei rettili|Consulta de reptiles|Consulta de répteis|Reptilien-Sprechstunde|Konsultacja gadów|Reptielenconsult", "tortue tartaruga tortuga serpent serpente lezard", ["reptile"]],
  ["fish_consult", "exotic", "vh", 30, "Fish and aquarium consultation|Consultation poissons et aquarium|Visita di pesci e acquario|Consulta de peces y acuario|Consulta de peixes e aquário|Fisch- und Aquarienberatung|Konsultacja ryb i akwarium|Consult vissen en aquarium", "poisson pesce pez aquarium acquario acuario bassin stagno estanque", ["aquatic"]],
  ["husbandry", "exotic", "v", 30, "Housing and care advice (cage, terrarium…)|Conseils de détention (cage, terrarium…)|Consigli su habitat e gestione (gabbia, terrario…)|Consejos de alojamiento y cuidados (jaula, terrario…)|Conselhos de alojamento e cuidados (gaiola, terrário…)|Haltungsberatung (Käfig, Terrarium…)|Porady dotyczące warunków utrzymania (klatka, terrarium…)|Huisvestingsadvies (kooi, terrarium…)", "cage gabbia jaula terrarium terrario uv", EXOTIC],
  // horses
  ["equine_visit", "equine", "hc", 45, "Horse visit|Visite équine|Visita del cavallo|Visita equina|Visita equina|Pferdebesuch|Wizyta u konia|Paardenconsult", "cheval cavallo caballo horse poney pony ane asino burro", EQ],
  ["equine_lameness", "equine", "hc", 60, "Horse lameness exam|Examen locomoteur du cheval|Visita per zoppia del cavallo|Examen de cojera del caballo|Exame de claudicação do cavalo|Lahmheitsuntersuchung beim Pferd|Badanie kulawizny konia|Kreupelheidsonderzoek paard", "boiterie zoppia cojera", EQ],
  ["equine_dentistry", "equine", "hc", 60, "Horse dentistry|Dentisterie équine|Odontoiatria equina|Odontología equina|Odontologia equina|Pferdezahnbehandlung|Stomatologia koni|Paardentandheelkunde", "dents denti dientes rape raspa", EQ],
  ["equine_colic", "equine", "hc", 45, "Colic|Coliques|Colica|Cólico|Cólica|Kolik|Kolka|Koliek", "colique colica", EQ],
  ["equine_vaccination", "equine", "hc", 30, "Horse vaccination and worming|Vaccination et vermifugation du cheval|Vaccinazione e sverminazione del cavallo|Vacunación y desparasitación del caballo|Vacinação e desparasitação do cavalo|Impfung und Entwurmung beim Pferd|Szczepienie i odrobaczanie konia|Vaccinatie en ontworming van het paard", "grippe influenza tetanos", EQ],
  ["equine_prepurchase", "equine", "hc", 90, "Horse pre-purchase exam|Visite d'achat du cheval|Visita di compravendita del cavallo|Revisión precompra del caballo|Exame de pré-compra do cavalo|Ankaufsuntersuchung beim Pferd|Badanie przedzakupowe konia|Aankoopkeuring paard", "achat acquisto compra", EQ],
  // farm animals
  ["farm_visit", "farm", "h", 60, "Farm visit|Visite d'élevage|Visita in allevamento|Visita a la explotación|Visita à exploração|Bestandsbesuch|Wizyta w gospodarstwie|Bedrijfsbezoek", "ferme fattoria granja vache mucca vaca mouton pecora chevre capra cabra", FARM],
  ["herd_health", "farm", "vh", 60, "Herd health plan|Suivi sanitaire du troupeau|Piano sanitario della mandria|Plan sanitario del rebaño|Plano sanitário do efetivo|Herdengesundheitsplan|Plan zdrowia stada|Koppelgezondheidsplan", "troupeau gregge mandria rebano", FARM],
  ["calving_lambing", "farm", "h", 60, "Calving, lambing or kidding|Vêlage, agnelage ou mise bas|Parto (vitelli, agnelli, capretti)|Parto (terneros, corderos, cabritos)|Parto (vitelos, borregos, cabritos)|Geburtshilfe (Kalben, Lammen)|Poród (cielenie, wykot)|Afkalven, aflammen of lammeren", "velage agnelage parto", FARM],
  // between vets
  ["case_discussion", "vets", "e", 30, "Case discussion with a colleague (tele-expertise)|Télé-expertise entre vétérinaires|Teleconsulto tra veterinari|Teleconsulta entre veterinarios|Teleconsultoria entre veterinários|Kollegiale Fallbesprechung (Tele-Expertise)|Konsultacja przypadku z innym weterynarzem|Casusoverleg met een collega", "expertise referent specialiste specialista"],
];

export const CONSULTS: Consult[] = RAW.map(([code, category, modes, minutes, n, words, species]) => {
  const parts = n.split("|");
  return { code, category, minutes, modes: [...modes].map((m) => MODE[m]), words: words ?? "", species,
    names: Object.fromEntries(CONSULT_LANGS.map((l, i) => [l, parts[i] ?? parts[0]])) };
});
export const CONSULT_CATEGORIES: { code: string; names: Record<string, string> }[] = CATS_RAW.map(([code, n]) => {
  const parts = n.split("|");
  return { code, names: Object.fromEntries(CONSULT_LANGS.map((l, i) => [l, parts[i] ?? parts[0]])) };
});

/** Older generic codes, created before the catalogue: they mean "a consultation of this kind" and show the kind's name. */
export const GENERIC_CODES = ["video_consult", "home_visit", "clinic_visit", "tele_expertise", "custom"];
const BY_CODE = new Map(CONSULTS.map((c) => [c.code, c]));
export const consultOf = (code: string | null | undefined) => (code ? BY_CODE.get(code) : undefined);

const langKey = (lang: string) => { const l = lang.slice(0, 2); return (CONSULT_LANGS as readonly string[]).includes(l) ? l : "en"; };
export const consultName = (code: string, lang: string) => { const c = BY_CODE.get(code); return c ? c.names[langKey(lang)] ?? c.names.en : undefined; };
export const consultCategoryName = (code: string, lang: string) => { const c = CONSULT_CATEGORIES.find((x) => x.code === code); return c ? c.names[langKey(lang)] ?? c.names.en : code; };

/**
 * Name of a service as the visitor sees it:
 * - a catalogue entry shows its name in the visitor's language;
 * - a consultation the vet wrote in their own words shows those words;
 * - otherwise the name of the kind of appointment (`typeName`).
 */
export function serviceTitle(s: { custom_name?: string | null; catalog_code?: string | null }, lang: string, typeName: string): string {
  if (s.custom_name?.trim()) return s.custom_name.trim();
  return consultName(s.catalog_code ?? "", lang) ?? typeName;
}

// ---------------------------------------------------------------- search while the vet types
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/œ/g, "oe").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();

function trigrams(s: string): Set<string> {
  const x = `  ${s} `, out = new Set<string>();
  for (let i = 0; i < x.length - 2; i++) out.add(x.slice(i, i + 3));
  return out;
}
/** Similarity 0..1 between two short texts (shared groups of 3 letters), tolerant of typos. */
export function similarity(a: string, b: string): number {
  const A = trigrams(a), B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return (2 * n) / (A.size + B.size);
}

export interface Match { consult: Consult; score: number; exact: boolean; close: boolean }

/**
 * Catalogue entries matching what the vet is typing, best first. The vet's language counts most, but a name typed
 * in another language, a common word ("vaccin", "puce", "teeth") or a typo still finds the entry.
 * `close` = no word matches, only a similar spelling: shown as "did you mean…".
 */
export function searchConsults(query: string, lang: string, opts: { mode?: Mode; limit?: number } = {}): Match[] {
  const q = norm(query), l = langKey(lang);
  if (!q) return [];
  const qWords = q.split(" ");
  const out: Match[] = [];
  for (const c of CONSULTS) {
    const own = norm(c.names[l]), others = CONSULT_LANGS.filter((x) => x !== l).map((x) => norm(c.names[x])), words = norm(c.words);
    let score = 0, close = false;
    const ownWords = own.split(" ");
    if (own === q) score = 1000;
    else if (own.startsWith(q)) score = 400;
    else if (qWords.every((w) => ownWords.some((o) => o.startsWith(w)))) score = 300;
    else if (own.includes(q)) score = 250;
    else if (qWords.every((w) => words.split(" ").some((o) => o.startsWith(w)))) score = 200;
    else if (others.some((o) => o.startsWith(q) || o.split(" ").some((w) => w.startsWith(q)))) score = 150;
    else if (q.length >= 3) {
      const candidates = [own, ...ownWords, ...words.split(" ").filter(Boolean), ...others];
      const best = Math.max(...candidates.map((x) => similarity(q, x)));
      if (best >= 0.42) { score = Math.round(best * 100); close = true; }
    }
    if (!score) continue;
    if (opts.mode && c.modes.includes(opts.mode)) score += 5; // small preference for what fits the chosen kind
    out.push({ consult: c, score, exact: own === q, close });
  }
  out.sort((a, b) => b.score - a.score || a.consult.names[l].localeCompare(b.consult.names[l]));
  return out.slice(0, opts.limit ?? 8);
}

/** Consultations worth showing on a species page (for that animal, its category, or every animal). */
export function consultsFor(speciesCodes: string[]): Consult[] {
  const set = new Set(speciesCodes);
  const own = CONSULTS.filter((c) => c.species?.some((s) => set.has(s)));
  // dogs and cats: the whole general catalogue applies; other animals: the basics only, plus their own consultations
  const dogCat = set.has("dog") || set.has("cat");
  const BASICS = ["general_consult", "advice_call", "followup", "second_opinion", "digestive", "respiratory", "injury", "emergency", "triage", "euthanasia"];
  const common = CONSULTS.filter((c) => !c.species && c.category !== "vets" && (dogCat || BASICS.includes(c.code)));
  return [...own, ...common];
}
