'use server';

import Anthropic from '@anthropic-ai/sdk';
import { BRAND_VOICE } from './voice';

const anthropic = new Anthropic();

/**
 * Rewrite a single paragraph in the locked VIP WATCH voice using Haiku 4.5.
 * Brand voice prefix is prompt-cached. Returns EN + AR rewrites.
 *
 * Note: 'use server' files can only export async functions, so input/output
 * types are inlined here rather than exported.
 */
export async function regenerateParagraph(input: {
  title_en?: string | null;
  watch_model?: string | null;
  client_initials?: string | null;
  preceding_paragraphs_en: string[];
  current_en: string | null;
  instruction?: string | null;
}): Promise<{ body_en: string; body_fr: string }> {
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

/**
 * Rewrite the SUMMARY for a commission — short, 1-2 sentences, in the brand
 * voice. Uses the body paragraphs as context so the summary matches the story.
 */
export async function regenerateSummary(input: {
  title_en?: string | null;
  watch_model?: string | null;
  client_initials?: string | null;
  body_paragraphs_en: string[];
  current_summary_en: string | null;
  instruction?: string | null;
}): Promise<{ summary_en: string; summary_fr: string }> {
  const ctxLines = [
    input.title_en ? `Title: ${input.title_en}` : null,
    input.watch_model ? `Watch: ${input.watch_model}` : null,
    input.client_initials ? `Client: ${input.client_initials}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const story = input.body_paragraphs_en.length
    ? input.body_paragraphs_en.join('\n\n')
    : '(no body paragraphs yet)';

  const userMessage = `Write a SUMMARY for this VIP WATCH commission, in the voice you've been given.

Commission context:
${ctxLines || '(no context provided)'}

The body story (use this as the source of truth for what the commission is about):
${story}

${input.current_summary_en?.trim() ? `Current summary: ${input.current_summary_en}` : ''}
${input.instruction?.trim() ? `Instruction: ${input.instruction}` : ''}

The summary appears in the page hero subtitle, the meta description tag, and link previews. Keep it to 1-2 short sentences. No headlines, no marketing fluff. Tonal continuity with the body.

Return JSON only: {"summary_en": "...", "summary_fr": "..."}

Plain text. No Markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
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
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let parsed: { summary_en?: string; summary_fr?: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Model did not return valid JSON.');
  }
  if (!parsed.summary_en) throw new Error('Model returned empty summary_en.');

  return {
    summary_en: parsed.summary_en,
    summary_fr: parsed.summary_fr ?? '',
  };
}
