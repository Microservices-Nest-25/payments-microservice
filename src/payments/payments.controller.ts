import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/paymetn-session.dto';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService
  ) {}

  @Post( 'session' )
  createPayment(
    @Body() paymentSessionDto: PaymentSessionDto
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
    this.paymentsService.webhook( request, response );
  } 
}
