import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FlightHoursQueryDto } from './dto/flight-hours-query.dto';
import { FlightHoursSummaryQueryDto } from './dto/flight-hours-summary-query.dto';
import { FlightHoursService } from './flight-hours.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class FlightHoursController {
  constructor(private readonly flightHoursService: FlightHoursService) {}

  @Get()
  getDailyHours(@Query() query: FlightHoursQueryDto) {
    return this.flightHoursService.getDailyHours(query.from, query.to);
  }

  @Get('summary')
  getRollingSummary(@Query() query: FlightHoursSummaryQueryDto) {
    return this.flightHoursService.getRollingSummary(query.range);
  }
}
