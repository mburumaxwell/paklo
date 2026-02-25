'use server';

import { z } from 'zod';
import {
  type FeedbackType,
  FeedbackTypeSchema,
  type SubmitFeedback,
  type SubmitFeedbackResponse,
  SubmitFeedbackSchema,
} from '@/lib/feedback';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createServerAction } from '@/lib/server-action';

export type StoreFeedbackOptions = Partial<SubmitFeedback> & {
  /** Optional ID for deduplication */
  deduplicationId?: string;
  type: FeedbackType;
  metadata?: Record<string, unknown>;
};

/**
 * Store feedback from a user about something.
 * @param options The feedback options.
 */
export const storeFeedback = createServerAction({
  input: SubmitFeedbackSchema.partial().and(
    z.object({
      deduplicationId: z.string().optional(),
      type: FeedbackTypeSchema,
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  auth: false, // docs are public
  handler: async ({ input }): Promise<SubmitFeedbackResponse> => {
    const { deduplicationId, ...remaining } = input;

    const id = deduplicationId ?? PakloId.generateKidOnly();
    await prisma.feedback.upsert({
      where: { id },
      create: { id, ...remaining },
      update: { ...remaining },
    });
    logger.trace(`Stored feedback id: ${id}`);
    // return { url: `https://www.paklo.app/feedback/${id}` };
    return {};
  },
});
