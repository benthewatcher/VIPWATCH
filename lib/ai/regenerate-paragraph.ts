'use server';

import Anthropic from '@anthropic-ai/sdk';
import { BRAND_VOICE } from './voice';

const anthropic = new Anthropic();

export type RegenerateInput = {
  /** Title (EN) of the commission. */
  title_en?: string | null;
  watch_model?: string | null;
  client_initials?: string | null;
  /** Body text of paragraphs that come BEFORE this one, in order. */
  preceding_paragraphs_en: string[];
  /** Current text of the paragraph to rewrite. May be empty if creating new. */
  current_en: string | null;
  /** Free-text instruction from the user, e.g. "make it shorter, lean into the colour". */
  instruction?: string | null;
};

export type RegenerateOutput = {
  body_en: string;
  body_fr: string;
};

/**
 * Rewrite a single paragraph in the locked VIP WATCH voice using Haiku 4.5.
 * Brand voice prefix is prompt-cached. Returns EN + AR rewrites.
 */
export async function regenerateParagraph(input: RegenerateInput): Promise<RegenerateOutput> {
  const ctxLines = [
    input.title_en ? `Title: ${input.title_en}` : null,
    input.watch_model ? `Watch: ${input.watch_model}` : null,
    input.client_initials ? `Client: ${input.client_initials}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const preceding = input.preceding_paragraphs_en.length
    ? input.preceding_paragraphs_en.map((p, i) => `[Paragraph ${i + 1}]\n${p}`).join('\n\n')
    : '(none — this is the first paragraph)';

  const currentBlock = input.current_en?.trim()
    ? `Current text of the paragraph to rewrite:\n${input.current_en}`
    : 'There is no current text — write a new paragraph from scratch that fits the position.';

  const userMessage = `Rewrite ONE paragraph for this VIP WATCH commission, in the voice you've been given.

Commission context:
${ctxLines || '(no context provided)'}

What's already been written, in order:
${preceding}

${currentBlock}

${input.instruction?.trim() ? `Instruction from the writer: ${input.instruction}` : 'No specific instruction — improve the paragraph while keeping its meaning. Continue the narrative naturally from the preceding paragraphs.'}

Return JSON only with this exact shape:
{"body_en": "<one paragraph in English>", "body_fr": "<the same paragraph in Arabic>"}

Plain text. No Markdown. Keep paragraph length similar to surrounding paragraphs.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: BRAND_VOICE,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  // Strip markdown code fences if the model wrapped the JSON.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let parsed: { body_en?: string; body_fr?: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Model did not return valid JSON.');
  }
  if (!parsed.body_en) throw new Error('Model returned empty body_en.');

  return {
    body_en: parsed.body_en,
    body_fr: parsed.body_fr ?? '',
  };
}
