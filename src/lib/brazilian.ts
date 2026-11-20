/** Derives Brazilian Portuguese (vocabulary, spelling, pronoun use) from the European Portuguese copy. Applied to every string, deeply. */
const W = (w: string) => `(?<![\\p{L}])${w}(?![\\p{L}])`;
const word = (from: string, to: string): [RegExp, string] => [new RegExp(W(from), "gu"), to];
const cap = (from: string, to: string): [RegExp, string][] => [word(from, to), word(from[0].toUpperCase() + from.slice(1), to[0].toUpperCase() + to.slice(1))];

const R: [RegExp, string][] = [
  // progressive: "A enviar…" → "Enviando…"
  ...["enviar", "carregar", "procurar", "guardar", "processar", "verificar", "pesquisar", "aguardar"].flatMap((v) => {
    const g = v.replace(/ar$/, "ando"); return [word(`A ${v}`, g[0].toUpperCase() + g.slice(1)), word(`a ${v}`, g)] as [RegExp, string][];
  }),
  // vocabulary
  ...cap("telemóvel", "celular"), ...cap("telemóveis", "celulares"), ...cap("morada", "endereço"), ...cap("moradas", "endereços"),
  ...cap("marcar", "agendar"), ...cap("marcação", "agendamento"), ...cap("marcações", "agendamentos"), ...cap("marcado", "agendado"), ...cap("marque", "agende"),
  ...cap("contacto", "contato"), ...cap("contactos", "contatos"), ...cap("contacte", "entre em contato"), ...cap("contactar", "entrar em contato"),
  ...cap("equipa", "equipe"), ...cap("partilhar", "compartilhar"), ...cap("partilhe", "compartilhe"), ...cap("partilha", "compartilha"),
  ...cap("ecrã", "tela"), ...cap("ficheiro", "arquivo"), ...cap("ficheiros", "arquivos"), ...cap("utilizador", "usuário"), ...cap("utilizadores", "usuários"),
  ...cap("palavra-passe", "senha"), ...cap("registo", "cadastro"), ...cap("registar", "cadastrar"), ...cap("subscrição", "assinatura"),
  ...cap("descarregar", "baixar"), ...cap("transferir", "baixar"), ...cap("aceda", "acesse"), ...cap("aceder", "acessar"),
  ...cap("cão", "cachorro"), ...cap("cães", "cachorros"), ...cap("brevemente", "em breve"), ...cap("facto", "fato"), ...cap("objectivo", "objetivo"),
  [/animal de companhia/g, "animal de estimação"], [/animais de companhia/g, "animais de estimação"], [/Animal de companhia/g, "Animal de estimação"],
  [/ao domicílio/g, "a domicílio"], [/Ao domicílio/g, "A domicílio"], [/código postal/gi, "CEP"], [/iniciar sessão/gi, (m: string) => (m[0] === "I" ? "Entrar" : "entrar")] as unknown as [RegExp, string],
  [/terminar sessão/gi, "sair"] as unknown as [RegExp, string],
  // possessives without article ("o seu animal" → "seu animal")
  [/(?<![\p{L}])([Oo]) seu(?![\p{L}])/gu, (_m: string, o: string) => (o === "O" ? "Seu" : "seu")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Aa]) sua(?![\p{L}])/gu, (_m: string, o: string) => (o === "A" ? "Sua" : "sua")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Oo])s seus(?![\p{L}])/gu, (_m: string, o: string) => (o === "O" ? "Seus" : "seus")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Aa])s suas(?![\p{L}])/gu, (_m: string, o: string) => (o === "A" ? "Suas" : "suas")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Oo])s nossos(?![\p{L}])/gu, (_m: string, o: string) => (o === "O" ? "Nossos" : "nossos")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Aa])s nossas(?![\p{L}])/gu, (_m: string, o: string) => (o === "A" ? "Nossas" : "nossas")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Oo]) nosso(?![\p{L}])/gu, (_m: string, o: string) => (o === "O" ? "Nosso" : "nosso")] as unknown as [RegExp, string],
  [/(?<![\p{L}])([Aa]) nossa(?![\p{L}])/gu, (_m: string, o: string) => (o === "A" ? "Nossa" : "nossa")] as unknown as [RegExp, string],
  // enclitic pronouns
  [/liga-o a/g, "conecta você a"], [/Liga-o a/g, "Conecta você a"], [/Escreva-nos/g, "Escreva para nós"], [/Contacte-nos/g, "Fale com a gente"], [/Conte-nos/g, "Conte para nós"], [/Diga-nos/g, "Conte para nós"], [/Registe-se/g, "Cadastre-se"],
];

export function brazilian<T>(v: T): T {
  if (typeof v === "string") return R.reduce((s, [re, to]) => s.replace(re, to as string), v as string) as unknown as T;
  if (Array.isArray(v)) return v.map(brazilian) as unknown as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, brazilian(x)])) as unknown as T;
  return v;
}
