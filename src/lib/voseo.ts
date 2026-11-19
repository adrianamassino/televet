/** Derives Argentine Spanish (voseo, local vocabulary) from the neutral Spanish copy. Applied to every string, deeply. */
const R: [RegExp, string][] = [
  [/\bEres\b/g, "Sos"], [/\beres\b/g, "sos"], [/\btienes\b/g, "tenés"], [/\bpuedes\b/g, "podés"], [/\bnecesitas\b/g, "necesitás"], [/\bquieres\b/g, "querés"], [/\bestés\b/g, "estés"],
  [/\bBusca\b/g, "Buscá"], [/\bIndica\b/g, "Indicá"], [/\bElige\b/g, "Elegí"], [/\bMira\b/g, "Mirá"], [/\bReserva\b/g, "Reservá"], [/\bHabla\b/g, "Hablá"],
  [/\bRecibe\b/g, "Recibí"], [/\bCrea\b/g, "Creá"], [/\bCompleta\b/g, "Completá"], [/\bPrueba\b/g, "Probá"], [/\bEncuentra\b/g, "Encontrá"], [/\bConsulta su perfil\b/g, "Consultá su perfil"], [/\bgestiona\b/g, "gestioná"], [/\bConsulta\b(?= (?:su|el|la|los|las)\b)/g, "Consultá"],
  [/\bEscríbenos\b/g, "Escribinos"], [/\bPrefieres\b/g, "Preferís"], [/\bacude de inmediato/g, "acudí de inmediato"], [/\bcontacta\b/g, "contactá"], [/\bresponde\b/g, "responde"],
  [/\bpara ti\b/g, "para vos"], [/\bcerca de ti\b/g, "cerca tuyo"], [/\bSea cual sea tu\b/g, "Sea cual sea tu"],
  [/\bcoche\b/g, "auto"], [/\bpienso\b/g, "alimento balanceado"], [/sofá/g, "sillón"], [/\bColegio Nacional de Veterinarios\b/g, "Colegio Nacional de Veterinarios"],
  [/\bcolegiados\b/g, "matriculados"], [/\btitulados\b/g, "matriculados"], [/\btitulado\b/g, "matriculado"], [/\bdueños\b/g, "dueños"], [/\bdesplazarte\b/g, "moverte"], [/\bdesplazamientos\b/g, "traslados"], [/\bdesplazamiento\b/g, "traslado"],
  [/\bcorreo\b/g, "mail"], [/\bBienvenido\b/g, "Bienvenido"], [/\bHora\b/g, "Horario"], [/\buna hora\b/g, "un horario"], [/\bpostal\b/g, "postal"], [/\bcita\b/g, "turno"], [/\bCita\b/g, "Turno"], [/\bcitas\b/g, "turnos"], [/\bReservar cita\b/g, "Reservar turno"],
  [/\by reserva\b/g, "y reservá"], [/\bindicas\b/g, "indicás"], [/\bRecibes\b/g, "Recibís"], [/\bcompleta tu\b/g, "completá tu"], [/\bconsulta su perfil\b/g, "consultá su perfil"], [/\bReservas un\b/g, "Reservás un"], [/\bdeseas\b/g, "querés"],
];
export function voseo<T>(v: T): T {
  if (typeof v === "string") return R.reduce((s, [re, to]) => s.replace(re, to), v as string) as unknown as T;
  if (Array.isArray(v)) return v.map(voseo) as unknown as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, voseo(x)])) as unknown as T;
  return v;
}
