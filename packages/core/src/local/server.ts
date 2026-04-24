import type { AddressInfo } from 'node:net';

import { createAdaptorServer } from '@hono/node-server';

import {
  type DependabotCreatePullRequest,
  type DependabotCredential,
  type DependabotExistingGroupPr,
  type DependabotExistingPr,
  type DependabotJobConfig,
  type DependabotPackageManager,
  type DependabotRequest,
  type DependabotUpdate,
  type ExecutionUnit,
  type GitAuthor,
} from '@/dependabot';
import { logger } from '@/logger';

import { type CreateApiServerAppOptions, type DependabotTokenType, createApiServerApp } from './server-http';

export type LocalDependabotServerAddOptions = {
  /** The ID of the dependabot job. */
  id: string;
  /** The execution unit this job belongs to. */
  unit?: ExecutionUnit;
  /** The dependabot update associated with the job. */
  update: DependabotUpdate;
  /** The dependabot job configuration. */
  job: DependabotJobConfig;
  /** The authentication token for the job. */
  jobToken: string;
  /** The authentication token for the job. */
  credentialsToken: string;
  /** The credentials associated with the job. */
  credentials: DependabotCredential[];
};

export type AffectedPullRequestIds = {
  created: (DependabotExistingPr | DependabotExistingGroupPr)[];
  updated: number[];
  closed: number[];
};

export type PendingCreatePullRequest = {
  id: string;
  packageManager: DependabotPackageManager;
  update: DependabotUpdate;
  request: DependabotCreatePullRequest;
};

export type FinalizeCreateRequestsResult = {
  success: boolean;
  message?: string;
  affectedPrs: number[];
};

export type LocalDependabotServerOptions = Omit<
  CreateApiServerAppOptions,
  'authenticate' | 'getJob' | 'getCredentials' | 'handle'
> & {
  author: GitAuthor;
  debug: boolean;
  dryRun: boolean;
};
export abstract class LocalDependabotServer {
  private readonly hostname = 'localhost';
  private readonly server: ReturnType<typeof createAdaptorServer>;
  private readonly trackedJobs = new Map<string, DependabotJobConfig>();
  private readonly updates = new Map<string, DependabotUpdate>();
  private readonly jobTokens = new Map<string, string>();
  private readonly credentialTokens = new Map<string, string>();
  private readonly units = new Map<string, ExecutionUnit>();
  private readonly unitJobIds = new Map<ExecutionUnit, string[]>();
  private readonly jobCredentials = new Map<string, DependabotCredential[]>();
  private readonly receivedRequests = new Map<string, DependabotRequest[]>();
  private readonly pendingCreatePullRequests = new Map<string, PendingCreatePullRequest[]>();

  protected readonly affectedPullRequestIds = new Map<string, AffectedPullRequestIds>();

  constructor(options: LocalDependabotServerOptions) {
    const app = createApiServerApp({
      ...options,
      authenticate: this.authenticate.bind(this),
      getJob: this.job.bind(this),
      getCredentials: this.credentials.bind(this),
      handle: this.handle.bind(this),
    });
    this.server = createAdaptorServer({
      ...app,
      // Workaround for hono not respecting x-forwarded-proto header
      // https://github.com/honojs/node-server/issues/146#issuecomment-3153435672
      fetch: (req) => {
        const url = new URL(req.url);
        url.protocol = req.headers.get('x-forwarded-proto') ?? url.protocol;
        return app.fetch(new Request(url, req));
      },
    });
  }

  start(port?: number) {
    // listening to 'localhost' will result to IpV6 only but we need it to be all local
    // interfaces, otherwise containers cannot reach it using host.docker.internal
    this.server.listen(port, '0.0.0.0', () => {
      const info = this.server.address() as AddressInfo;
      logger.info(`API server listening on http://${this.hostname}:${info.port}`);
    });
  }

  stop() {
    this.server.close(() => logger.info('API server closed'));
  }

  get url() {
    const info = this.server.address() as AddressInfo;
    return `http://${this.hostname}:${info.port}`;
  }

  get port() {
    const info = this.server.address() as AddressInfo;
    return info.port;
  }

  get jobs() {
    return this.trackedJobs;
  }

  /**
   * Adds a dependabot job.
   * @param value - The dependabot job details.
   */
  add(value: LocalDependabotServerAddOptions) {
    const { id, unit, update, job, jobToken, credentialsToken, credentials } = value;
    const {
      trackedJobs,
      updates,
      jobTokens,
      credentialTokens,
      units,
      jobCredentials,
      receivedRequests,
      affectedPullRequestIds,
    } = this;
    trackedJobs.set(id, job);
    updates.set(id, update);
    jobTokens.set(id, jobToken);
    credentialTokens.set(id, credentialsToken);
    if (unit) {
      units.set(id, unit);
      const jobIdsForUnit = this.unitJobIds.get(unit) ?? [];
      jobIdsForUnit.push(id);
      this.unitJobIds.set(unit, jobIdsForUnit);
    }
    jobCredentials.set(id, credentials);
    receivedRequests.set(id, []);
    affectedPullRequestIds.set(id, { created: [], updated: [], closed: [] });
  }

  /**
   * Gets a dependabot job by ID.
   * @param id - The ID of the dependabot job to get.
   * @returns The dependabot job, or undefined if not found.
   */
  job(id: string): Promise<DependabotJobConfig | undefined> {
    return Promise.resolve(this.trackedJobs.get(id));
  }

  /**
   * Gets a dependabot update by ID of the job.
   * @param id - The ID of the dependabot job to get.
   * @returns The dependabot update, or undefined if not found.
   */
  update(id: string): DependabotUpdate | undefined {
    return this.updates.get(id);
  }

