import { registerEnumType } from '@nestjs/graphql';

export enum QueryOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const localQueryOrder = (val: QueryOrderEnum): '$gt' | '$lt' =>
  val === QueryOrderEnum.ASC ? '$gt' : '$lt';

registerEnumType(QueryOrderEnum, {
  name: 'QueryOrder',
});
