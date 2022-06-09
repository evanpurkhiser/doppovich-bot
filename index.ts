import {promises as fs} from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import {random} from 'lodash';

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env['TELEGRAM_TOKEN']!;

if (token === undefined) {
  throw new Error('TELEGRAM_TOKEN must be set');
}

const groupId = '-1001375311913';

type FacebookMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type: 'Generic' | 'Share' | 'Call' | 'Subscribe' | 'Unsubscribe';
  is_unsent: boolean;
};

const files = [
  'message_1.json',
  'message_2.json',
  'message_3.json',
  'message_4.json',
  'message_5.json',
];

const minMessageLength = 30;

const greeters = [
  'Yo',
  'Yo guys',
  'Hey guys,',
  'Hey everyone,',
  'Omg',
  'Guys,',
  'Wait what.',
  'LOL',
];

const intros = [
  'Remember when [user] said:',
  'Remember that time when [user] said:',
  'I randomly stumbled on this thing that [user] said:',
  'Still can’t believe that [user] said:',
  'I still haven’t gotten over that time that [user] said:',
  'Not to keep dwelling on it, but I never forgot that [user] said:',
];

function randItem<V>(data: V[]) {
  return data[random(0, data.length - 1)];
}

async function main() {
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

  const greet = randItem(greeters);
  const intro = randItem(intros).replace('[user]', msg.sender_name.split(' ')[0]);

  bot.sendMessage(groupId, greet);
  await new Promise(r => setTimeout(r, 3000));
  bot.sendMessage(groupId, intro);
  await new Promise(r => setTimeout(r, 1000));
  bot.sendMessage(groupId, `"${msg.content}"`);
}

main();
