import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe'
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';


@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripeSecret)

    //- Creamos el pago
    async createPaymentSession(paymentSessionDto: PaymentSessionDto) { 

        const {currency, items, orderId} = paymentSessionDto

        //* -- Recorremos los items, y creamos objetos como pide stripe
        const lineItems = items.map( item => {
            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: item.name
                    },
                    unit_amount: Math.round(item.price * 100),
                  },
                    quantity: item.quantity
            }
        })

        //* -- Esto le enviamos Stripe
        const session = await this.stripe.checkout.sessions.create({
            // Colocar aqui el id del mi orden
            payment_intent_data: {
                metadata: {
                    orderId: orderId
                }
            },
            // Arreglo de items que el usuario esta comprando  
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:3003/payments/success',
            cancel_url: 'http://localhost:3003/payments/cancel'
        })

        return session

    }

    async stripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature']!;

        let event: Stripe.Event;
        const endpointSecret = 'whsec_YsNuQkJTJZ4Ilz8ArJG9EpiVDyHU9vhW'

        try {
            event = this.stripe.webhooks.constructEvent(
                req['rawBody'],
                sig,
                endpointSecret
            )
        } catch(err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        switch(event.type) {
            case 'charge.succeeded':
                const chargeSucceeded = event.data.object;
                //- llamar nuestro ms
                console.log({
                    metadata: chargeSucceeded.metadata,
                    orderId: chargeSucceeded.metadata.orderId
                });
            break;

            default:
                console.log(`Event ${event.type} not handled`)
        }

       return res.status(200).json({ sig })
    }
}
