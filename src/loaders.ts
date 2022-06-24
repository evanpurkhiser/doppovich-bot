import {promises as fs} from 'fs';
import glob from 'fast-glob';
import {Config, FacebookMessage} from './types';

export async function loadFacebookMessages(config: Config) {
  const files = await glob(config.messageFiles.facebook);

  const messageData = await Promise.all(files.map(n => fs.readFile(n, 'utf8')));
  const allMessages = messageData
    .map(data => JSON.parse(data).messages)
    .flat() as FacebookMessage[];

  console.log('Facebook Messages loaded:', allMessages.length);

  const messagesWithContent = allMessages
    .filter(msg => msg.type === 'Generic')
    .filter(msg => msg.content !== undefined)
    .filter(msg => (msg.content?.length ?? 0) > config.minMessageLength);

  console.log('Messages with content:', messagesWithContent.length);

  return messagesWithContent;
}
