import { Controller, Get } from '@nestjs/common';
import { MedicationsService } from './medications.service';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  async findAll() {
    return this.medicationsService.findAll();
  }
}
