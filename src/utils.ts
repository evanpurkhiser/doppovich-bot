import {random} from 'lodash';

/**
 * Picks a random item from an array
 */
export function randItem<V>(data: V[]) {
  return data[random(0, data.length - 1)];
}

/**
 * Any match item may be of the format `/regex/` in which case the regex will
 * be compiled and used to match the string
 *
 * Otherwise it will case-insensitively look for the exact string match.
 */
export function textMatches(text: string, matches: string[]) {
  return matches.some(match =>
    match.match(/^\/.*\/$/)
      ? new RegExp(match).test(text)
      : text.toLowerCase().includes(match.toLowerCase())
  );
}
