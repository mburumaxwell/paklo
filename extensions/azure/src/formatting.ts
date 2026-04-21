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
