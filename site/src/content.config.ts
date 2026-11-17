import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Zie docs/schrijfwijzer.md voor de opbouw van elke soort tekst.
const bron = z.object({ naam: z.string(), url: z.url() });
const basis = {
  titel: z.string(),
  volgorde: z.number(),
  kort: z.string(),
  status: z.enum(['concept', 'nagekeken', 'officieel']),
  bronnen: z.array(bron).min(1),
  nagekeken_door: z.string().optional(),
  datum: z.string(),
};

const scenarios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/scenarios' }),
  schema: z.object({
    ...basis,
    stappen: z.array(z.string()).min(3).max(8),
    niet: z.array(z.string()).optional(),
  }),
});

const gidsen = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/gidsen' }),
  schema: z.object({
    ...basis,
    module: z.enum(['schuilen', 'nucleair', 'water', 'voedsel', 'warmte', 'energie', 'hygiene', 'evacuatie', 'communicatie', 'dieren', 'voorbereiding', 'gezondheid', 'buiten']),
  }),
});

const eerstehulp = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/eerstehulp' }),
  schema: z.object(basis),
});

export const collections = { scenarios, gidsen, eerstehulp };
