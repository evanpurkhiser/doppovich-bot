import {captureException, init as initSentry} from '@sentry/node';
import TelegramBot from 'node-telegram-bot-api';
import {DataSource} from 'typeorm';
import yaml from 'yaml';

import {promises as fs} from 'fs';

import {Message} from 'src/entity/message';
import ContextFollowup from 'src/followup/context';
import WhenWasFollowup from 'src/followup/whenWas';
import {loadFacebookMessages, loadTelegramMessages} from 'src/loaders';
import {sendNewQuote} from 'src/messages';
import {AppCtx, Config, GenericMessage} from 'src/types';
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
        bot.sendMessage(config.errorChatId, msg);
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

  const [, me] = await Promise.all([db.initialize(), bot.getMe()]);

  const messages: Record<TelegramBot.ChatId, GenericMessage[]> = {};

  for (const chat of config.chats) {
    const facebookMessages = await loadFacebookMessages(config, chat);
    const telegramMessages = await loadTelegramMessages(config, chat);

    messages[chat.id] = [...facebookMessages, ...telegramMessages];
  }

  const ctx: AppCtx = {
    config,
    bot,
    db,
    messages,
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

  bot.onText(new RegExp(`^@${me.username}$`), msg => {
    sendNewQuote(ctx, msg.chat.id);
  });

  // Say hi to taryn
  bot.onText(new RegExp(`@${me.username}`), async msg => {
    console.log('Message in chat id', msg.chat.id);

    const includesTriggerWord = config.hello.triggers.some(t =>
      msg.text?.toLowerCase().match(new RegExp(`\\b${t}\\b`))
    );

    if (includesTriggerWord) {
      await sleepRange(500, 2000);
      bot.sendMessage(msg.chat.id, randItem(config.hello.responses));
    }
  });

  bot.on('message', safeHandler(new WhenWasFollowup(ctx).handleMessage));
  bot.on('message', safeHandler(new ContextFollowup(ctx).handleMessage));
}

main();
