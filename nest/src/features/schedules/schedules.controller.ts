import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulesQueryDto } from './dto/schedules-query.dto';
import { SchedulesService } from './schedules.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  getSchedules(@Query() query: SchedulesQueryDto) {
    return this.schedulesService.getSchedules(query.year, query.month);
  }
}
