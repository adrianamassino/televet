import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/lib/blog";
import { pageMetadata, SITE, ldJson, breadcrumbLd } from "@/lib/seo";

type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params;
  return pageMetadata({ title: "Blog — Conseils vétérinaires | Televet", description: "Guides et conseils de vétérinaires pour la santé de votre chien, chat ou NAC.", lang, country, path: (l, c) => `/${l}/${c}/blog`, onlyCountry: country.toUpperCase(), index: listPosts(lang).length > 0 });
}

export default async function BlogIndex({ params }: P) {
  const { lang, country } = await params;
  const posts = listPosts(lang);
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([{ name: "Televet", url: `${SITE}/${lang}/${country}/` }, { name: "Blog", url: `${SITE}/${lang}/${country}/blog` }])) }} />
      <h1>Blog</h1>
      <ul className="cards">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/${lang}/${country}/blog/${p.slug}`}><h3>{p.title}</h3></Link>
            <small>{p.category && `${p.category} · `}{new Date(p.published).toLocaleDateString(lang)}</small>
            <p>{p.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
