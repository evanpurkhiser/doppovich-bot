import TelegramBot from 'node-telegram-bot-api';
import {DataSource} from 'typeorm';

type FollowUpCommon = {
  /**
   * How long until Taryn no longer will respond to message matches. In seconds
   */
  timeLimit: number;
  /**
   * Regex (in the format `/regex/`) or exact string matches of what
   */
  matches: string[];
};

/*
 * The configuration for the 'when was that' follow up
 */
type FollowUpWhenWas = FollowUpCommon & {
  /**
   * The list of possible response lists.
   */
  responses: string[][];
};

/*
 * The configuration for the 'what is the contxt of that' follow up
 */
type FollowUpContext = FollowUpCommon & {
  /**
   * A list of possible intro messages to send before pasting the context
   */
  intros: string[];
  /**
   * A list of possible outro messages to send after pasting the context
   */
  outros: string[];
};

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
  /**
   * Name aliases (ie: Joseph is Joe). A list of multiple names may be used to
   * have Taryn randomly select names
   */
  userAlias: Record<string, string[]>;
  /**
   * Follow up configurations
   */
  followups: {
    whenWas: FollowUpWhenWas;
    context: FollowUpContext;
  };
};

export type AppCtx = {
  config: Config;
  db: DataSource;
  bot: TelegramBot;
  messages: {
    facebook: FacebookMessage[];
  };
};

export type FacebookMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type: 'Generic' | 'Share' | 'Call' | 'Subscribe' | 'Unsubscribe';
  is_unsent: boolean;
};
