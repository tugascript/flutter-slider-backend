import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}
  @Public()
  @Get('/favicon.ico')
  public sendFavicon(@Res() res: FastifyReply) {
    res.sendFile('favicon.ico');
  }

  @Public()
  @Get()
  public getServerRunning() {
    return `server running on port 5000`;
  }
}
