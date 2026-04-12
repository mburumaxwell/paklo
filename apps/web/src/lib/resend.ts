import { Resend } from 'resend';
import { type Attachment, type CreateEmailOptions, type GetReceivingEmailResponseSuccess, type Tag } from 'resend';

export const webhookSecret = process.env.RESEND_WEBHOOK_SECRET!;
export const resend = new Resend(process.env.RESEND_API_KEY);
export type { Attachment, CreateEmailOptions, Tag, GetReceivingEmailResponseSuccess as ReceivedEmail };
