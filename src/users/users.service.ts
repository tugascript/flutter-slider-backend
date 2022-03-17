import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { v5 as uuidV5 } from 'uuid';
import { RegisterDto } from '../auth/dtos/register.dto';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';
import { CommonService } from '../common/common.service';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UploaderService } from '../uploader/uploader.service';
import { GetUsersDto } from './dtos/get-users.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { getUserCursor } from './enums/users-cursor.enum';
import { USER_ALIAS } from './utilities/users.contants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    private readonly commonService: CommonService,
    private readonly uploaderService: UploaderService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly wsNamespace = this.configService.get<string>('WS_UUID');
  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');

  //____________________ MUTATIONS ____________________

  /**
   * Create User
   *
   * Creates a new user and saves him in db
   */
  public async createUser({
    username,
    email,
  }: RegisterDto): Promise<UserEntity> {
    const user = this.usersRepository.create({
      username,
      email,
    });

    await this.saveUserToDb(user, true);
    return user;
  }

  /**
   * Update Profile Picture
   *
   * Updates the current user profile picture and deletes
   * the old one if it exits
   */
  public async updateProfilePicture(
    userId: number,
    { picture }: ProfilePictureDto,
  ): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    const toDelete = user.picture;

    user.picture = await this.uploaderService.uploadImage(userId, picture, 1);

    if (toDelete) await this.uploaderService.deleteFile(toDelete);

    await this.saveUserToDb(user);
    return user;
  }

  /**
   * Delete User
   *
   * Deletes current user account
   */
  public async deleteUser(
    res: Response,
    userId: number,
  ): Promise<LocalMessageType> {
    const user = await this.getUserById(userId);

    try {
      await this.cacheManager.del(uuidV5(userId.toString(), this.wsNamespace));
    } catch (_) {}

    await this.commonService.throwInternalError(
      this.usersRepository.removeAndFlush(user),
    );
    res.clearCookie(this.cookieName, { path: '/api/auth/refresh-access' });
    return new LocalMessageType('Account deleted successfully');
  }

  //____________________ QUERIES ____________________

  /**
   * Get User For Auth
   *
   * Gets a user by email for auth
   */
  public async getUserForAuth(email: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  /**
   * Get Uncheck User
   *
   * Gets a user by email and does not check if it exists
   */
  public async getUncheckUser(
    email: string,
  ): Promise<UserEntity | undefined | null> {
    const user = await this.usersRepository.findOne({ email });
    return user;
  }

  /**
   * Get User By Payload
   *
   * Gets user by jwt payload for auth
   */
  public async getUserByPayload({
    id,
    count,
  }: ITokenPayload): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id, count });
    if (!user)
      throw new UnauthorizedException('Token is invalid or has expired');
    return user;
  }

  /**
   * Get User By Id
   *
   * Gets user by id, usually the current logged in user
   */
  public async getUserById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    this.commonService.checkExistence('User', user);
    return user;
  }

  /**
   * Get User By Username
   *
   * Gets user by username, usually for the profile (if it exists)
   */
  public async getUserByUsername(username: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ username });
    this.commonService.checkExistence('User', user);
    return user;
  }

  /**
   * Get User By Ids
   *
   * Get users in an ids array
   */
  public async getUsersByIds(ids: number[]): Promise<UserEntity[]> {
    const users = await this.usersRepository.find({
      id: {
        $in: ids,
      },
    });
    return users;
  }

  /**
   * Find Users
   *
   * Search users usernames and returns paginated results
   */
  public async findUsers({
    search,
    order,
    cursor,
    first,
    after,
  }: GetUsersDto): Promise<IPaginated<UserEntity>> {
    const qb = this.usersRepository.createQueryBuilder(USER_ALIAS);

    if (search) {
      qb.where({
        username: {
          $like: this.commonService.formatSearch(search),
        },
      });
    }

    return await this.commonService.queryBuilderPagination(
      USER_ALIAS,
      getUserCursor(cursor),
      first,
      order,
      qb,
      after,
    );
  }

  //____________________ OTHER ____________________

  /**
   * Save User To Database
   *
   * Inserts or updates user in the database.
   * This method exists because saving the user has
   * to be shared with the auth service.
   */
  public async saveUserToDb(user: UserEntity, isNew = false): Promise<void> {
    await this.commonService.validateEntity(user);

    if (isNew) this.usersRepository.persist(user);

    await this.commonService.throwDuplicateError(
      this.usersRepository.flush(),
      'Username or email already exist',
    );
  }

  public createQueryBuilder() {
    return this.usersRepository.createQueryBuilder(USER_ALIAS);
  }
}
