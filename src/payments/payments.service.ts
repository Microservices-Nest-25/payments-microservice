import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { envs, NATS_SERVICE } from 'src/config';
import { PaymentSessionDto } from './dto/paymetn-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

    private readonly logger: Logger = new Logger( PaymentsService.name );
    private readonly stripe = new Stripe( envs.stripeSecretKey );

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy
    ) {}

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

        return {
            cancelUrl:  session.cancel_url,
            successUrl: session.success_url,
            url:        session.url,
        };
    }

    webhook( req: Request, res: Response ) {
        const sig = req.headers['stripe-signature'] as any;

        let event: Stripe.Event;

        const endpointSecret: string = 'whsec_3jySmMXqK2HELzjNXYSX2yl975SZjq9L';

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
                const chargerSucceded = event.data.object;

                const payload = {
                    stripePaymentId: chargerSucceded.id,
                    orderId: chargerSucceded.metadata.orderId,
                    receiptUrl: chargerSucceded.receipt_url,
                }

                this.client.emit('payment.succeeded', payload);

                break;
            default:
                console.warn(`Unhandled event type: ${event.type}`);
                break;
        }
        
        return res.status(200).json({ sig });
    }

}
