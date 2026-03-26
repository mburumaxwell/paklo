import { DependabotCommandSchema } from '@paklo/core/dependabot';

import { UpdateJobTriggerSchema } from '@/lib/enums';
import { z } from '@/lib/zod';

export const TriggerUpdateJobsWorkflowOptionsSchema = z
  .object({
    organizationId: z.string(),
    projectId: z.string(),
    repositoryId: z.string(),
    trigger: UpdateJobTriggerSchema,
    command: DependabotCommandSchema.optional(),
  })
  .and(
    z.union([
      z.object({ repositoryUpdateIds: z.string().array().optional() }),
      z.object({ repositoryUpdateId: z.string() }),
      z.object({ repositoryUpdateId: z.string(), repositoryPullRequestId: z.string() }),
    ]),
  );
export type TriggerUpdateJobsWorkflowOptions = z.infer<typeof TriggerUpdateJobsWorkflowOptionsSchema>;
