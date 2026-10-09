import { IsIn } from 'class-validator';
import {
  FLIGHT_HOURS_RANGES,
  type FlightHoursRange,
} from '../flight-hours.types';

export class FlightHoursSummaryQueryDto {
  @IsIn(FLIGHT_HOURS_RANGES)
  range: FlightHoursRange;
}
