/**
 * Animals: one shared list for the whole site (pets of owners, animals treated by vets, species pages for SEO).
 * Pure module (no server imports): used by the browser, the server and the tests.
 *
 * - The most common animals come first and stand alone (dog, cat, rabbit).
 * - The others belong to a category (rodents, birds, equines…). A vet can tick a whole category ("all rodents")
 *   or only the animals they treat inside it. A category code stored on a vet means "every animal of that category".
 * - Older codes stay valid: "rodent", "bird", "reptile" are categories, "horse" and "ferret" are animals of a category.
 *
 * Names: "singular/plural" in fr, it, en, es, pt, de, pl, nl — lower case except where the language needs capitals.
 */
export const SPECIES_LANGS = ["en", "fr", "it", "es", "pt", "de", "pl", "nl"] as const;
type Names = Record<string, { sg: string; pl: string }>;

function names(s: string): Names {
  const parts = s.split("|");
  return Object.fromEntries(SPECIES_LANGS.map((l, i) => { const [sg, pl] = (parts[i] ?? parts[0]).split("/"); return [l, { sg, pl: pl ?? sg }]; }));
}

export interface Category { code: string; names: Names; members: string[] }
export interface Species { code: string; category: string | null; names: Names }

/** Animals that stand alone, in the order shown (most common first). */
export const COMMON = ["dog", "cat", "rabbit"] as const;

