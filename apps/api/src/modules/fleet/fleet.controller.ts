import { Controller, Get } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetHealthResponseDto } from './dto/fleet-health-response.dto';

@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('health')
  getHealth(): Promise<FleetHealthResponseDto> {
    return this.fleetService.getHealth();
  }
}
