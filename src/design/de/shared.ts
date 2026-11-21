import { German } from './types';

// Words and phrases used in more than one place: times, durations, activities, common buttons.
export const shared: German = {
  exact: {
    Today: 'Heute',
    Tomorrow: 'Morgen',
    'until tonight': 'bis heute Abend',
    Coffee: 'Kaffee',
    Drinks: 'Drinks',
    Food: 'Essen',
    Gaming: 'Gaming',
    Walk: 'Spaziergang',
    Gym: 'Gym',
    'Hang out': 'Abhängen',
    Custom: 'Eigenes',
    Free: 'Frei',
    Online: 'Online',
    Undecided: 'Noch offen',
    Close: 'Schließen',
    Back: 'Zurück',
    'Go back': 'Zurück',
    'Try again': 'Nochmal versuchen',
    'I’m in!': 'Dabei!',
  },
  patterns: [
    [/^(\d+)h left$/, 'noch $1 Std.'],
    [/^(\d+)m left$/, 'noch $1 Min.'],
    [/^Today · (.+)$/, 'Heute · $1'],
    [/^Tomorrow · (.+)$/, 'Morgen · $1'],
    [/^Today (\S+)–Tomorrow (\S+)$/, 'Heute $1–Morgen $2'],
  ],
};
