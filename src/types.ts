import TelegramBot from 'node-telegram-bot-api';
import {DataSource} from 'typeorm';

export type Config = {
  /**
   * The database file pathto store state in
   */
  dbPath: string;
  /**
   * The JSON files that the bot will read old messages from
   */
  messageFiles: {
    facebook: string[];
  };
  /**
   * The telegram chat ID the bot should be active in
   */
  chatId: string;
  /**
   * The minimum length a message must be to be considered a candidate to be
   * quoted
   */
  minMessageLength: number;
  /**
   * The messages the bot will oepn with
   */
  greetings: string[];
  /**
   * The message following the greeting, just before posting the quote
   */
  intros: string[];
};

export type AppCtx = {
  config: Config;
  db: DataSource;
  bot: TelegramBot;
};

export type FacebookMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type: 'Generic' | 'Share' | 'Call' | 'Subscribe' | 'Unsubscribe';
  is_unsent: boolean;
};
