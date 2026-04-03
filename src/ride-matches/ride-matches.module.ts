import { Module } from '@nestjs/common';
import { RideMatchesController } from './ride-matches.controller';
import { RideMatchesService } from './ride-matches.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [RideMatchesController],
  providers: [RideMatchesService],
  exports: [RideMatchesService],
})
export class RideMatchesModule {}
