import {DataSource} from 'typeorm';
import {promises as fs} from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import yaml from 'yaml';

import {Config, AppCtx} from 'src/types';
import {sendNewQuote} from 'src/messages';
import {Message} from 'src/entity/message';
import WhenWasFollowup from 'src/followup/whenWas';
import {loadFacebookMessages} from './loaders';

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
  await db.initialize();

  const ctx: AppCtx = {
    config,
    bot,
    db,
    messages: {
      facebook: await loadFacebookMessages(config),
    },
  };

  // TODO: Put this into a cron type loop thing

  sendNewQuote(ctx);

  bot.on('message', new WhenWasFollowup(ctx).handleMessage);
}

main();
