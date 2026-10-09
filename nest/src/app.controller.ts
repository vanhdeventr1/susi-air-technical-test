import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('documents')
  getDocuments(): unknown {
    return this.appService.getDocuments();
  }

  @Get('flight-hours')
  getFlightHours(): unknown {
    return this.appService.getFlightHours();
  }

  @Get('schedules')
  getSchedules(): unknown {
    return this.appService.getSchedules();
  }
}
