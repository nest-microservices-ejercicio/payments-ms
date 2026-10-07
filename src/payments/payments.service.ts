import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe'
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';


@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripeSecret)
    private readonly logger = new Logger('PaymentService')

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy
    ) {}

    //? ---- Creamos el pago
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
            line_items: lineItems,//- Arreglo de items que el usuario esta comprando  
            mode: 'payment',
            success_url: envs.stripeSuccesUrl,
            cancel_url: envs.stripeCancelUrl
        })

        return {
            cancelUrl: session.cancel_url,
            successUrl: session.success_url,
            url: session.url
        }
    }


    //? ----
    async stripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature']!;

        let event: Stripe.Event;
        const endpointSecret = envs.stripeEndPointSecret
 
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
                const payload = {
                    stripePaymentId: chargeSucceeded.id,
                    orderId: chargeSucceeded.metadata.orderId,
                    receiptUrl: chargeSucceeded.receipt_url,
                }
                this.logger.log({payload})
                //? --- Emitimos un evento, con emit no espera una respuesta a diferencia de send
                this.client.emit('payment.succeded', payload)
            break;

            default:
                console.log(`Event ${event.type} not handled`)
        }

       return res.status(200).json({ sig })
    }
}
