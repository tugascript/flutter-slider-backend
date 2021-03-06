import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { SLUG_REGEX } from '../../common/constants/regex';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { QueryOrderEnum } from '../../common/enums/query-order.enum';
import { UsersCursorEnum } from '../enums/users-cursor.enum';

@ArgsType()
export abstract class GetUsersDto extends PaginationDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @Matches(SLUG_REGEX, {
    message:
      'Search can only contain letters, dots, slashes, underscores and numbers.',
  })
  @IsOptional()
  public search?: string;

  @Field(() => UsersCursorEnum, { defaultValue: UsersCursorEnum.DATE })
  @IsEnum(UsersCursorEnum)
  public cursor: UsersCursorEnum = UsersCursorEnum.DATE;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.DESC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.DESC;
}
