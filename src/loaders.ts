import {promises as fs} from 'fs';
import glob from 'fast-glob';
import {FacebookMessage} from './types';

export async function loadFacebookMessages(fileList: string[]) {
  const files = await glob(fileList);

  const messageData = await Promise.all(files.map(n => fs.readFile(n, 'utf8')));
  const allMessages = messageData
    .map(data => JSON.parse(data).messages)
    .flat() as FacebookMessage[];

  return allMessages;
}
