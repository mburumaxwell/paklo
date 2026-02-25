'use server';

import { z } from 'zod';
import { getPrices, PRICE_LOOKUP_KEY_MANAGEMENT, PRICE_LOOKUP_KEY_USAGE, stripe } from '@/lib/billing';
import { environment } from '@/lib/environment';
import { prisma } from '@/lib/prisma';
import { createServerAction, ServerActionValidationError } from '@/lib/server-action';
import { config } from '@/site-config';

const BillingActionInputSchema = z.object({
  organizationId: z.string(),
});

export const createStripeCheckoutSession = createServerAction({
  input: BillingActionInputSchema,
  auth: true,
  handler: async ({ input: { organizationId } }): Promise<{ url: string }> => {
    const { siteUrl: baseUrl } = config;
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const prices = await getPrices();

    const customerId = organization.customerId || undefined;
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        name_collection: { business: { enabled: true, optional: true } },
        customer: customerId, // in case the customer already exists from previous subscriptions
        customer_update: customerId ? { name: 'auto', address: 'auto' } : undefined,
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
        automatic_tax: { enabled: true },
        line_items: [
          {
            price: prices[PRICE_LOOKUP_KEY_MANAGEMENT]!.id,
            quantity: 1,
            adjustable_quantity: { enabled: false },
          },
          {
            price: prices[PRICE_LOOKUP_KEY_USAGE]!.id,
            // for metered billing, quantity and adjustable_quantity must not be set
          },
        ],
        allow_promotion_codes: true,
        success_url: `${baseUrl}/dashboard/${organization.slug}/settings/billing/success/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard/${organization.slug}/settings/billing`,
        consent_collection: {
          terms_of_service: 'required',
          payment_method_reuse_agreement: { position: 'auto' },
        },
        adaptive_pricing: { enabled: true },
        client_reference_id: organization.id,
      },
      {
        // set idempotency key to avoid duplicate sessions for the same organization in the day
        // this allows retry safely and it also means we get the same session if user retries within the day
        idempotencyKey: environment.production
          ? `checkout-session:${organization.id}:${new Date().getDate()}`
          : undefined,
      },
    );

    return { url: session.url! };
  },
});

export const createStripeBillingPortalSession = createServerAction({
  input: BillingActionInputSchema,
  auth: true,
  handler: async ({ input: { organizationId } }): Promise<{ url: string }> => {
    const { siteUrl: baseUrl } = config;
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    if (!organization.customerId || !organization.subscriptionId) {
      throw new ServerActionValidationError('Organization does not have an active subscription');
    }

    const session = await stripe.billingPortal.sessions.create(
      {
        customer: organization.customerId,
        return_url: `${baseUrl}/dashboard/${organization.slug}/settings/billing`,
      },
      {
        // set idempotency key to avoid duplicate sessions for the same organization in the day
        // this allows retry safely and it also means we get the same session if user retries within the day
        idempotencyKey: environment.production
          ? `billing-portal:${organization.id}:${new Date().getDate()}`
          : undefined,
      },
    );

    return { url: session.url! };
  },
});

export const cancelSubscription = createServerAction({
  input: BillingActionInputSchema,
  auth: true,
  handler: async ({ input: { organizationId } }): Promise<boolean> => {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // ensure subscription exists
    if (!organization.subscriptionId) {
      throw new ServerActionValidationError('Organization does not have an active subscription');
    }

    // ensure there are no projects connected
    const projectCount = await prisma.project.count({
      where: { organizationId: organization.id },
    });
    if (projectCount > 0) {
      throw new ServerActionValidationError('Please disconnect all projects before cancelling the subscription');
    }

    // cancel the subscription immediately
    await stripe.subscriptions.cancel(
      organization.subscriptionId,
      {
        invoice_now: true,
      },
      {
        // set idempotency key to avoid duplicate cancellations for the same organization in the day
        // this allows retry safely and it also means we get the same result if user retries within the day
        idempotencyKey: environment.production
          ? `cancel-subscription:${organization.id}:${new Date().getDate()}`
          : undefined,
      },
    );

    // when the webhook event is received, the organization will be updated

    return true;
  },
});
