import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import express from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';


@Controller('payments')
export class PaymentsController {

  constructor(private readonly paymentsService: PaymentsService) {}

  //? --------------------
  //@Post('create-payment-session') //- peticion http
  @MessagePattern('create.payment.session')//-micrservicio 
  createPaymentSession(@Payload() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }


  //? --------------------
  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payments successful'
    }
  }


  //? --------------------
  @Get('cancel')
  cancel() {
    return {
      ok: true,
      message: 'Payments cancelled'
    }
  }


  //? --------------------
  @Post('webhook')
  async stripeWebhook(@Req() req: express.Request, @Res() res: express.Response){
    return this.paymentsService.stripeWebhook(req, res)
  }

}
