import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const scenarios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/scenarios' }),
  schema: z.object({
    titel: z.string(),
    volgorde: z.number(),
    kort: z.string(),
    stappen: z.array(z.string()).min(3).max(7),
    niet: z.array(z.string()).optional(),
    status: z.enum(['concept', 'nagekeken', 'officieel']),
    bronnen: z.array(z.object({ naam: z.string(), url: z.url() })).min(1),
    nagekeken_door: z.string().optional(),
    datum: z.string(),
  }),
});

export const collections = { scenarios };
