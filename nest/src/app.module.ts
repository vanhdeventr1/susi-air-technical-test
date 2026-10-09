import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import routerConfig from './cores/configs/router.config';
import { AuthModule } from './features/auth/auth.module';
import { DocumentsModule } from './features/documents/documents.module';
import { FlightHoursModule } from './features/flight-hours/flight-hours.module';
import { PilotModule } from './features/pilot/pilot.module';
import { SchedulesModule } from './features/schedules/schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: true,
    }),
    routerConfig,
    AuthModule,
    DocumentsModule,
    FlightHoursModule,
    PilotModule,
    SchedulesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
