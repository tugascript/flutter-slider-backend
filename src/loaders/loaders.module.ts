import { Module } from '@nestjs/common';
import { RecordsModule } from 'src/records/records.module';
import { LoadersService } from './loaders.service';

@Module({
  imports: [RecordsModule],
  providers: [LoadersService],
  exports: [LoadersService],
})
export class LoadersModule {}
