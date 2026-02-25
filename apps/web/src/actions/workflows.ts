'use server';

import type { Project } from '@/lib/prisma';
import { createServerAction } from '@/lib/server-action';
import {
  StartSyncOptionsSchema,
  StartTriggerUpdateJobsOptionsSchema,
  startSync,
  startTriggerUpdateJobs,
} from '@/workflows';

/** Trigger update jobs. */
export const requestTriggerUpdateJobs = createServerAction({
  input: StartTriggerUpdateJobsOptionsSchema,
  auth: true,
  handler: async ({ input }): Promise<boolean> => {
    await startTriggerUpdateJobs(input);
    return true;
  },
});

/**
 * Request synchronization for a project or repository.
 * @param options The synchronization options.
 */
export const requestSync = createServerAction({
  input: StartSyncOptionsSchema,
  auth: true,
  handler: async ({ input }): Promise<Project> => {
    const { project } = await startSync(input);
    return project;
  },
});
