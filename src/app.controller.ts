import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('/favicon.ico')
  public sendFavicon(@Res() res: FastifyReply) {
    res.sendFile('favicon.ico');
  }
}
