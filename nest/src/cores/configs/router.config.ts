import { RouterModule } from '@nestjs/core';
import { AuthModule } from '../../features/auth/auth.module';
import { DocumentsModule } from '../../features/documents/documents.module';
import { FlightHoursModule } from '../../features/flight-hours/flight-hours.module';
import { PilotModule } from '../../features/pilot/pilot.module';
import { SchedulesModule } from '../../features/schedules/schedules.module';

export default RouterModule.register([
  {
    path: '/api/v1',
    children: [
      {
        path: 'auth',
        module: AuthModule,
      },
      {
        path: 'pilot',
        module: PilotModule,
      },
      {
        path: 'flight-hours',
        module: FlightHoursModule,
      },
      {
        path: 'documents',
        module: DocumentsModule,
      },
      {
        path: 'schedules',
        module: SchedulesModule,
      },
    ],
  },
]);
