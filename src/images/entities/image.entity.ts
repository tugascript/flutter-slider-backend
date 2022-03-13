import { Entity, ManyToOne, OptionalProps, Property } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType('Image')
@Entity({ tableName: 'images' })
export class ImageEntity extends LocalBaseEntity {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @Property({ columnType: 'varchar(255)' })
  @Field(() => String)
  @IsString()
  @IsUrl()
  public url!: string;

  @ManyToOne({
    entity: () => UserEntity,
    onDelete: 'cascade',
  })
  @IsNotEmpty()
  public owner!: UserEntity;
}
