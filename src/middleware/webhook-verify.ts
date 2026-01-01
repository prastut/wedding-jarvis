import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  // Skip verification if no app secret configured
  if (!config.whatsapp.appSecret) {
    console.warn('WHATSAPP_APP_SECRET not configured - skipping signature verification');
    next();
    return;
  }

  const signature = req.headers['x-hub-signature-256'];

  if (!signature || typeof signature !== 'string') {
    console.error('Missing X-Hub-Signature-256 header');
    res.sendStatus(401);
    return;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    console.error('Raw body not available for signature verification');
    res.sendStatus(401);
    return;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', config.whatsapp.appSecret)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    console.error('Invalid webhook signature');
    res.sendStatus(401);
    return;
  }

  next();
}
