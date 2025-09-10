import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/envs';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      //Colocar aqui el id de mi orden
      payment_intent_data: {
        metadata: {
          order_id: orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return session;
  }

  stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    const endpointSecret = envs.stripeWebhookSecret;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'] as Buffer,
        sig,
        endpointSecret,
      );
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const message = err?.message as string;
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    let chargeSucceeded: Stripe.Charge;
    switch (event.type) {
      case 'charge.succeeded':
        chargeSucceeded = event.data.object;
        console.log({
          orderId: chargeSucceeded.metadata.order_id,
        });

        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    return res.status(200).json({
      event,
    });
  }
}
