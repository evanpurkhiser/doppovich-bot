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

    const contextConfig = config.followups.context;

    // Does the message match?
    if (!textMatches(message.text, contextConfig.matches)) {
      return;
    }

    // What was the last thing taryn posted about?
    const lastMessage = await Message.findLastMessage(message.chat.id);

    if (lastMessage === null) {
      return;
    }

    // Message is to long ago. Ignore it
    const isOld = moment(lastMessage.sentAt)
      .add(contextConfig.timeLimit, 'seconds')
      .isBefore(new Date());

    if (isOld) {
      return;
    }

    // Taryn doesn't like it when you ask twice
    if (this.#isPosting) {
      const msg = randItem(contextConfig.isPostingResponse);
      await bot.sendMessage(message.chat.id, msg);
      return;
    }

    if (lastMessage.contextMessageId !== null) {
      const msg = randItem(contextConfig.alreadyPostedResponse);
      await bot.sendMessage(message.chat.id, msg, {
        reply_to_message_id: lastMessage.contextMessageId,
      });
      return;
    }

    this.#isPosting = true;

    const messageContext = messages[message.chat.id]
      .slice(lastMessage.messageIdx - 1, lastMessage.messageIdx + 4)
      .reverse();

    await sleepRange(1000, 3000);
    await bot.sendMessage(message.chat.id, randItem(contextConfig.intros));

    const contextMessage = messageContext
      .map(
        ({senderName, timestampMs, text}) =>
          `*${senderName}* ${moment(timestampMs).format('h:mma')}\n` +
          escapeMarkdown(text)
      )
      .join('\n\n');

    await sleepRange(3000, 6000);
    const contextPost = await bot.sendMessage(message.chat.id, contextMessage, {
      parse_mode: 'MarkdownV2',
    });

    this.#isPosting = false;

    lastMessage.contextMessageId = contextPost.message_id;
    lastMessage.save();

    await sleepRange(2000, 5000);
    await bot.sendMessage(message.chat.id, randItem(contextConfig.outros));
  };
}

export default ContextFollowup;
