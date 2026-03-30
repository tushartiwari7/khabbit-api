import { Module } from '@nestjs/common';
import { RideMatchesController } from './ride-matches.controller';
import { RideMatchesService } from './ride-matches.service';

@Module({
  controllers: [RideMatchesController],
  providers: [RideMatchesService],
  exports: [RideMatchesService],
})
export class RideMatchesModule {}
