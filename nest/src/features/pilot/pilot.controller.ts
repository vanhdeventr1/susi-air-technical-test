import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PilotService } from './pilot.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class PilotController {
  constructor(private readonly pilotService: PilotService) {}

  @Get('me')
  getProfile() {
    return this.pilotService.getProfile();
  }
}
