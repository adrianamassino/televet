import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readPost } from "@/lib/blog";
import { SITE, ldJson, breadcrumbLd } from "@/lib/seo";

type P = { params: Promise<{ lang: string; country: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, slug } = await params;
  const post = readPost(lang, decodeURIComponent(slug));
  if (!post) return {};
  const url = `${SITE}/${lang}/${country}/blog/${slug}`;
  return {
    title: post.title, description: post.description,
    alternates: { canonical: url },            // articles exist in one language only: no hreflang
    openGraph: { type: "article", title: post.title, description: post.description, url, siteName: "Televet", publishedTime: post.published, modifiedTime: post.modified, images: post.cover ? [{ url: `${SITE}${post.cover}` }] : undefined },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPost({ params }: P) {
  const { lang, country, slug } = await params;
  const post = readPost(lang, decodeURIComponent(slug));
  if (!post) notFound();
  const url = `${SITE}/${lang}/${country}/blog/${slug}`;
  const ld = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, inLanguage: lang,
    datePublished: post.published, dateModified: post.modified, mainEntityOfPage: url, image: post.cover ? `${SITE}${post.cover}` : undefined,
    author: { "@type": "Organization", name: "Televet" }, publisher: { "@type": "Organization", name: "Televet", logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
  };
  return (
    <main className="wrap narrow prose">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([{ name: "Televet", url: `${SITE}/${lang}/${country}/` }, { name: "Blog", url: `${SITE}/${lang}/${country}/blog` }, { name: post.title, url }])) }} />
      <article>
        <h1>{post.title}</h1>
        <p><small>{post.author} · {new Date(post.published).toLocaleDateString(lang)}</small></p>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </main>
  );
}
