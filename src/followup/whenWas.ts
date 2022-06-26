import moment from 'moment';
import TelegramBot from 'node-telegram-bot-api';

import {Message} from 'src/entity/message';
import {AppCtx} from 'src/types';
import {randItem, sleepRange, textMatches} from 'src/utils';

class WhenWasFollowup {
  #ctx: AppCtx;
  #isPosting: boolean;

  constructor(ctx: AppCtx) {
    this.#ctx = ctx;
    this.#isPosting = false;
  }

  handleMessage = async (message: TelegramBot.Message) => {
    const {config, messages, bot} = this.#ctx;

    if (message.text === undefined) {
      return;
    }
    const whenWasConfig = config.followups.whenWas;

    // Does the message match?
    if (!textMatches(message.text, whenWasConfig.matches)) {
      return;
    }

    // What was the last thing taryn posted about?
    const lastMessage = await Message.findLastMessage(message.chat.id);

    if (lastMessage === null) {
      return;
    }

    // Message is to long ago. Ignore it
    const isOld = moment(lastMessage.sentAt)
      .add(whenWasConfig.timeLimit, 'seconds')
      .isBefore(new Date());

    if (isOld) {
      return;
    }

    // Taryn doesn't like it when you ask twice
    if (this.#isPosting) {
      const msg = randItem(whenWasConfig.isPostingResponse);
      await bot.sendMessage(message.chat.id, msg);
      return;
    }

    // Find the message that taryn posted
    const messageObj = messages[message.chat.id][lastMessage.messageIdx];
    const messageDate = moment(messageObj.timestampMs);

    if (message.text.includes('exactly')) {
      await sleepRange(1000, 2000);
      const msg = `Uh, ${messageDate.format('MMMM Do YYYY, h:mma')}`;
      await bot.sendMessage(message.chat.id, msg);
      return;
    }

    // Taryn already posted it once
    if (lastMessage.whenWasMessageId !== null) {
      const msg = randItem(whenWasConfig.alreadyPostedResponse);
      await bot.sendMessage(message.chat.id, msg, {
        reply_to_message_id: lastMessage.whenWasMessageId,
      });
      return;
    }

    const responseSet = randItem(whenWasConfig.responses);

    const sentMessages: TelegramBot.Message[] = [];

    this.#isPosting = true;

    for (const response of responseSet) {
      const msg = response
        .replace(/\[date:([^\]]+)\]/, (_, dateFormat) => messageDate.format(dateFormat))
        .replace('[timeAgo]', () => messageDate.fromNow())
        .replace('[timeAgoWrong]', () => {
          // Randomly offset the hours
          const MIN_HOUR_OFFSET = 24 * 30;
          const hourDiff = messageDate.diff(new Date(), 'hours');
          const addHours = Math.floor(
            MIN_HOUR_OFFSET + Math.random() * (hourDiff - MIN_HOUR_OFFSET + 1)
          );

          return messageDate.add(addHours, 'hours').fromNow();
        });

      await sleepRange(3000, 6000);
      sentMessages.push(await bot.sendMessage(message.chat.id, msg));
    }

    lastMessage.whenWasMessageId = sentMessages[0].message_id;
    lastMessage.save();

    this.#isPosting = false;
  };
}

export default WhenWasFollowup;
