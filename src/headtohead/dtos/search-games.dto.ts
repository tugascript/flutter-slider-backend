import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { SLUG_REGEX } from '../../common/constants/regex';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ArgsType()
export abstract class SearchGamesDto extends PaginationDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @Length(3, 100)
  @Matches(SLUG_REGEX, {
    message:
      'Usernames can only have letters, numbers, dashes, dots and underscores',
  })
  @IsOptional()
  public search?: string;
}
