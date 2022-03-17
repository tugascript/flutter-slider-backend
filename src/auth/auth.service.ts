import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { FastifyReply, FastifyRequest } from 'fastify';
import { v5 as uuidV5 } from 'uuid';
import { CommonService } from '../common/common.service';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IJwt, ISingleJwt } from '../config/interfaces/jwt.interface';
import { EmailService } from '../email/email.service';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { generateToken, verifyToken } from './helpers/async-jwt';
import {
  IAccessPayload,
  IAccessPayloadResponse,
} from './interfaces/access-payload.interface';
import { IAuthResult } from './interfaces/auth-result.interface';
import {
  ITokenPayload,
  ITokenPayloadResponse,
} from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');
  private readonly authNamespace = this.configService.get<string>('AUTH_UUID');

  //____________________ MUTATIONS ____________________

  /**
   * Register User
   *
   * Takes the register input, creates a new user in the db
   * and asyncronously sends a get access code email
   */
  public async registerUser(input: RegisterDto): Promise<LocalMessageType> {
    const user = await this.usersService.createUser(input);
    await this.generateAccessCode(user);
    return new LocalMessageType(
      'User registered successfully. Login confirmation code sent.',
    );
  }

  /**
   * Login User
   *
   * Takes the login input, if two factor auth is true: it caches a new access code and
   * asyncronously sends it by email. If false, it sends an auth type
   */
  public async loginUser({ email }: LoginDto): Promise<LocalMessageType> {
    const user = await this.usersService.getUserForAuth(email);
    await this.generateAccessCode(user);
    return new LocalMessageType('Login confirmation code sent.');
  }

  /**
   * Confirm Login
   *
   * Takes the confirm login input, checks the access code
   * and logins the user
   */
  public async confirmLogin(
    res: FastifyReply,
    { email, accessCode }: ConfirmLoginDto,
  ): Promise<IAuthResult> {
    const hashedCode = await this.commonService.throwInternalError(
      this.cacheManager.get<string>(uuidV5(email, this.authNamespace)),
    );

    if (!hashedCode || !(await compare(accessCode, hashedCode)))
      throw new UnauthorizedException('Access code is invalid or has expired');

    const user = await this.usersService.getUserForAuth(email);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    return { accessToken };
  }

  /**
   * Logout User
   *
   * Removes the refresh token from the cookies
   */
  public logoutUser(res: FastifyReply): LocalMessageType {
    res.clearCookie(this.cookieName, { path: '/api/auth/refresh-access' });
    return new LocalMessageType('Logout Successfully');
  }

  /**
   * Refresh Access Token
   *
   * Takes the request and response, and generates new auth tokens
   * based on the current refresh token.
   *
   * It generates both tokens so the user can stay logged in indefinatly
   */
  public async refreshAccessToken(
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<IAuthResult> {
    const token = req.cookies[this.cookieName];
    if (!token) throw new UnauthorizedException('Invalid refresh token');

    const payload = (await this.verifyAuthToken(
      token,
      'refresh',
    )) as ITokenPayloadResponse;
    const user = await this.usersService.getUserByPayload(payload);
    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  /**
   * Update Email
   *
   * Change current user email
   */
  public async updateEmail(
    res: FastifyReply,
    userId: number,
    { email }: LoginDto,
  ): Promise<IAuthResult> {
    const user = await this.usersService.getUserById(userId);

    user.email = email;
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  //____________________ OTHER METHODS ____________________

  /**
   * Verify Auth Token
   *
   * A generic jwt verifier that verifies all token needed for auth
   */
  public async verifyAuthToken(
    token: string,
    type: keyof IJwt,
  ): Promise<ITokenPayloadResponse | IAccessPayloadResponse> {
    const secret = this.configService.get<string>(`jwt.${type}.secret`);

    try {
      return await verifyToken(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else {
        throw new UnauthorizedException(error.message);
      }
    }
  }

  //____________________ PRIVATE METHODS ____________________

  /**
   * Generate Auth Tokens
   *
   * Generates an array with both the access and
   * refresh token.
   *
   * This function takes advantage of Promise.all.
   */
  private async generateAuthTokens({
    id,
    count,
  }: UserEntity): Promise<[string, string]> {
    return Promise.all([
      this.generateAuthToken({ id }, 'access'),
      this.generateAuthToken({ id, count }, 'refresh'),
    ]);
  }

  /**
   * Generate Jwt Token
   *
   * A generict jwt generator that generates all tokens needed
   * for auth (access, refresh, confirmation & resetPassword)
   */
  private async generateAuthToken(
    payload: ITokenPayload | IAccessPayload,
    type: keyof IJwt,
  ): Promise<string> {
    const { secret, time } = this.configService.get<ISingleJwt>(`jwt.${type}`);

    return await this.commonService.throwInternalError(
      generateToken(payload, secret, time),
    );
  }

  /**
   * Generate Access Code
   *
   * Generates a 6 char long number string for two factor auth
   */
  private async generateAccessCode(user: UserEntity): Promise<void> {
    const nums = '0123456789';

    let code = '';
    while (code.length < 6) {
      const i = Math.floor(Math.random() * nums.length);
      code += nums[i];
    }

    await this.commonService.throwInternalError(
      this.cacheManager.set(
        uuidV5(user.email, this.authNamespace),
        await hash(code, 5),
      ),
    );

    this.emailService.sendAccessCode(user, code);
  }

  /**
   * Save Refresh Cookie
   *
   * Saves the refresh token as an http only cookie to
   * be used for refreshing the access token
   */
  private saveRefreshCookie(res: FastifyReply, token: string): void {
    res.cookie(this.cookieName, token, {
      secure: true,
      httpOnly: true,
      path: '/api/auth/refresh-access',
      expires: new Date(Date.now() + 604800000),
    });
  }
}
