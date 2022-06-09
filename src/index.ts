import {promises as fs} from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import yaml from 'yaml';

import {randItem} from './utils';

type FacebookMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type: 'Generic' | 'Share' | 'Call' | 'Subscribe' | 'Unsubscribe';
  is_unsent: boolean;
};

type Config = {
  chatId: string;
  minMessageLength: number;
  greetings: string[];
  intros: string[];
};

const files = [
  'message_1.json',
  'message_2.json',
  'message_3.json',
  'message_4.json',
  'message_5.json',
];

const minMessageLength = 30;

async function main() {
  const token = process.env['TELEGRAM_TOKEN'];

  if (token === undefined) {
    throw new Error('TELEGRAM_TOKEN must be set');
  }

  const config = yaml.parse(await fs.readFile('config.yml', 'utf8')) as Config;
  const {chatId} = config;

  const bot = new TelegramBot(token, {polling: true});

  const messageData = await Promise.all(files.map(n => fs.readFile(n, 'utf8')));
  const allMessages = messageData
    .map(data => JSON.parse(data).messages)
    .flat() as FacebookMessage[];

  console.log('Messages loaded:', allMessages.length);

  const messagesWithContent = allMessages
    .filter(msg => msg.type === 'Generic')
    .filter(msg => msg.content !== undefined)
    .filter(msg => (msg.content?.length ?? 0) > minMessageLength);

  console.log('Messages with content:', messagesWithContent.length);

  const msg = randItem(messagesWithContent);

  const greet = randItem(config.greetings);
  const intro = randItem(config.intros).replace('[user]', msg.sender_name.split(' ')[0]);

  bot.sendMessage(chatId, greet);
  await new Promise(r => setTimeout(r, 3000));
  bot.sendMessage(chatId, intro);
  await new Promise(r => setTimeout(r, 1000));
  bot.sendMessage(chatId, `"${msg.content}"`);
}

main();
