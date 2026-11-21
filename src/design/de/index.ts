import { German } from './types';
import { shared } from './shared';
import { sheets } from './sheets';
import { room } from './room';
import { home } from './home';
import { friends } from './friends';

// One file per area of the app; they are merged here. `friends` comes last because it has
// catch-all patterns such as "Add <name>" that must not win over more specific ones.
const parts: German[] = [shared, sheets, room, home, friends];

export const german: German = {
  exact: Object.assign({}, ...parts.map((part) => part.exact)),
  patterns: parts.flatMap((part) => part.patterns),
};
