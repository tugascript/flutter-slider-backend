import { FilterUserRecordsDto } from '../../users/dtos/filter-user-records.dto';
import { UserEntity } from '../../users/entities/user.entity';

export interface IUsersRecordsQuery {
  obj: UserEntity;
  params: FilterUserRecordsDto;
}
