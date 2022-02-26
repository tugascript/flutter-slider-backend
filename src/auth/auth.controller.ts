import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalMessageType } from '../common/gql-types/message.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  public async registerUser(
    @Body() registerDto: RegisterDto,
  ): Promise<LocalMessageType> {
    const message = await this.authService.registerUser(registerDto);
    return message;
  }

  @Public()
  @Post('/login')
  public async loginUser(
    @Body() loginDto: LoginDto,
  ): Promise<LocalMessageType> {
    const result = await this.authService.loginUser(loginDto);
    return result;
  }

  @Public()
  @Post('/confirm-login')
  public async confirmLogin(
    @Res() res: FastifyReply,
    @Body() confirmLoginDto: ConfirmLoginDto,
  ): Promise<void> {
    const result = await this.authService.confirmLogin(res, confirmLoginDto);
    res.status(200).send(result);
  }

  @Post('/logout')
  public logoutUser(@Res() res: FastifyReply): void {
    const message = this.authService.logoutUser(res);
    res.status(200).send(message);
  }

  @Public()
  @Post('/refresh-access')
  public async refreshAccessToken(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.refreshAccessToken(req, res);
    res.status(200).send(result);
  }

  @Post('/update-email')
  public async updateEmail(
    @Res() res: FastifyReply,
    @CurrentUser() userId: number,
    @Body() changeEmailDto: LoginDto,
  ): Promise<void> {
    const result = await this.authService.updateEmail(
      res,
      userId,
      changeEmailDto,
    );
    res.status(200).send(result);
  }
}
