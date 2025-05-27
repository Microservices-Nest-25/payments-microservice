import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { PaymentSessionDto } from './dto/paymetn-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe( envs.stripeSecretKey);

    async createPaymentSession( paymentSessionDto: PaymentSessionDto ) {
        const { currency, items, orderId } = paymentSessionDto;

        const lineItems = items.map(item => ({
            price_data: { 
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await this.stripe.checkout.sessions.create({
            payment_intent_data: {
                metadata: {
                    orderId,
                }
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: `${ envs.baseUrl }/payments/success`,
            cancel_url: `${ envs.baseUrl }/payments/cancel`,
        });

        return session;
    }

    webhook( req: Request, res: Response ) {
        const sig = req.headers['stripe-signature'] as string;

        let event: Stripe.Event;

        const endpointSecret: string = envs.stripeEndpointSecret;

        try {
            event = this.stripe.webhooks.constructEvent(
                req['rawBody'],
                sig,
                endpointSecret
            );
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'charge.succeeded':
                const orderId = event.data.object.metadata.orderId;    

                break;
            default:
                console.warn(`Unhandled event type: ${event.type}`);
                break;
        }
        
        return res.status(200).json({ sig });
    }

}
