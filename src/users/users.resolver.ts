import {
  Args,
  Int,
  Mutation,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { PaginatedRecordsType } from '../records/gql-types/paginated-records.type';
import { FilterUserRecordsDto } from './dtos/filter-user-records.dto';
import { GetUserDto } from './dtos/get-user.dto';
import { GetUsersDto } from './dtos/get-users.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { PaginatedUsersType } from './gql-types/paginated-users.type';
import { UsersService } from './users.service';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  //____________________ MUTATIONS ____________________

  @Mutation(() => UserEntity)
  public async updateProfilePicture(
    @CurrentUser() userId: number,
    @Args() dto: ProfilePictureDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfilePicture(userId, dto);
  }

  //____________________ QUERIES ____________________

  @Query(() => UserEntity)
  public async me(@CurrentUser() userId: number): Promise<UserEntity> {
    return this.usersService.getUserById(userId);
  }

  //____________________ PUBLIC QUERIES ____________________

  @Public()
  @Query(() => UserEntity)
  public async getUser(@Args() dto: GetUserDto): Promise<UserEntity> {
    return this.usersService.getUserByUsername(dto.username);
  }

  @Public()
  @Query(() => PaginatedUsersType)
  public async getUsers(
    @Args() dto: GetUsersDto,
  ): Promise<IPaginated<UserEntity>> {
    return this.usersService.findUsers(dto);
  }

  //____________________ RESOLVE FIELDS ____________________
  // LOGIC INSIDE DATALOADERS

  @ResolveField('records', () => PaginatedRecordsType)
  public async loadRecords(
    @Args() // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: FilterUserRecordsDto,
  ) {
    return;
  }

  @ResolveField('maxLevel', () => Int)
  public async loadMaxLevel() {
    return;
  }
}
