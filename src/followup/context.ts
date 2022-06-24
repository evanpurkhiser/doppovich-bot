import moment from 'moment';
import TelegramBot from 'node-telegram-bot-api';

import {Message} from 'src/entity/message';
import {AppCtx} from 'src/types';
import {escapeMarkdown, randItem, sleepRange, textMatches} from 'src/utils';

class ContextFollowup {
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

    const configConfig = config.followups.context;

    // Does the message match?
    if (!textMatches(message.text, configConfig.matches)) {
      return;
    }

    // What was the last thing taryn posted about?
    const lastMessage = await Message.findLastMessage();

    if (lastMessage === null) {
      return;
    }

    // Message is to long ago. Ignore it
    const isOld = moment(lastMessage.sentAt)
      .add(configConfig.timeLimit, 'seconds')
      .isBefore(new Date());

    if (isOld) {
      return;
    }

    // Taryn doesn't like it when you ask twice
    if (this.#isPosting) {
      const msg = randItem(configConfig.isPostingResponse);
      await bot.sendMessage(message.chat.id, msg);
      return;
    }

    const messageContext = messages.facebook.slice(
      lastMessage.messageIdx - 3,
      lastMessage.messageIdx + 2
    );

    await sleepRange(1000, 3000);
    await bot.sendMessage(message.chat.id, randItem(configConfig.intros));

    const contextMessage = messageContext
      .map(
        ({sender_name, timestamp_ms, content}) =>
          `*${sender_name}* ${moment(timestamp_ms).format('h:mma')}\n` +
          escapeMarkdown(content ?? '')
      )
      .join('\n\n');

    await sleepRange(3000, 6000);
    await bot.sendMessage(message.chat.id, contextMessage, {parse_mode: 'MarkdownV2'});

    await sleepRange(2000, 5000);
    await bot.sendMessage(message.chat.id, randItem(configConfig.outros));
  };
}

export default ContextFollowup;
