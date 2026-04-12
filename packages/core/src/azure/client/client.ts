import ky, { type Options as KyOptions, isHTTPError } from 'ky';

import { logger } from '@/logger';

import type { AzureDevOpsOrganizationUrl } from '../url-parts';
import { ConnectionClient } from './client-connection';
import { GitClient } from './client-git';
import { IdentityClient } from './client-identity';
import { ProjectsClient } from './client-projects';
import { PullRequestsClient } from './client-pull-requests';
import { RepositoriesClient } from './client-repositories';
import { HookSubscriptionsClient } from './client-subscriptions';

export class AzureDevOpsClient {
  public readonly organizationSlug: string;
  public readonly organizationUrl: string;
  public readonly connection: ConnectionClient;
  public readonly identity: IdentityClient;
  public readonly projects: ProjectsClient;
  public readonly repositories: RepositoriesClient;
  public readonly git: GitClient;
  public readonly pullRequests: PullRequestsClient;
  public readonly subscriptions: HookSubscriptionsClient;

  constructor(url: AzureDevOpsOrganizationUrl, accessToken: string, debug: boolean = false) {
    this.organizationSlug = url.organization;
    const organizationUrl = url.value.toString().replace(/\/$/, ''); // trim trailing slash
    this.organizationUrl = organizationUrl;
    const mainClientOptions = AzureDevOpsClient.createClientOptions(accessToken, debug, {
      prefix: organizationUrl,
    });
    const mainClient = ky.create(mainClientOptions);
    this.connection = new ConnectionClient(mainClient);
    this.projects = new ProjectsClient(mainClient);
    this.repositories = new RepositoriesClient(mainClient);
    this.git = new GitClient(mainClient);
    this.pullRequests = new PullRequestsClient(mainClient);
    this.subscriptions = new HookSubscriptionsClient(mainClient);

    const identityApiUrl = url['identity-api-url'].toString().replace(/\/$/, ''); // trim trailing slash
    const identityClient = ky.create({ ...mainClientOptions, prefix: identityApiUrl });
    this.identity = new IdentityClient(identityClient);
  }

  private static createClientOptions(accessToken: string, debug: boolean, options?: KyOptions): KyOptions {
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${accessToken}`).toString('base64')}`,
        Accept: 'application/json',
      },
      hooks: {
        beforeRequest: [
          async (state) => {
            if (debug) logger.debug(`🌎 🠊 [${state.request.method}] ${state.request.url}`);
          },
        ],
        afterResponse: [
          async (state) => {
            if (debug) {
              logger.debug(`🌎 🠈 [${state.response.status}] ${state.response.statusText}`);

              // log the request and response for debugging
              if (state.request.body) {
                logger.debug(`REQUEST: ${JSON.stringify(state.request.body)}`);
              }
              // const body = await state.response.text();
              // if (body) {
              //   logger.debug(`RESPONSE: ${body}`);
              // }
            }
          },
        ],
        beforeRetry: [
          async (state) => {
            if (debug && isHTTPError(state.error)) {
              logger.debug(`⏳ Retrying failed request with status code: ${state.error.response.status}`);
            }
          },
        ],
      },
      retry: {
        limit: 3,
        delay: (_attempt) => 3000, // all attempts after 3 seconds
      },
      ...options,
    };
  }
}
