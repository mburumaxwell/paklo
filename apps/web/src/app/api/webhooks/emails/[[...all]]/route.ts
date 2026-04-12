import { toNextJsHandler } from '@paklo/core/hono';
import { Hono } from 'hono';

import { logger } from '@/lib/logger';
import { resend, webhookSecret } from '@/lib/resend';

const app = new Hono().basePath('/api/webhooks/emails');

app.post('/resend', async (context) => {
  try {
    const payload = await context.req.text();

    // Throws an error if the webhook is invalid
    // Otherwise, returns the parsed payload object
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: context.req.header('svix-id') || '',
        timestamp: context.req.header('svix-timestamp') || '',
        signature: context.req.header('svix-signature') || '',
      },
      webhookSecret,
    });

    if (event.type !== 'email.received') {
      logger.warn(`Unhandled resend webhook of event type: ${event.type}`);
      return context.text('', 200);
    }

    const { to } = event.data;
    if (!to.some((addr) => addr.toLowerCase() === 'support@paklo.app')) {
      logger.warn(`Unhandled resend webhook of event type: ${event.type}`);
      return context.text('', 200);
    }

    const { data, error } = await resend.emails.receiving.forward({
      emailId: event.data.email_id,
      from: 'support@paklo.app', // must be verified domain in Resend
      to: process.env.HELPSCOUT_EMAIL!,
      passthrough: true, // so that it does not look like a forwarded email
    });

    if (error) {
      return context.text(`Error: ${error.message}`, 500);
    }

    return context.json(data, 200);
  } catch (err) {
    logger.error(err);
    return context.text('Invalid webhook.', 400);
  }
});

export const { POST, OPTIONS } = toNextJsHandler(app);
