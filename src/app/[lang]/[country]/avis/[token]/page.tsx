import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { pick } from "@/lib/pick";
import { ReviewForm } from "./ReviewForm";
import "../../home-brand.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Televet", robots: { index: false, follow: false } };
type P = { params: Promise<{ lang: string; country: string; token: string }>; searchParams: Promise<{ r?: string }> };

const COPY: Record<string, any> = {
  fr: { title: "Votre avis sur Televet", sub: "Touchez une étoile", comment: "Un commentaire ? (facultatif)", placeholder: "Racontez-nous votre expérience…", send: "Envoyer mon avis", sending: "Envoi…", thanks: "Merci pour votre retour. Nous allons l'utiliser pour nous améliorer.", thanks5: "Merci, c'est un grand plaisir ! Si vous avez une minute, partagez votre expérience sur Google : cela aide d'autres propriétaires à nous trouver.", googleBtn: "Laisser un avis sur Google", copy: "Copier mon commentaire", copied: "Commentaire copié : collez-le sur Google", done: "Merci, votre avis a bien été enregistré.", err: "L'envoi a échoué. Réessayez dans un instant.", labels: ["Très déçu", "Décevant", "Correct", "Bien", "Parfait"] },
  it: { title: "La tua opinione su Televet", sub: "Tocca una stella", comment: "Vuoi aggiungere un commento? (facoltativo)", placeholder: "Raccontaci la tua esperienza…", send: "Invia la mia valutazione", sending: "Invio…", thanks: "Grazie per il tuo riscontro. Lo useremo per migliorare.", thanks5: "Grazie, ci fa molto piacere! Se hai un minuto, condividi la tua esperienza su Google: aiuta altri proprietari a trovarci.", googleBtn: "Lascia una recensione su Google", copy: "Copia il mio commento", copied: "Commento copiato: incollalo su Google", done: "Grazie, la tua valutazione è stata registrata.", err: "Invio non riuscito. Riprova tra un attimo.", labels: ["Molto deluso", "Deludente", "Sufficiente", "Bene", "Perfetto"] },
  en: { title: "Your feedback on Televet", sub: "Tap a star", comment: "Add a comment? (optional)", placeholder: "Tell us about your experience…", send: "Send my feedback", sending: "Sending…", thanks: "Thank you for your feedback. We'll use it to improve.", thanks5: "Thank you, that means a lot! If you have a minute, share your experience on Google — it helps other pet owners find us.", googleBtn: "Leave a Google review", copy: "Copy my comment", copied: "Comment copied — paste it on Google", done: "Thank you, your feedback has been recorded.", err: "Sending failed. Please try again in a moment.", labels: ["Very disappointed", "Disappointing", "Okay", "Good", "Perfect"] },
  es: { title: "Tu opinión sobre Televet", sub: "Tocá una estrella", comment: "¿Querés agregar un comentario? (opcional)", placeholder: "Contanos cómo fue tu experiencia…", send: "Enviar mi opinión", sending: "Enviando…", thanks: "Gracias por tu opinión. La usaremos para mejorar.", thanks5: "¡Gracias, nos alegra mucho! Si tenés un minuto, compartí tu experiencia en Google: ayuda a otros dueños a encontrarnos.", googleBtn: "Dejar una reseña en Google", copy: "Copiar mi comentario", copied: "Comentario copiado: pegalo en Google", done: "Gracias, tu opinión quedó registrada.", err: "No se pudo enviar. Probá de nuevo en un momento.", labels: ["Muy decepcionado", "Decepcionante", "Regular", "Bien", "Perfecto"] },
  pt: { title: "A sua opinião sobre a Televet", sub: "Toque numa estrela", comment: "Quer deixar um comentário? (opcional)", placeholder: "Conte-nos a sua experiência…", send: "Enviar a minha opinião", sending: "A enviar…", thanks: "Obrigado pelo seu feedback. Vamos usá-lo para melhorar.", thanks5: "Obrigado, ficamos muito contentes! Se tiver um minuto, partilhe a sua experiência no Google: ajuda outros tutores a encontrar-nos.", googleBtn: "Deixar uma avaliação no Google", copy: "Copiar o meu comentário", copied: "Comentário copiado: cole-o no Google", done: "Obrigado, a sua opinião foi registada.", err: "O envio falhou. Tente novamente daqui a pouco.", labels: ["Muito desiludido", "Desiludido", "Razoável", "Bom", "Perfeito"] },
  de: { title: "Ihre Meinung zu Televet", sub: "Tippen Sie auf einen Stern", comment: "Möchten Sie einen Kommentar hinzufügen? (optional)", placeholder: "Erzählen Sie uns von Ihrer Erfahrung…", send: "Bewertung senden", sending: "Wird gesendet…", thanks: "Danke für Ihr Feedback. Wir nutzen es, um besser zu werden.", thanks5: "Vielen Dank, das freut uns sehr! Wenn Sie eine Minute haben, teilen Sie Ihre Erfahrung auf Google – das hilft anderen Tierhaltern, uns zu finden.", googleBtn: "Google-Bewertung abgeben", copy: "Meinen Kommentar kopieren", copied: "Kommentar kopiert – bei Google einfügen", done: "Danke, Ihre Bewertung wurde gespeichert.", err: "Senden fehlgeschlagen. Bitte versuchen Sie es gleich erneut.", labels: ["Sehr enttäuscht", "Enttäuschend", "In Ordnung", "Gut", "Perfekt"] },
  pl: { title: "Twoja opinia o Televet", sub: "Dotknij gwiazdki", comment: "Chcesz dodać komentarz? (opcjonalnie)", placeholder: "Opowiedz nam o swoim doświadczeniu…", send: "Wyślij opinię", sending: "Wysyłanie…", thanks: "Dziękujemy za opinię. Wykorzystamy ją, by być lepszymi.", thanks5: "Dziękujemy, bardzo nam miło! Jeśli masz minutę, podziel się opinią w Google – pomoże to innym opiekunom nas znaleźć.", googleBtn: "Dodaj opinię w Google", copy: "Skopiuj mój komentarz", copied: "Komentarz skopiowany – wklej go w Google", done: "Dziękujemy, Twoja opinia została zapisana.", err: "Nie udało się wysłać. Spróbuj ponownie za chwilę.", labels: ["Bardzo rozczarowany", "Rozczarowujące", "W porządku", "Dobrze", "Idealnie"] },
  nl: { title: "Uw mening over Televet", sub: "Tik op een ster", comment: "Wilt u een opmerking toevoegen? (optioneel)", placeholder: "Vertel ons over uw ervaring…", send: "Beoordeling versturen", sending: "Versturen…", thanks: "Bedankt voor uw feedback. We gebruiken die om te verbeteren.", thanks5: "Bedankt, dat doet ons veel plezier! Heeft u een minuut? Deel uw ervaring op Google: zo vinden andere dierhouders ons.", googleBtn: "Google-review achterlaten", copy: "Mijn opmerking kopiëren", copied: "Opmerking gekopieerd – plak hem in Google", done: "Bedankt, uw beoordeling is opgeslagen.", err: "Versturen mislukt. Probeer het zo opnieuw.", labels: ["Zeer teleurgesteld", "Teleurstellend", "Prima", "Goed", "Perfect"] },
};

export default async function ReviewPage({ params, searchParams }: P) {
  const { lang, country, token } = await params, { r } = await searchParams;
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang) || !/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { data } = await adminClient().from("bookings").select("review_rating, practices(name)").eq("review_token", token).maybeSingle();
  if (!data) notFound();
  const c = pick(COPY, lang, country), init = Number(r);
  return (
    <main className="tv tv-page">
      <div className="tv-page-hero"><div className="tv-wrap"><h1>{c.title}</h1></div></div>
      <div className="tv-wrap tv-page-body tv-rv-wrap">
        <ReviewForm c={c} token={token} initial={init >= 1 && init <= 5 ? init : 0} already={!!data.review_rating} practice={(data as unknown as { practices: { name: string } }).practices?.name ?? ""} />
      </div>
    </main>
  );
}
