import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/paymetn-session.dto';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService
  ) {}

  @MessagePattern('create.payment.session')
  createPayment(
    @Payload() paymentSessionDto: PaymentSessionDto
  ) {
    return this.paymentsService.createPaymentSession( paymentSessionDto );
  }

  @Get('success')
  success() {
    return {
      message: 'Payment successful',
      ok: true 
    }
  }

  @Get('cancel')
  cancel() {
    return {
      message: 'Payment cancelled',
      ok: false
    }
  }

  @Post('webhook')
  webhook(
    @Req() request: Request, @Res() response: Response
  ) {
    return this.paymentsService.webhook( request, response );
  } 
}
