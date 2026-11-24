import { z } from 'zod'

const id = z.union([z.string(), z.number()]).transform(String)
const text = z.string().nullish().transform((value) => value ?? '')
const result = z.object({ id, t: text })

export const verificationSchema = z.object({ c: text, statusup: text })
export const statusSchema = z.object({ status: z.string().optional(), error: z.unknown().optional() })
export const searchSchema = z.object({
  status: z.string(),
  type: z.coerce.number(),
  searchResult: z.union([
    z.array(result),
    z.record(z.string(), z.object({ r: z.array(result), ott: text, error: text })),
  ]),
})

export const episodeSchema = z.object({ id, t: text, s: text, ep: text, time: text })

export const titleSchema = z.object({
  status: z.literal('y'),
  title: z.string(),
  year: text,
  desc: text,
  type: z.string(),
  season: z.array(z.object({ id, s: text, ep: z.coerce.number().catch(0) })).nullish(),
  episodes: z.array(episodeSchema).nullish(),
})

export const episodesSchema = z.object({
  episodes: z.array(episodeSchema),
  nextPageShow: z.coerce.number().optional(),
  nextPage: z.coerce.number().optional(),
})