const RAW_SPECIES: [string, string | null, string][] = [
  ["dog", null, "dog/dogs|chien/chiens|cane/cani|perro/perros|cão/cães|Hund/Hunde|pies/psy|hond/honden"],
  ["cat", null, "cat/cats|chat/chats|gatto/gatti|gato/gatos|gato/gatos|Katze/Katzen|kot/koty|kat/katten"],
  ["rabbit", null, "rabbit/rabbits|lapin/lapins|coniglio/conigli|conejo/conejos|coelho/coelhos|Kaninchen/Kaninchen|królik/króliki|konijn/konijnen"],
  // rodents
  ["guinea_pig", "rodent", "guinea pig/guinea pigs|cochon d'Inde/cochons d'Inde|porcellino d'India/porcellini d'India|cobaya/cobayas|porquinho-da-índia/porquinhos-da-índia|Meerschweinchen/Meerschweinchen|świnka morska/świnki morskie|cavia/cavia's"],
  ["hamster", "rodent", "hamster/hamsters|hamster/hamsters|criceto/criceti|hámster/hámsters|hamster/hamsters|Hamster/Hamster|chomik/chomiki|hamster/hamsters"],
  ["rat", "rodent", "rat/rats|rat/rats|ratto/ratti|rata/ratas|rato/ratos|Ratte/Ratten|szczur/szczury|rat/ratten"],
  ["mouse", "rodent", "mouse/mice|souris/souris|topolino/topolini|ratón/ratones|ratinho/ratinhos|Maus/Mäuse|mysz/myszy|muis/muizen"],
  ["chinchilla", "rodent", "chinchilla/chinchillas|chinchilla/chinchillas|cincillà/cincillà|chinchilla/chinchillas|chinchila/chinchilas|Chinchilla/Chinchillas|szynszyla/szynszyle|chinchilla/chinchilla's"],
  ["gerbil", "rodent", "gerbil/gerbils|gerbille/gerbilles|gerbillo/gerbilli|jerbo/jerbos|gerbilo/gerbilos|Rennmaus/Rennmäuse|myszoskoczek/myszoskoczki|gerbil/gerbils"],
  ["degu", "rodent", "degu/degus|octodon/octodons|degu/degu|degú/degús|degu/degus|Degu/Degus|koszatniczka/koszatniczki|degoe/degoes"],
  // other small mammals
  ["ferret", "small_mammal", "ferret/ferrets|furet/furets|furetto/furetti|hurón/hurones|furão/furões|Frettchen/Frettchen|fretka/fretki|fret/fretten"],
  ["hedgehog", "small_mammal", "hedgehog/hedgehogs|hérisson/hérissons|riccio/ricci|erizo/erizos|ouriço/ouriços|Igel/Igel|jeż/jeże|egel/egels"],
  // birds
  ["budgie", "bird", "budgie/budgies|perruche/perruches|pappagallino/pappagallini|periquito/periquitos|periquito/periquitos|Wellensittich/Wellensittiche|papużka falista/papużki faliste|grasparkiet/grasparkieten"],
  ["parrot", "bird", "parrot/parrots|perroquet/perroquets|pappagallo/pappagalli|loro/loros|papagaio/papagaios|Papagei/Papageien|papuga/papugi|papegaai/papegaaien"],
  ["cockatiel", "bird", "cockatiel/cockatiels|calopsitte/calopsittes|calopsite/calopsiti|ninfa/ninfas|caturra/caturras|Nymphensittich/Nymphensittiche|nimfa/nimfy|valkparkiet/valkparkieten"],
  ["canary", "bird", "canary/canaries|canari/canaris|canarino/canarini|canario/canarios|canário/canários|Kanarienvogel/Kanarienvögel|kanarek/kanarki|kanarie/kanaries"],
  ["pigeon", "bird", "pigeon/pigeons|pigeon/pigeons|piccione/piccioni|paloma/palomas|pombo/pombos|Taube/Tauben|gołąb/gołębie|duif/duiven"],
  ["poultry", "bird", "hen/hens and poultry|poule/poules et volailles|gallina/galline e pollame|gallina/gallinas y aves de corral|galinha/galinhas e aves de capoeira|Huhn/Hühner und Geflügel|kura/kury i drób|kip/kippen en pluimvee"],
  // reptiles
  ["tortoise", "reptile", "tortoise/tortoises|tortue terrestre/tortues terrestres|tartaruga di terra/tartarughe di terra|tortuga de tierra/tortugas de tierra|jabuti/jabutis|Landschildkröte/Landschildkröten|żółw lądowy/żółwie lądowe|landschildpad/landschildpadden"],
  ["turtle", "reptile", "turtle/turtles|tortue aquatique/tortues aquatiques|tartaruga d'acqua/tartarughe d'acqua|tortuga acuática/tortugas acuáticas|tartaruga aquática/tartarugas aquáticas|Wasserschildkröte/Wasserschildkröten|żółw wodny/żółwie wodne|waterschildpad/waterschildpadden"],
  ["lizard", "reptile", "lizard/lizards (gecko, bearded dragon…)|lézard/lézards (gecko, pogona…)|sauro/sauri (geco, pogona…)|lagarto/lagartos (gecko, dragón barbudo…)|lagarto/lagartos (gecko, dragão-barbudo…)|Echse/Echsen (Gecko, Bartagame…)|jaszczurka/jaszczurki (gekon, agama…)|hagedis/hagedissen (gekko, baardagaam…)"],
  ["snake", "reptile", "snake/snakes|serpent/serpents|serpente/serpenti|serpiente/serpientes|cobra/cobras|Schlange/Schlangen|wąż/węże|slang/slangen"],
  // fish and amphibians
  ["fish", "aquatic", "aquarium fish/aquarium fish|poisson d'aquarium/poissons d'aquarium|pesce d'acquario/pesci d'acquario|pez de acuario/peces de acuario|peixe de aquário/peixes de aquário|Aquarienfisch/Aquarienfische|ryba akwariowa/ryby akwariowe|aquariumvis/aquariumvissen"],
  ["koi", "aquatic", "koi/koi carp|koï/carpes koï|koi/carpe koi|koi/carpas koi|koi/carpas koi|Koi/Kois|karp koi/karpie koi|koi/koikarpers"],
  ["amphibian", "aquatic", "frog or axolotl/frogs and axolotls|grenouille ou axolotl/grenouilles et axolotls|rana o axolotl/rane e axolotl|rana o ajolote/ranas y ajolotes|rã ou axolote/rãs e axolotes|Frosch oder Axolotl/Frösche und Axolotl|żaba lub aksolotl/żaby i aksolotle|kikker of axolotl/kikkers en axolotls"],
  // equines
  ["horse", "equine", "horse/horses|cheval/chevaux|cavallo/cavalli|caballo/caballos|cavalo/cavalos|Pferd/Pferde|koń/konie|paard/paarden"],
  ["pony", "equine", "pony/ponies|poney/poneys|pony/pony|poni/ponis|pónei/póneis|Pony/Ponys|kuc/kuce|pony/pony's"],
  ["donkey", "equine", "donkey/donkeys|âne/ânes|asino/asini|burro/burros|burro/burros|Esel/Esel|osioł/osły|ezel/ezels"],
  ["mule", "equine", "mule/mules|mulet/mulets|mulo/muli|mula/mulas|mula/mulas|Maultier/Maultiere|muł/muły|muildier/muildieren"],
  // farm animals
  ["cattle", "farm", "cow/cattle|bovin/bovins|bovino/bovini|bovino/bovinos|bovino/bovinos|Rind/Rinder|bydło/bydło|rund/runderen"],
  ["sheep", "farm", "sheep/sheep|mouton/moutons|pecora/pecore|oveja/ovejas|ovelha/ovelhas|Schaf/Schafe|owca/owce|schaap/schapen"],
  ["goat", "farm", "goat/goats|chèvre/chèvres|capra/capre|cabra/cabras|cabra/cabras|Ziege/Ziegen|koza/kozy|geit/geiten"],
  ["pig", "farm", "pig or mini pig/pigs and mini pigs|cochon ou mini-cochon/cochons et mini-cochons|maiale o minipig/maiali e minipig|cerdo o minipig/cerdos y minipigs|porco ou mini porco/porcos e mini porcos|Schwein oder Minischwein/Schweine und Minischweine|świnia lub miniświnka/świnie i miniświnki|varken of minivarken/varkens en minivarkens"],
  ["camelid", "farm", "alpaca or llama/alpacas and llamas|alpaga ou lama/alpagas et lamas|alpaca o lama/alpaca e lama|alpaca o llama/alpacas y llamas|alpaca ou lama/alpacas e lamas|Alpaka oder Lama/Alpakas und Lamas|alpaka lub lama/alpaki i lamy|alpaca of lama/alpaca's en lama's"],
  ["other", null, "other animal/other animals|autre animal/autres animaux|altro animale/altri animali|otro animal/otros animales|outro animal/outros animais|anderes Tier/andere Tiere|inne zwierzę/inne zwierzęta|ander dier/andere dieren"],
];

