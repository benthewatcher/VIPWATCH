'use server';

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { BRAND_VOICE } from './voice';
import {
  CommissionCopySchema,
  type CommissionContext,
  type CommissionCopy,
} from './commission-schema';

const anthropic = new Anthropic();

/**
 * Generate bilingual (EN + AR) summary and body copy for a commission, in the
 * locked VIP WATCH voice from docs/COPY.md. Brand-voice prefix is prompt-cached
 * (~1.25× write, ~0.1× read after the first call).
 *
 * Uses Claude Opus 4.7 with adaptive thinking. Returns parsed JSON conforming
 * to CommissionCopySchema or throws on parse failure / API error.
 */
export async function generateCommissionCopy(ctx: CommissionContext): Promise<CommissionCopy> {
  const userBrief = [
    ctx.title_en ? `Title (EN): ${ctx.title_en}` : null,
    ctx.watch_model ? `Watch model: ${ctx.watch_model}` : null,
    ctx.client_initials ? `Client initials: ${ctx.client_initials}` : null,
    ctx.brief ? `Additional brief: ${ctx.brief}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  if (!userBrief) {
    throw new Error('At least one of title, watch_model, client_initials, or brief is required.');
  }

  const response = await anthropic.messages.parse({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: {
        type: 'json_schema',
        schema: z.toJSONSchema(CommissionCopySchema),
      },
    },
    system: [
      {
        type: 'text',
        text: BRAND_VOICE,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Write summary and body copy for this VIP WATCH commission, in the voice you've been given.

${userBrief}

Return JSON only. Plain text strings — no Markdown.`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error('Model did not return valid JSON for commission copy.');
  }

  return response.parsed_output as CommissionCopy;
}
