import {randItem, sleepRange} from 'src/utils';
import {AppCtx} from 'src/types';
import {loadFacebookMessages} from 'src/loaders';
import {Message} from 'src/entity/message';

/**
 * Picks a quote from the message history and posts it
 */
export async function sendNewQuote(ctx: AppCtx) {
  const {config, bot, messages} = ctx;
  const {chatId, greetings, intros} = config;

  const msg = randItem(messages.facebook);

  const firstName = msg.sender_name.split(' ')[0];
  const senderName = randItem(config.userAlias[firstName] ?? [firstName]);

  const greet = randItem(greetings);
  const intro = randItem(intros).replace('[user]', senderName);

  await bot.sendMessage(chatId, greet);
  await sleepRange(2000, 3000);
  await bot.sendMessage(chatId, intro);
  await sleepRange(1000, 2000);
  await bot.sendMessage(chatId, `"${msg.content}"`);

  const message = Message.create({
    messageType: 'facebook',
    messageIdx: messages.facebook.indexOf(msg),
  });
  await message.save();
}
