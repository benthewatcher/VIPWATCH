import { z } from 'zod';

export const CommissionCopySchema = z.object({
  summary_en: z.string().describe('1–3 sentences in English. ~30–60 words.'),
  summary_ar: z.string().describe('Same idea in Modern Standard Arabic. Direct, not ornate.'),
  body_en: z.string().describe('4–8 short paragraphs in English. ~250–500 words. Plain text, no Markdown.'),
  body_ar: z.string().describe('Same body adapted for Modern Standard Arabic. Match the tone, not the literal sentence structure.'),
});

export type CommissionCopy = z.infer<typeof CommissionCopySchema>;

export interface CommissionContext {
  title_en?: string;
  watch_model?: string;
  client_initials?: string;
  brief?: string;
}
