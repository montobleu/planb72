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
  /** Medisch, nucleair of chemisch: vertaling pas na een extra waarschuwing (zie src/lib/inhoud.ts). */
  gevoelig: z.boolean().optional(),
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

// Vertalingen: <map>/<taal>/<id>.md, met dezelfde velden als het Nederlandse origineel
// plus de nazichtstatus van de vertaling. Zie docs/vertalen.md.
const vertaling = {
  vertaling: z.enum(['machine', 'na te lezen', 'nagekeken']),
  vertaling_nagekeken_door: z.string().optional(),
  /** Datum van de Nederlandse tekst waarvan vertaald werd. */
  origineel_datum: z.union([z.string(), z.date()]).transform((d) => (typeof d === 'string' ? d : d.toISOString().slice(0, 10))),
};
const vertaald = (map: string) => glob({ pattern: '{fr,de,en}/*.md', base: `./src/content/${map}` });

const scenariosVertaald = defineCollection({
  loader: vertaald('scenarios'),
  schema: z.object({ ...basis, ...vertaling, stappen: z.array(z.string()).min(3).max(8), niet: z.array(z.string()).optional() }),
});
const gidsenVertaald = defineCollection({
  loader: vertaald('gidsen'),
  schema: z.object({ ...basis, ...vertaling, module: z.string().optional() }),
});
const eerstehulpVertaald = defineCollection({
  loader: vertaald('eerstehulp'),
  schema: z.object({ ...basis, ...vertaling }),
});

export const collections = { scenarios, gidsen, eerstehulp, scenariosVertaald, gidsenVertaald, eerstehulpVertaald };