const RAW_CATEGORIES: [string, string][] = [
  ["rodent", "rodents|rongeurs|roditori|roedores|roedores|Nagetiere|gryzonie|knaagdieren"],
  ["small_mammal", "other small mammals|autres petits mammifères|altri piccoli mammiferi|otros pequeños mamíferos|outros pequenos mamíferos|andere Kleinsäuger|inne małe ssaki|andere kleine zoogdieren"],
  ["bird", "birds|oiseaux|uccelli|aves|aves|Vögel|ptaki|vogels"],
  ["reptile", "reptiles|reptiles|rettili|reptiles|répteis|Reptilien|gady|reptielen"],
  ["aquatic", "fish and amphibians|poissons et amphibiens|pesci e anfibi|peces y anfibios|peixes e anfíbios|Fische und Amphibien|ryby i płazy|vissen en amfibieën"],
  ["equine", "equines (horses, ponies, donkeys)|équidés (chevaux, poneys, ânes)|equini (cavalli, pony, asini)|equinos (caballos, ponis, burros)|equinos (cavalos, póneis, burros)|Equiden (Pferde, Ponys, Esel)|koniowate (konie, kuce, osły)|paardachtigen (paarden, pony's, ezels)"],
  ["farm", "farm animals|animaux de ferme|animali da fattoria|animales de granja|animais de quinta|Nutztiere|zwierzęta gospodarskie|landbouwhuisdieren"],
];

export const SPECIES: Species[] = RAW_SPECIES.map(([code, category, n]) => ({ code, category, names: names(n) }));
export const CATEGORIES: Category[] = RAW_CATEGORIES.map(([code, n]) => ({ code, names: names(n), members: SPECIES.filter((s) => s.category === code).map((s) => s.code) }));
/** Every value a pet's species may take (also kept in the database check, migration 0019). Categories are allowed for pets added before. */
export const PET_SPECIES_CODES = [...SPECIES.map((s) => s.code), ...CATEGORIES.map((c) => c.code)];

const BY_CODE = new Map<string, Species | Category>([...SPECIES.map((s) => [s.code, s] as const), ...CATEGORIES.map((c) => [c.code, c] as const)]);
export const isCategory = (code: string) => CATEGORIES.some((c) => c.code === code);
export const categoryOf = (code: string) => SPECIES.find((s) => s.code === code)?.category ?? null;

const langKey = (lang: string) => { const l = lang.slice(0, 2); return (SPECIES_LANGS as readonly string[]).includes(l) ? l : "en"; };
const cap = (s: string) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);

/** "Chien" / "Chiens" / "Rongeurs" in the visitor's language (English when the language is missing). */
export function speciesName(code: string, lang: string, plural = false, capital = true): string {
  const x = BY_CODE.get(code);
  if (!x) return code;
  const n = x.names[langKey(lang)] ?? x.names.en;
  const s = plural ? n.pl : n.sg;
  return capital ? cap(s) : s;
}

/** Codes that mean "this animal is treated", for a vet profile query: the animal itself, its category, or (for a category) any member. */
export function codesTreating(code: string): string[] {
  if (code === "exotic") return [...EXOTIC_GROUP.flatMap((c) => [c, ...(CATEGORIES.find((k) => k.code === c)?.members ?? [])])];
  if (isCategory(code)) return [code, ...(CATEGORIES.find((c) => c.code === code)?.members ?? [])];
  const cat = categoryOf(code);
  return cat ? [code, cat] : [code];
}

