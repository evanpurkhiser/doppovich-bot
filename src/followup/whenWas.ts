import moment from 'moment';
import TelegramBot from 'node-telegram-bot-api';

import {Message} from 'src/entity/message';
import {AppCtx} from 'src/types';
import {randItem, textMatches} from 'src/utils';

class WhenWasFollowup {
  #ctx: AppCtx;

  constructor(ctx: AppCtx) {
    this.#ctx = ctx;
  }

  handleMessage = async (message: TelegramBot.Message) => {
    if (message.text === undefined) {
      return;
    }
    const conf = this.#ctx.config.followups.whenWas;

    // Does the message match?
    if (!textMatches(message.text, conf.matches)) {
      return;
    }

    // What was the last thing taryn posted about?
    const lastMessage = await Message.findLastMessage();

    if (lastMessage === null) {
      return;
    }

    // Message is to long ago. Ignore it
    const isOld = moment(lastMessage.sentAt)
      .add(conf.timeLimit, 'seconds')
      .isBefore(new Date());

    if (isOld) {
      return;
    }

    const responseSet = randItem(conf.responses);

    // Find the message that taryn posted
    const fbMessage = this.#ctx.messages.facebook[lastMessage.messageIdx];
    const messageDate = moment(fbMessage.timestamp_ms);

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

      await new Promise(r => setTimeout(r, 5000));
      await this.#ctx.bot.sendMessage(message.chat.id, msg);
    }
  };
}

export default WhenWasFollowup;
