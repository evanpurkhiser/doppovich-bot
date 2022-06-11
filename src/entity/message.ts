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
}
