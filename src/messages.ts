import TelegramBot from 'node-telegram-bot-api';

import {randItem} from './utils';
import {AppCtx} from './types';
import {loadFacebookMessages} from './loaders';
import {Message} from './entity/message';

/**
 * Picks a quote from the message history and posts it
 */
export async function sendNewQuote(ctx: AppCtx) {
  const {config, bot, db} = ctx;
  const {chatId, greetings, intros, minMessageLength} = config;

  const fbMessages = await loadFacebookMessages(config.messageFiles.facebook);
  console.log('Messages loaded:', fbMessages.length);

  const messagesWithContent = fbMessages
    .filter(msg => msg.type === 'Generic')
    .filter(msg => msg.content !== undefined)
    .filter(msg => (msg.content?.length ?? 0) > minMessageLength);

  console.log('Messages with content:', messagesWithContent.length);

  const msg = randItem(messagesWithContent);

  const firstName = msg.sender_name.split(' ')[0];
  const senderName = randItem(config.userAlias[firstName] ?? [firstName]);

  const greet = randItem(greetings);
  const intro = randItem(intros).replace('[user]', senderName);

  bot.sendMessage(chatId, greet);
  await new Promise(r => setTimeout(r, 3000));
  bot.sendMessage(chatId, intro);
  await new Promise(r => setTimeout(r, 1000));
  bot.sendMessage(chatId, `"${msg.content}"`);

  const message = Message.create({
    messageType: 'facebook',
    messageIdx: fbMessages.indexOf(msg),
  });
  message.save();
}
