import {randItem, sleepRange} from 'src/utils';
import {AppCtx} from 'src/types';
import {Message} from 'src/entity/message';

/**
 * Picks a quote from the message history and posts it
 */
export async function sendNewQuote(ctx: AppCtx, chatId: number) {
  const {config, bot, messages} = ctx;
  const {opening, intros} = config;

  const msg = randItem(messages);

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
    messageIdx: messages.indexOf(msg),
  });
  await message.save();
}
