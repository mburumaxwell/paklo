import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { type Configuration, registerOTel } from '@vercel/otel';

export async function register() {
  const instrumentations: Configuration['instrumentations'] = [
    new PrismaInstrumentation(),
    new MongoDBInstrumentation(),
    new PgInstrumentation(),
    new PinoInstrumentation(),
  ];

  registerOTel({ serviceName: 'paklo', instrumentations });
}
