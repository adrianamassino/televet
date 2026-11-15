import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = path.join(process.cwd(), "content", "blog");

export type Post = { slug: string; lang: string; title: string; description: string; published: string; modified: string; author: string; category: string; cover: string };

const asDate = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? ""));

export function blogLanguages(): string[] {
  return fs.existsSync(ROOT) ? fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
}

export function listPosts(lang: string): Post[] {
  const dir = path.join(ROOT, lang);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => readPost(lang, f.slice(0, -3))!)
    .filter(Boolean).sort((a, b) => b.published.localeCompare(a.published));
}

export function readPost(lang: string, slug: string): (Post & { html: string }) | null {
  const file = path.join(ROOT, lang, `${slug}.md`);
  if (!path.resolve(file).startsWith(ROOT) || !fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug, lang, title: String(data.title), description: String(data.description ?? ""), published: asDate(data.published), modified: asDate(data.modified),
    author: String(data.author ?? "Dr. Televet"), category: String(data.category ?? ""), cover: String(data.cover ?? ""),
    html: marked.parse(content, { async: false }) as string,
  };
}

