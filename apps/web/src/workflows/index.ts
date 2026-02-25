// intentionally not re-exporting stuff

import { start } from 'workflow/api';
import type { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TriggerUpdateJobsWorkflowOptionsSchema, triggerUpdateJobs } from '@/workflows/jobs';
import { SyncWorkflowOptionsSchema, synchronizeWithProvider } from '@/workflows/sync';

export const StartTriggerUpdateJobsOptionsSchema = TriggerUpdateJobsWorkflowOptionsSchema;
export type StartTriggerUpdateJobsOptions = z.infer<typeof StartTriggerUpdateJobsOptionsSchema>;

/**
 * Trigger update jobs.
 * @param options The options for triggering update jobs.
 */
export const startTriggerUpdateJobs = (options: StartTriggerUpdateJobsOptions) =>
  // trigger update jobs
  start(triggerUpdateJobs, [options]);

export const StartSyncOptionsSchema = SyncWorkflowOptionsSchema;
export type StartSyncOptions = z.infer<typeof StartSyncOptionsSchema>;

/**
 * Request synchronization for a project or repository.
 * @param options The synchronization options.
 */
export async function startSync(options: StartSyncOptions) {
  const run = await start(synchronizeWithProvider, [options]);
  const project = await prisma.project.update({
    where: { id: options.projectId, organizationId: options.organizationId },
    data: { synchronizationStatus: 'pending' },
  });
  return { run, project };
}
