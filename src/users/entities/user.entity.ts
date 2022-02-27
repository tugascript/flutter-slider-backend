/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  Collection,
  Entity,
  OneToMany,
  OptionalProps,
  Property,
} from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  IsDate,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { SLUG_REGEX } from '../../common/constants/regex';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { RecordEntity } from '../../records/entities/record.entity';
import { ownerMiddleware } from '../middleware/owner.middleware';

@ObjectType('User')
@Entity({ tableName: 'users' })
export class UserEntity extends LocalBaseEntity {
  [OptionalProps]?:
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'picture'
    | 'count'
    | 'level'
    | 'lastLogin'
    | 'lastOnline';

  @Field(() => String)
  @Property({ columnType: 'varchar(110)', unique: true })
  @IsString()
  @Length(3, 100)
  @Matches(SLUG_REGEX)
  public username!: string;

  @Field(() => String, { nullable: true, middleware: [ownerMiddleware] })
  @Property({ columnType: 'varchar(255)', unique: true })
  @IsEmail()
  public email!: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar(255)', nullable: true })
  @IsOptional()
  @IsUrl()
  public picture?: string;

  @Field(() => Int)
  @Property({ columnType: 'int', default: 1 })
  public maxLevel: number = 1;

  @Property({ columnType: 'int', default: 0 })
  @IsInt()
  public count: number = 0;

  @Field(() => String)
  @Property()
  @IsDate()
  public lastLogin: Date = new Date();

  @Field(() => String)
  @Property()
  @IsDate()
  public lastOnline: Date = new Date();

  // Relations

  @OneToMany(() => RecordEntity, (r) => r.owner)
  public records = new Collection<RecordEntity>(this);
}
