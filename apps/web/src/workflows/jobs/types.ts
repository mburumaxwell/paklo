import { DependabotCommandSchema } from '@paklo/core/dependabot';
import { z } from 'zod';
import { UpdateJobTriggerSchema } from '@/lib/enums';

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
