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

  /**
   * The source of the message
   */
  @Column()
  messageType!: 'facebook';

  /**
   * The message index of the message that was posted
   */
  @Column()
  messageIdx!: number;

  /**
   * When Taryn response with when the message was this will be the message ID
   * of his response
   */
  @Column({type: 'int', nullable: true})
  whenWasMessageId: number | null = null;

  /**
   * When Taryn response with context of the message
   */
  @Column({type: 'int', nullable: true})
  contextMessageId: number | null = null;

  /**
   * When did taryn send this message
   */
  @CreateDateColumn()
  sentAt!: Date;

  static findLastMessage() {
    return this.createQueryBuilder('message').orderBy('message.sentAt', 'DESC').getOne();
  }
}