/** Does a vet with these animals treat this one? */
export function treats(vetSpecies: string[], code: string): boolean {
  const set = new Set(vetSpecies);
  return codesTreating(code).some((c) => set.has(c));
}

/**
 * Picking in a category: ticking the category keeps only the category code ("all"); ticking every member also becomes the
 * category; unticking one member of a fully ticked category keeps the other members.
 */
export function toggleSpecies(value: string[], code: string, on: boolean): string[] {
  const cat = CATEGORIES.find((c) => c.code === code);
  if (cat) {
    const rest = value.filter((v) => v !== cat.code && !cat.members.includes(v));
    return on ? [...rest, cat.code] : rest;
  }
  const parent = CATEGORIES.find((c) => c.members.includes(code));
  if (!parent) return on ? [...new Set([...value, code])] : value.filter((v) => v !== code);
  let picked = value.includes(parent.code) ? [...parent.members] : parent.members.filter((m) => value.includes(m));
  picked = on ? [...new Set([...picked, code])] : picked.filter((m) => m !== code);
  const rest = value.filter((v) => v !== parent.code && !parent.members.includes(v));
  if (picked.length === parent.members.length) return [...rest, parent.code];
  return [...rest, ...parent.members.filter((m) => picked.includes(m))];
}

/** Is this animal (or category) ticked, directly or through its category? */
export const speciesChecked = (value: string[], code: string) => value.includes(code) || (!!categoryOf(code) && value.includes(categoryOf(code)!));

/** Short readable summary of a vet's animals: "Chiens, chats, rongeurs (cochons d'Inde, hamsters)". */
export function speciesSummary(value: string[], lang: string): string[] {
  const out: string[] = [];
  for (const c of COMMON) if (value.includes(c)) out.push(speciesName(c, lang, true));
  for (const cat of CATEGORIES) {
    if (value.includes(cat.code)) { out.push(speciesName(cat.code, lang, true)); continue; }
    const some = cat.members.filter((m) => value.includes(m));
    if (some.length) out.push(`${speciesName(cat.code, lang, true)} (${some.map((m) => speciesName(m, lang, true, false)).join(", ")})`);
  }
  if (value.includes("other")) out.push(speciesName("other", lang, true));
  return out;
}

// ---------------------------------------------------------------- species pages (SEO)
/** The "exotic pets" page (NAC in French): every animal that is not a dog, a cat, an equine or a farm animal. */
export const EXOTIC_GROUP = ["rabbit", "rodent", "small_mammal", "bird", "reptile", "aquatic"];
const EXOTIC_NAMES = names("exotic pet/exotic pets|NAC/NAC|animale esotico/animali esotici|animal exótico/animales exóticos|animal exótico/animais exóticos|Exot/Exoten|zwierzę egzotyczne/zwierzęta egzotyczne|exotisch dier/exotische dieren");

/** Every page: common animals, categories, the exotic group, then each animal of a category. */
export const SPECIES_PAGES: string[] = [...COMMON, "exotic", ...CATEGORIES.map((c) => c.code), ...SPECIES.filter((s) => s.category).map((s) => s.code)];

const PAGE_PREFIX: Record<string, string> = { fr: "veterinaire-", it: "veterinario-", en: "vet-for-", es: "veterinario-", pt: "veterinario-", de: "tierarzt-", pl: "weterynarz-", nl: "dierenarts-" };
const slugOf = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/ß/g, "ss").replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Name of a page's animal in a language (the exotic group has its own name). */
export function pageName(code: string, lang: string, plural = true, capital = true): string {
  if (code === "exotic") { const n = EXOTIC_NAMES[langKey(lang)] ?? EXOTIC_NAMES.en; const s = plural ? n.pl : n.sg; return capital ? cap(s) : s; }
  return speciesName(code, lang, plural, capital);
}

/** Address of a species page: /fr/fr/veterinaire-chats, /it/it/veterinario-roditori, /en/gb/vet-for-guinea-pigs … */
export function speciesSlug(code: string, lang: string): string {
  const l = langKey(lang);
  const n = code === "exotic" ? (l === "fr" ? "nac" : (EXOTIC_NAMES[l] ?? EXOTIC_NAMES.en).pl) : (BY_CODE.get(code)?.names[l] ?? BY_CODE.get(code)?.names.en)?.pl ?? code;
  // categories with a long name keep only the main word ("équidés (chevaux, poneys, ânes)" → "equides")
  return PAGE_PREFIX[l] + slugOf(n);
}

export function speciesFromSlug(lang: string, slug: string): string | undefined {
  return SPECIES_PAGES.find((c) => speciesSlug(c, lang) === slug);
}
