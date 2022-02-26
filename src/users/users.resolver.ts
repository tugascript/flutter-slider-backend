import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload';
import { RecordsService } from 'src/records/records.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FilterDto } from '../common/dtos/filter.dto';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { RecordEntity } from '../records/entities/record.entity';
import { PaginatedRecordsType } from '../records/gql-types/paginated-records.type';
import { GetUserDto } from './dtos/get-user.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly recordsService: RecordsService,
  ) {}

  //____________________ MUTATIONS ____________________

  @Mutation(() => UserEntity)
  public async updateProfilePicture(
    @CurrentUser() userId: number,
    @Args() dto: ProfilePictureDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfilePicture(userId, dto);
  }

  @Public()
  @Mutation(() => String)
  public async testFileUpload(
    @Args({
      type: () => GraphQLUpload,
      name: 'file',
    })
    file: Promise<FileUpload>,
  ): Promise<string> {
    console.log(await file);
    return 'hello';
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

  //____________________ RESOLVE FIELDS ____________________

  @Public()
  @ResolveField('records', () => PaginatedRecordsType)
  public async loadRecords(
    @Parent() user: UserEntity,
    @Args() dto: FilterDto,
  ): Promise<IPaginated<RecordEntity>> {
    return this.recordsService.loadRecords(user.id, dto);
  }
}
