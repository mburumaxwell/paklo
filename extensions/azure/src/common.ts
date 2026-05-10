import { logger } from '@paklo/core/logger';
import * as tl from 'azure-pipelines-task-lib/task';

/**
 * Masks the supplied values in the task log output.
 * https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash#setsecret-register-a-value-as-a-secret
 */
export function setSecrets(...args: (string | undefined)[]) {
  for (const arg of args.filter((a) => a && a?.toLowerCase() !== 'dependabot')) {
    if (!arg) continue;

    // Mask the value and the uri encoded value. This is required to ensure that API and package feed url don't expose the value.
    // e.g. "Contoso Ltd" would appear as "Contoso%20Ltd" unless the uri encoded value was set as a secret.
    tl.setSecret(arg);
    tl.setSecret(encodeURIComponent(arg));
  }
}

/**
 * Get the access token for Azure DevOps Repos.
 * If the user has not provided one, we use the one from the SystemVssConnection.
 */
export function getAzureDevOpsAccessToken() {
  const systemAccessToken = tl.getInput('azureDevOpsAccessToken');
  if (systemAccessToken) {
    tl.debug('azureDevOpsAccessToken provided, using for authenticating');
    return systemAccessToken;
  }

  const serviceConnectionName = tl.getInput('azureDevOpsServiceConnection');
  if (serviceConnectionName) {
    tl.debug('TFS connection supplied. A token shall be extracted from it.');
    return tl.getEndpointAuthorizationParameter(serviceConnectionName, 'apitoken', false)!;
  }

  tl.debug("No custom token provided. The SystemVssConnection's AccessToken shall be used.");
  return tl.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false)!;
}

/**
 * Configures the logger to route logs through Azure DevOps task output,
 * and sets the log level based on the debug input.
 */
export function setupLogging({ debug }: { debug: boolean }) {
  // Route core logs through Azure DevOps task output.
  logger.replace({
    log: ({ level, message }) => {
      switch (level) {
        case 'fatal':
        case 'error':
          tl.error(message);
          break;
        case 'warn':
          tl.warning(message);
          break;
        case 'debug':
        case 'trace':
          tl.debug(message);
          break;
        case 'info':
        default:
          console.log(message);
          break;
      }
    },

    /**
     * Formats the logs into groups and sections to allow for easier navigation and readability.
     * https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash#formatting-commands
     */

    startGroup: (name) => console.log(`##[group]${name}`),
    endGroup: () => console.log(`##[endgroup]`),
    section: (name) => console.log(`##[section]${name}`),
  });

  // update logger level based on debug input
  logger.level = debug ? 'debug' : 'info';
}
