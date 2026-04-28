import type { LogTransport } from '@paklo/core/logger';

// Process-scoped set — secrets accumulate for the lifetime of the CLI process.
const secrets = new Set<string>();

/** Registers a secret so it is redacted from all subsequent log output. */
export function secretMasker(secret: string): void {
  if (secret.length > 0) secrets.add(secret);
}

function mask(message: string): string {
  let result = message;
  for (const secret of secrets) {
    result = result.replaceAll(secret, '***');
  }
  return result;
}

/**
 * Wraps a transport so every log message has registered secrets replaced with
 * '***' before being forwarded. Masking at the transport level ensures secrets
 * never reach stdout regardless of which logger method emits them.
 */
export function withSecretMasking(inner: LogTransport): LogTransport {
  return {
    log(record) {
      inner.log({ ...record, message: mask(record.message) });
    },
    startGroup: inner.startGroup?.bind(inner),
    endGroup: inner.endGroup?.bind(inner),
    section: inner.section?.bind(inner),
  };
}
