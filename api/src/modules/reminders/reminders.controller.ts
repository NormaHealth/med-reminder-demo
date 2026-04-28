import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller()
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Returns reminders that are currently firing for `now` — i.e. PENDING
   * doses whose scheduledFor is within the last 30 minutes of `now`.
   * If `now` is omitted, server wall-clock is used.
   */
  @Get('users/:id/reminders/firing')
  async getFiringReminders(
    @Param('id') userId: string,
    @Query('now') nowQuery?: string,
  ) {
    const now = nowQuery ? new Date(nowQuery) : new Date();
    if (Number.isNaN(now.getTime())) {
      throw new BadRequestException('`now` must be a valid ISO-8601 timestamp');
    }
    return this.remindersService.getFiringForUser(userId, now);
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
