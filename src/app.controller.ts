import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}
  private readonly port = this.configService.get<number>('port');

  @Public()
  @Get('/favicon.ico')
  public sendFavicon(@Res() res: FastifyReply) {
    res.sendFile('favicon.ico');
  }

  @Public()
  @Get()
  public getServerRunning() {
    return `server running on port ${this.port}`;
  }
}