  /**
   * Gets a token by ID of the job.
   * @param id - The ID of the dependabot job to get.
   * @returns The job token, or undefined if not found.
   */
  token(id: string, type: DependabotTokenType): string | undefined {
    return type === 'job' ? this.jobTokens.get(id) : this.credentialTokens.get(id);
  }

  /**
   * Gets the execution unit associated with a dependabot job by ID.
   * @param id - The ID of the dependabot job.
   * @returns The execution unit, or undefined if not found.
   */
  unit(id: string): ExecutionUnit | undefined {
    return this.units.get(id);
  }

  /**
   * Gets deferred multi-ecosystem create-pull-request requests for a group.
   * @param groupname - The multi-ecosystem group name.
   * @returns The queued create-pull-request requests for the group.
   */
  createRequests(groupname: string): PendingCreatePullRequest[] {
    return this.pendingCreatePullRequests.get(groupname) ?? [];
  }

  /**
   * Queues a create-pull-request request until the whole multi-ecosystem execution unit finishes.
   * @param id - The ID of the dependabot job.
   * @param request - The create-pull-request payload to queue.
   * @returns Whether the request was queued.
   */
  queueCreateRequest(id: string, request: DependabotCreatePullRequest): boolean {
    const job = this.trackedJobs.get(id);
    const update = this.updates.get(id);
    const unit = this.units.get(id);
    if (!job || !update || unit?.kind !== 'multi-ecosystem') return false;

    const pending = this.pendingCreatePullRequests.get(unit.groupname) ?? [];
    pending.push({ id, packageManager: job['package-manager'], update, request });
    this.pendingCreatePullRequests.set(unit.groupname, pending);
    return true;
  }

  /**
   * Finalizes an execution unit and clears any server-side state associated with it.
   * @param unit - The execution unit to finalize.
   * @returns The provider finalization result, or undefined when there is nothing to finalize.
   */
  async finalizeUnit(unit: ExecutionUnit): Promise<FinalizeCreateRequestsResult | undefined> {
    try {
      return await this.finalizeCreateRequests(unit);
    } finally {
      const jobIds = this.unitJobIds.get(unit) ?? [];
      for (const id of jobIds) {
        // Clear all state associated with jobs in this execution unit.
        this.trackedJobs.delete(id);
        this.updates.delete(id);
        this.jobTokens.delete(id);
        this.credentialTokens.delete(id);
        this.units.delete(id);
        this.jobCredentials.delete(id);
        this.receivedRequests.delete(id);
        this.affectedPullRequestIds.delete(id);
      }
      this.unitJobIds.delete(unit);
      if (unit.kind === 'multi-ecosystem') {
        this.pendingCreatePullRequests.delete(unit.groupname);
      }
    }
  }

  /**
   * Finalizes deferred create-pull-request requests for an execution unit.
   * @param unit - The execution unit whose deferred requests should be finalized.
   * @returns The finalization result, or undefined when there is nothing to finalize.
   */
  abstract finalizeCreateRequests(unit: ExecutionUnit): Promise<FinalizeCreateRequestsResult | undefined>;

  /**
   * Gets the credentials for a dependabot job by ID.
   * @param id - The ID of the dependabot job to get credentials for.
   * @returns The credentials for the job, or undefined if not found.
   */
  credentials(id: string): Promise<DependabotCredential[] | undefined> {
    return Promise.resolve(this.jobCredentials.get(id));
  }

  /**
   * Gets the received requests for a dependabot job by ID.
   * @param id - The ID of the dependabot job to get requests for.
   * @returns The received requests for the job, or undefined if not found.
   */
  requests(id: string): DependabotRequest[] | undefined {
    return this.receivedRequests.get(id);
  }

  /**
   * Gets the IDs of pull requests affected by a dependabot job by ID.
   * @param id - The ID of the dependabot job to get affected pull request IDs for.
   * @returns The affected pull request IDs for the job, or undefined if not found.
   */
  affectedPrs(id: string): AffectedPullRequestIds | undefined {
    const { affectedPullRequestIds } = this;
    return affectedPullRequestIds.get(id);
  }

  /**
   * Gets all IDs of pull requests affected by a dependabot job by ID.
   * @param id - The ID of the dependabot job to get affected pull request IDs for.
   * @returns The affected pull request IDs for the job, or undefined if not found.
   */
  allAffectedPrs(id: string): number[] {
    const affected = this.affectedPrs(id);
    if (!affected) return [];
    return [...affected.created.map((pr) => pr['pr-number']), ...affected.updated, ...affected.closed];
  }

  /**
   * Authenticates a dependabot job.
   * @param id - The ID of the dependabot job.
   * @param value - The authentication value (e.g., API key).
   * @returns A promise that resolves to a boolean indicating whether the authentication was successful.
   */
  protected async authenticate(type: DependabotTokenType, id: string, value: string): Promise<boolean> {
    const token = type === 'job' ? this.jobTokens.get(id) : this.credentialTokens.get(id);
    if (!token) {
      logger.debug(`Authentication failed: ${type} token ${id} not found`);
      return false;
    }
    if (token !== value) {
      logger.debug(`Authentication failed: invalid token for ${type} token ${id}`);
      return false;
    }
    return true;
  }

  /**
   * Handles a dependabot request.
   * @param id - The ID of the dependabot job.
   * @param request - The dependabot request to handle.
   * @returns A promise that resolves to the result of handling the request.
   */
  protected handle(id: string, request: DependabotRequest): Promise<boolean> {
    this.receivedRequests.get(id)!.push(request);
    return Promise.resolve(true);
  }
}
