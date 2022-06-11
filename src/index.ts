import {DataSource} from 'typeorm';
import {promises as fs} from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import yaml from 'yaml';

import {Config, AppCtx} from './types';
import {sendNewQuote} from './messages';
import {Message} from './entity/message';

async function main() {
  const token = process.env['TELEGRAM_TOKEN'];

  if (token === undefined) {
    throw new Error('TELEGRAM_TOKEN must be set');
  }

  const bot = new TelegramBot(token, {polling: true});
  const config = yaml.parse(await fs.readFile('config.yml', 'utf8')) as Config;

  const db = new DataSource({
    type: 'sqlite',
    database: config.dbPath,
    entities: [Message],
    logging: true,
    synchronize: true,
  });
  await db.connect();

  const ctx: AppCtx = {config, bot, db};

  sendNewQuote(ctx);

  bot.onText(/hi taryn/, msg => {
    bot.sendMessage(msg.chat.id, `Hey there ${msg.from?.first_name}`);
  });
}

main();
