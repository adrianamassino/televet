/**
 * Reads every row of a query in pages: the Supabase API returns at most 1,000 rows per request,
 * so a plain .limit(50000) silently stops at 1,000. `make(from, to)` must build the query with .range(from, to).
 */
export async function fetchAll<T>(make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, max = 200000, page = 1000): Promise<{ data: T[]; error: { message: string } | null }> {
  const out: T[] = [];
  for (let from = 0; from < max; from += page) {
    const { data, error } = await make(from, from + page - 1);
    if (error) return { data: out, error };
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return { data: out, error: null };
}
