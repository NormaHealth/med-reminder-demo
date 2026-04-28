import { Controller, Get, Post, Param } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller()
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('users/:id/reminders/today')
  async getTodayReminders(@Param('id') userId: string) {
    return this.remindersService.getTodayForUser(userId);
  }

  @Post('reminders/:id/confirm')
  async confirm(@Param('id') id: string) {
    try {
      return await this.remindersService.confirm(id);
    } catch (error) {
      // BUG: silently swallows errors and returns 200
      return { success: true };
    }
  }
}
