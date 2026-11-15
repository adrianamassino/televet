import fs from "node:fs";
import path from "node:path";

/** @type {import('next').NextConfig} */
/** One 301 per migrated article, read from content/blog/<lang>/<slug>.md (/post/<slug> → /fr/fr/blog/<slug>). */
function wixPostRedirects() {
  const root = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).flatMap((d) =>
    fs.readdirSync(path.join(root, d.name)).filter((f) => f.endsWith(".md")).map((f) => {
      const slug = f.slice(0, -3);
      return { source: d.name === "fr" ? `/post/${slug}` : `/${d.name}/post/${slug}`, destination: `/${d.name}/${d.name}/blog/${slug}`, permanent: true };
    }));
}

const nextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  // 301 redirects from the current Wix site so existing Google rankings are kept
  async redirects() {
    return [
      { source: "/veterinaire", destination: "/fr/fr/pro", permanent: true },
      { source: "/services-veterinaires-1-2", destination: "/fr/fr/", permanent: true },
      { source: "/blog", destination: "/fr/fr/blog", permanent: true },
      // Wix category/tag pages have no equivalent: send them to the blog index
      { source: "/blog/categories/:path*", destination: "/fr/fr/blog", permanent: true },
      { source: "/blog/tags/:path*", destination: "/fr/fr/blog", permanent: true },
      { source: "/it/blog", destination: "/it/it/blog", permanent: true },
      ...wixPostRedirects(),
    ];
  },
};
export default nextConfig;
