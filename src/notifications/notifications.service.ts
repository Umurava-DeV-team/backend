import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(userId: string, title: string, message: string, type: string, referenceId?: string) {
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type,
      referenceId,
    });
    return await this.notificationRepo.save(notification);
  }

  async findAllForUser(userId: string) {
    return await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string) {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.read = true;
    return await this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string) {
    return await this.notificationRepo.update(
      { userId, read: false },
      { read: true },
    );
  }

  async delete(notificationId: string) {
    const result = await this.notificationRepo.delete(notificationId);
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { success: true };
  }
}
