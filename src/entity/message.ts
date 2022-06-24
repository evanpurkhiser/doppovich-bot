import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  messageType!: 'facebook';

  @Column()
  messageIdx!: number;

  @CreateDateColumn()
  sentAt!: Date;

  static findLastMessage() {
    return this.createQueryBuilder('message').orderBy('message.sentAt', 'DESC').getOne();
  }
}
