import {captureMessage} from '@sentry/node';

import {Message} from 'src/entity/message';
import {AppCtx} from 'src/types';
import {randItem, sleepRange} from 'src/utils';

/**
 * Picks a quote from the message history and posts it
 */
export async function sendNewQuote(ctx: AppCtx, chatId: number) {
  const {config, bot, messages} = ctx;
  const {opening, intros} = config;

  if (messages[chatId].length === 0) {
    captureMessage(`chatId: ${chatId} does not have any message history`);
    return;
  }

  const msg = randItem(messages[chatId]);

  const firstName = msg.senderName.split(' ')[0];
  const senderName = randItem(config.userAlias[msg.senderName] ?? [firstName]);

  const greet = randItem(opening);
  const intro = randItem(intros).replace('[user]', senderName);

  await bot.sendMessage(chatId, greet);
  await sleepRange(2000, 3000);
  await bot.sendMessage(chatId, intro);
  await sleepRange(1000, 2000);
  await bot.sendMessage(chatId, `"${msg.text}"`);

  const message = Message.create({
    chatId,
    messageIdx: messages[chatId].indexOf(msg),
  });
  await message.save();
}
