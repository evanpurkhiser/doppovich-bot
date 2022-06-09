import {random} from 'lodash';

export function randItem<V>(data: V[]) {
  return data[random(0, data.length - 1)];
}
