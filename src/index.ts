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
import {loadFacebookMessages, loadTelegramMessages} from 'src/loaders';
import {randItem, sleepRange} from 'src/utils';

async function main() {
  const token = process.env['TELEGRAM_TOKEN'];

  if (token === undefined) {
    throw new Error('TELEGRAM_TOKEN must be set');
  }

  const bot = new TelegramBot(token, {polling: true});
  const config = yaml.parse(await fs.readFile('config.yml', 'utf8')) as Config;

  initSentry({
    dsn: 'https://5833ef4ec765499aa7c06b32a8a8879f@o126623.ingest.sentry.io/6526917',
    tracesSampleRate: 1.0,

    // Have Taryn post if we end up reporting something to Sentry
    beforeSend: event => {
      const msg = randItem(config.errorMessages).replace(
        '[errId]',
        event.event_id ?? '[unknown event id]'
      );
      try {
        bot.sendMessage(config.chatId, msg);
      } catch {
        // noop
      }
      return event;
    },
  });

  const db = new DataSource({
    type: 'sqlite',
    database: config.dbPath,
    entities: [Message],
    logging: true,
    synchronize: true,
  });

  const [_, me, facebookMessages, telegramMessages] = await Promise.all([
    db.initialize(),
    bot.getMe(),
    loadFacebookMessages(config),
    loadTelegramMessages(config),
  ]);

  const ctx: AppCtx = {
    config,
    bot,
    db,
    messages: [...facebookMessages, ...telegramMessages],
  };

  const safeHandler = (handler: (message: TelegramBot.Message) => Promise<any>) =>
    async function (message: TelegramBot.Message) {
      try {
        await handler(message);
      } catch (error) {
        console.error(error);
        captureException(error);
      }
    };

  console.log(`Bot started. Username is @${me.username}`);

  // TODO: Put this into a cron type loop thing
  sendNewQuote(ctx, config.chatId);

  // Say hi to taryn
  bot.onText(new RegExp(`@${me.username}`), async msg => {
    if (config.hello.triggers.some(t => msg.text?.toLowerCase().includes(t))) {
      await sleepRange(500, 2000);
      bot.sendMessage(msg.chat.id, randItem(config.hello.responses));
    }
  });

  bot.on('message', safeHandler(new WhenWasFollowup(ctx).handleMessage));
  bot.on('message', safeHandler(new ContextFollowup(ctx).handleMessage));
}

main();
