import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { getCoverage } from "@/lib/coverage";
import {
  askClaude, buildSystemPrompt, clientIp, pickLocale, ctaLabel, ctaUrl, fallbackTurn, finalizeTurn, ipHash, LIMITS,
  maxUrgency, normalizeHistory, parseTurn, stripLinks, type Audience, type BotTurn, type Urgency,
} from "@/lib/chat";

export const maxDuration = 60;

const Body = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(LIMITS.messageChars),
  lang: z.string().max(5).optional(),
  country: z.string().max(3).optional(),
  page: z.string().max(200).optional(),
  localized: z.boolean().optional(),   // true when the page URL carries /{lang}/{country}/
});

/**
 * POST /api/chat { conversationId?, message, lang, country, page }
 * Stores the visitor message, asks Claude, stores the answer, returns { conversationId, reply, ctas, urgency }.
 * The history is always read from the database (never trusted from the browser).
 */
export const POST = handle(async (req) => {
  const body = Body.parse(await req.json().catch(() => ({})));
  const { lang, country } = pickLocale(body, req.headers);
  const page = (body.page ?? "").replace(/[?#].*$/, "").slice(0, 200);
  const db = adminClient();
  const hash = ipHash(clientIp(req));
  const now = Date.now();

  // --- cost / abuse protection
  const hourAgo = new Date(now - 3600_000).toISOString(), dayAgo = new Date(now - 86_400_000).toISOString();
  const [perIp, perDay] = await Promise.all([
    db.from("chat_messages").select("id", { count: "exact", head: true }).eq("role", "user").eq("ip_hash", hash).gte("created_at", hourAgo),
    db.from("chat_messages").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", dayAgo),
  ]);
  if ((perIp.count ?? 0) >= LIMITS.perIpPerHour) throw new HttpError(429, "rate_limited");
  if ((perDay.count ?? 0) >= Number(process.env.CHAT_DAILY_LIMIT || 3000)) throw new HttpError(429, "busy");

  // --- conversation
  type Conv = { id: string; audience: Audience; urgency: Urgency; topic: string | null; message_count: number; status: string };
  let conv: Conv | null = null;
  if (body.conversationId) {
    const { data } = await db.from("chat_conversations").select("id, audience, urgency, topic, message_count, status").eq("id", body.conversationId).maybeSingle();
    conv = data as Conv | null;
  }
  if (conv && conv.message_count >= LIMITS.perConversation * 2) throw new HttpError(429, "conversation_too_long");
  if (!conv) {
    const { data, error } = await db.from("chat_conversations").insert({ lang, country, page_path: page || null }).select("id, audience, urgency, topic, message_count, status").single();
    if (error || !data) throw new Error(error?.message ?? "insert failed");
    conv = data as Conv;
  }

  await db.from("chat_messages").insert({ conversation_id: conv.id, role: "user", content: body.message, ip_hash: hash });

  // --- ask Claude with the last messages of this conversation
  const { data: rows } = await db.from("chat_messages").select("role, content").eq("conversation_id", conv.id).order("id", { ascending: false }).limit(LIMITS.historyMessages);
  const history = normalizeHistory((rows ?? []).reverse() as { role: "user" | "assistant"; content: string }[]);
  const cov = await getCoverage();
  const live = cov && Object.keys(cov).length > 0 ? cov : null;   // nothing published yet (pre-launch) = no filtering
  let turn: BotTurn, model = process.env.CHAT_MODEL || "claude-sonnet-5-5", failed = false;
  try {
    const text = await askClaude(buildSystemPrompt({ lang, country, page, coverage: cov }), history);
    const parsed = parseTurn(text);
    // the model forgot the JSON: keep its text (links removed) rather than lose the answer
    turn = parsed ?? { ...fallbackTurn(lang, conv.audience), reply: stripLinks(text).slice(0, 1800) || fallbackTurn(lang, conv.audience).reply, needs_human: false };
  } catch (e) {
    console.error("chat model error", e);
    turn = fallbackTurn(lang, conv.audience); failed = true; model = "fallback";
  }
  turn = finalizeTurn(turn, body.message, conv.audience, live ? (live[country] ?? { video: 0, home: 0, clinic: 0 }) : null);
  const ctas = turn.cta.map((key) => ({ key, label: ctaLabel(key, lang), url: ctaUrl(key, lang, country) }));

  await db.from("chat_messages").insert({ conversation_id: conv.id, role: "assistant", content: turn.reply, meta: { cta: turn.cta, urgency: turn.urgency, model, failed } });
  await db.from("chat_conversations").update({
    audience: turn.audience, urgency: maxUrgency(conv.urgency, turn.urgency), topic: turn.topic || conv.topic,
    message_count: conv.message_count + 2, last_message_at: new Date().toISOString(),
    status: conv.status === "new" && turn.needs_human ? "needs_followup" : conv.status,
  }).eq("id", conv.id);

  return json({ conversationId: conv.id, reply: turn.reply, ctas, urgency: turn.urgency });
});
