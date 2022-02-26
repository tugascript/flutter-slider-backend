import {
  Entity,
  Index,
  ManyToOne,
  OptionalProps,
  Property,
} from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType('Record')
@Index({ properties: ['time', 'moves', 'id'] })
@Entity({ tableName: 'records' })
export class RecordEntity extends LocalBaseEntity {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt' | 'performance';

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Property({ columnType: 'int' })
  public level!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Property({ columnType: 'int' })
  public moves!: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Property({ columnType: 'int' })
  public time!: number;

  // Indexes

  @Index()
  @Property()
  public performance?: number;

  // Relations

  @ManyToOne({
    entity: () => UserEntity,
    inversedBy: (u) => u.records,
    onDelete: 'cascade',
  })
  @IsNotEmpty()
  public owner!: UserEntity;
}
