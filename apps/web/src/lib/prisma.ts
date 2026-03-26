import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/../.generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

/**
 * Preprocesses a search query for PostgreSQL full-text search with prefix matching.
 * Converts user input like "max shub" into "max:* & shub:*" for prefix matching.
 * @param query The raw search query string
 * @returns Processed query with prefix wildcards and AND operators
 */
export function processSearchQuery(query: string): string {
  return query
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 0)
    .map((word) => `${word}:*`) // Add prefix wildcard
    .join(' & '); // Join with AND operator
}

export type {
  Feedback,
  Organization,
  OrganizationCredential,
  OrganizationSecret,
  Project,
  Repository,
  RepositoryPullRequest,
  RepositoryUpdate,
  UpdateJob,
  UpdateJobSecret,
  User,
  Verification,
} from '@/../.generated/prisma/client';

export { Prisma, PrismaClient } from '@/../.generated/prisma/client';

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
