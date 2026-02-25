'use server';

import { z } from 'zod';
import { AvailableProjectSchema, createAzdoClient } from '@/integrations';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createServerAction, ServerActionValidationError } from '@/lib/server-action';
import { getWebhooksUrl, HEADER_NAME_ORGANIZATION, HEADER_NAME_PROJECT } from '@/lib/webhooks';
import { startSync } from '@/workflows';

export const connectProjects = createServerAction({
  input: z.object({ organizationId: z.string(), projects: AvailableProjectSchema.array() }),
  auth: true,
  handler: async ({ input: { organizationId, projects } }): Promise<number> => {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // ensure billing is setup
    if (!organization.subscriptionId) {
      throw new ServerActionValidationError('Organization must have an active subscription');
    }

    // create projects
    const projectIds = projects.map(() => PakloId.generate('project')); // generate a new ID for each project
    const result = await prisma.project.createMany({
      data: projects.map((project, index) => ({
        id: projectIds[index]!,
        organizationId,
        providerId: project.providerId,
        name: project.name,
        url: project.url,
        permalink: project.permalink,
        synchronizationStatus: 'pending',
        synchronizedAt: null,
      })),
    });

    // schedule synchronization for the newly connected projects
    for (const projectId of projectIds) {
      await startSync({
        organizationId,
        projectId,
        scope: 'all', // sync all repositories
        trigger: true, // trigger update jobs
      });
    }

    // create service hooks on azure
    if (organization.type === 'azure') {
      const credential = await prisma.organizationCredential.findUniqueOrThrow({
        where: { id: organizationId },
      });
      const client = await createAzdoClient({ organization, credential }, true);
      const created = await prisma.project.findMany({ where: { id: { in: projectIds } } });
      for (const project of created) {
        logger.info(`Creating service hooks for project ${project.id} (${project.url})`);
        await client.createOrUpdateHookSubscriptions({
          url: getWebhooksUrl(organization),
          headers: {
            Authorization: credential.webhooksToken,
            [HEADER_NAME_ORGANIZATION]: organizationId,
            [HEADER_NAME_PROJECT]: project.id,
          },
          project: project.providerId,
        });
        logger.info(`Service hooks created for project ${project.id} (${project.url})`);
      }
    }

    return result.count;
  },
});

export const disconnectProject = createServerAction({
  input: z.object({ organizationId: z.string(), projectId: z.string() }),
  auth: true,
  handler: async ({ input: { organizationId, projectId } }): Promise<boolean> => {
    // fetch organization
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // fetch the project to be disconnected
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // delete service hooks for the given project on azure
    if (organization.type === 'azure') {
      const client = await createAzdoClient({ organization }, true);
      logger.info(`Deleting service hooks for project ID ${project.id} (${project.url})`);
      await client.deleteHookSubscriptions({
        url: getWebhooksUrl(organization),
        project: project.providerId,
      });
      logger.info(`Service hooks deleted for project ID ${project.id} (${project.url})`);
    }

    // delete the project if it belongs to the organization
    // cascading deletes will handle related entities
    await prisma.project.deleteMany({
      // must belong to the organization
      where: { organizationId, id: projectId },
    });

    // jobs should not be deleted because of billing and analysis purposes
    // they are modelled with onDelete: NoAction in schema.prisma
    return true;
  },
});
