// Markdown content (patient education + legal pages), read at build time and rendered to HTML.
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { z } from 'zod';
import { ArticleFrontmatter, LegalFrontmatter } from './schemas';
import { ContentError, parseFile } from './load';

const root = path.join(process.cwd(), 'content');

function readDir<T extends z.ZodTypeAny>(dir: string, schema: T) {
  const full = path.join(root, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(full, f), 'utf8'));
      const meta = parseFile(`${dir}/${f}`, schema, data) as z.infer<T> & { slug: string };
      if (`${meta.slug}.md` !== f) throw new ContentError(`${dir}/${f}`, `slug "${meta.slug}" must match the file name`);
      const html = marked.parse(content, { async: false }) as string;
      const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
      const words = content.split(/\s+/).filter(Boolean).length;
      return { meta, html, headings, words };
    });
}

export const articles = readDir('education', ArticleFrontmatter).sort((a, b) => Number(b.meta.featured) - Number(a.meta.featured));
export const legalPages = readDir('legal', LegalFrontmatter);

export const getArticle = (slug: string) => articles.find((a) => a.meta.slug === slug);
export const getLegal = (slug: string) => legalPages.find((l) => l.meta.slug === slug);
