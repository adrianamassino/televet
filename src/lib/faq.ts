import fr from "../../content/faq/fr.json";
/** FAQ imported from televet.co (FR). Add content/faq/<lang>.json for each translated language. */
const FAQ: Record<string, { q: string; a: string }[]> = { fr };
export const faqFor = (lang: string) => ({ items: FAQ[lang] ?? FAQ.fr, translated: lang in FAQ });
export const faqLanguages = () => Object.keys(FAQ);
