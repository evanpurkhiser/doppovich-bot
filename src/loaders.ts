import {promises as fs} from 'fs';
import glob from 'fast-glob';
import {Config, GenericMessage} from './types';

type FacebookMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type: 'Generic' | 'Share' | 'Call' | 'Subscribe' | 'Unsubscribe';
  is_unsent: boolean;
};

type TelegramMessage = {
  type: 'message' | 'service';
  date_unixtime: string;
  from: string;
  text:
    | string
    | Array<string | {type: 'link' | 'mention' | 'mention_name'; text: string}>;
};

/**
 * Loads facebook messages
 */
export async function loadFacebookMessages(config: Config) {
  const files = await glob(config.messageFiles.facebook);

  const messageData = await Promise.all(files.map(n => fs.readFile(n, 'utf-8')));
  const allMessages = messageData
    .map(data => JSON.parse(data).messages)
    .flat() as FacebookMessage[];

  console.log('Facebook Messages loaded:', allMessages.length);

  const messagesWithContent = allMessages
    .filter(msg => msg.type === 'Generic')
    .filter(msg => msg.content !== undefined)
    .filter(msg => (msg.content?.length ?? 0) > config.minMessageLength);

  const messages = messagesWithContent.map(msg => {
    const genericMessage: GenericMessage = {
      senderName: msg.sender_name,
      timestampMs: msg.timestamp_ms,
      text: msg.content ?? '',
    };
    return genericMessage;
  });

  console.log('Facebook messages with content:', messages.length);

  return messages;
}

/**
 * Loads telegram messages
 */
export async function loadTelegramMessages(config: Config) {
  const files = await glob(config.messageFiles.telegram);

  const messageData = await Promise.all(files.map(n => fs.readFile(n, 'utf8')));
  const allMessages = messageData
    .map(data => JSON.parse(data).messages)
    .flat() as TelegramMessage[];

  console.log('TelegramMessage Messages loaded:', allMessages.length);

  const messagesWithContent = allMessages
    .filter(msg => msg.type === 'message')
    .filter(msg => msg.text !== '')
    .filter(
      msg =>
        // Filter out text that is just a single text object (like a link or a
        // user mention)
        !(
          typeof msg.text !== 'string' &&
          msg.text.length === 1 &&
          typeof msg.text[0] !== 'string'
        )
    )
    .filter(msg => (msg.text?.length ?? 0) > config.minMessageLength);

  const messages = messagesWithContent.map(msg => {
    const genericMessage: GenericMessage = {
      senderName: msg.from,
      timestampMs: Number(msg.date_unixtime) * 1000,
      text:
        typeof msg.text === 'string'
          ? msg.text
          : msg.text.map(m => (typeof m === 'string' ? m : m.text)).join(''),
    };
    return genericMessage;
  });

  console.log('telegram messages with content:', messages.length);

  return messages;
}
