import { Entity, Enum, OneToOne, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { DifficultyEnum } from '../enum/difficulty.enum';
import { GameStatusEnum } from '../enum/game-status.enum';
import { GameWinnerEnum } from '../enum/game-winner.enum';

@ObjectType('Game')
@Entity({ tableName: 'games' })
export class GameEntity extends LocalBaseEntity {
  @Field(() => DifficultyEnum)
  @Enum({
    items: () => DifficultyEnum,
    columnType: 'varchar(6)',
  })
  @IsEnum(DifficultyEnum)
  public difficulty!: DifficultyEnum;

  @Field(() => Int)
  @Property({ columnType: 'int' })
  @IsInt()
  @Min(1)
  @Max(5)
  public level!: number;

  @Field(() => GameStatusEnum)
  @Enum({
    items: () => GameStatusEnum,
    columnType: 'varchar(4)',
    default: GameStatusEnum.new,
  })
  @IsEnum(GameStatusEnum)
  public status: GameStatusEnum = GameStatusEnum.new;

  @Field(() => GameWinnerEnum)
  @Enum({
    items: () => GameWinnerEnum,
    columnType: 'varchar(10)',
    default: GameWinnerEnum.unsettled,
  })
  @IsEnum(GameWinnerEnum)
  public winner: GameWinnerEnum = GameWinnerEnum.unsettled;

  @Field(() => String)
  @Property()
  @IsUrl()
  public image!: string;

  @Field(() => Int)
  @Property({ columnType: 'int', default: 1 })
  @IsInt()
  @Min(1)
  public time = 1;

  @Field(() => UserEntity)
  @OneToOne({
    entity: () => UserEntity,
    eager: true,
  })
  @IsNotEmpty()
  public host!: UserEntity;

  @Field(() => UserEntity)
  @OneToOne({
    entity: () => UserEntity,
    eager: true,
    nullable: true,
  })
  @IsOptional()
  public challenger?: UserEntity;
}
