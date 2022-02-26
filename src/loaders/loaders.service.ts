import { Injectable } from '@nestjs/common';
import { FilterDto } from '../common/dtos/filter.dto';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { RecordEntity } from '../records/entities/record.entity';
import { RecordsService } from '../records/records.service';

@Injectable()
export class LoadersService {
  constructor(private readonly recordsService: RecordsService) {}

  public async recordsLoader(
    userId: number,
    dto: FilterDto,
  ): Promise<IPaginated<RecordEntity>> {
    return await this.recordsService.loadRecords(userId, dto);
  }
}
