import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min, ValidatePromise } from 'class-validator';
import { GraphQLUpload } from 'graphql-upload';
import { FileUploadDto } from 'src/uploader/dtos/file-upload.dto';
import { DifficultyEnum } from '../enum/difficulty.enum';

@InputType('GameInput')
export abstract class GameInput {
  @Field(() => DifficultyEnum)
  @IsEnum(DifficultyEnum)
  public difficulty!: DifficultyEnum;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  public level!: number;

  @Field(() => GraphQLUpload)
  @ValidatePromise()
  @Type(() => FileUploadDto)
  public image!: Promise<FileUploadDto>;
}
