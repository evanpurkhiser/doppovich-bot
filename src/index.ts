import {DataSource} from 'typeorm';
import {promises as fs} from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import yaml from 'yaml';
import {init as initSentry, captureException} from '@sentry/node';

import {Config, AppCtx} from 'src/types';
import {sendNewQuote} from 'src/messages';
import {Message} from 'src/entity/message';
import WhenWasFollowup from 'src/followup/whenWas';
import ContextFollowup from 'src/followup/context';
import {loadFacebookMessages} from 'src/loaders';

initSentry({
  dsn: 'https://5833ef4ec765499aa7c06b32a8a8879f@o126623.ingest.sentry.io/6526917',
  tracesSampleRate: 1.0,
});

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

  const safeHandler = (handler: (message: TelegramBot.Message) => void) =>
    function (message: TelegramBot.Message) {
      try {
        return handler(message);
      } catch (error) {
        const errId = captureException(error);
        bot.sendMessage(
          config.chatId,
          `Shit, Something fucked up @evanpurkhiser. Here's the Sentry error: ${errId}`
        );
      }
    };

  bot.on('message', safeHandler(new WhenWasFollowup(ctx).handleMessage));
  bot.on('message', safeHandler(new ContextFollowup(ctx).handleMessage));
}

main();
