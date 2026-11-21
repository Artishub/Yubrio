import { German } from './types';

// Friends tab, friend links (add by link or QR), sign-in and the sign-in callback.
export const friends: German = {
  exact: {
    // Friends tab
    Friends: 'Freunde',
    Add: 'Hinzufügen',
    'Add friend': 'Freunde hinzufügen',
    'The good kind of close circle.': 'Klein, aber genau richtig.',
    Circles: 'Kreise',
    'No friends yet': 'Noch keine Freunde',
    'Create a new circle': 'Neuen Kreis erstellen',
    'New circle': 'Neuer Kreis',
    'Retry loading friend requests': 'Freundschaftsanfragen nochmal laden',
    'Couldn’t load friend requests. Tap to retry.':
      'Freundschaftsanfragen konnten nicht geladen werden. Tipp, um es nochmal zu versuchen.',
    'Friend requests': 'Freundschaftsanfragen',
    'All friends': 'Alle Freunde',
    'Online now': 'Gerade online',
    'Yubrio friend': 'Auf Yubrio',
    'Invite your friends': 'Lad deine Freunde ein',
    'Share your link and make the first spark.': 'Teil deinen Link und bring den Stein ins Rollen.',
    'Show my link': 'Meinen Link zeigen',
    'Request sent': 'Anfrage gesendet',
    'Wants to connect': 'Möchte sich vernetzen',

    // Add friend sheet
    'ADD FRIEND': 'FREUNDE HINZUFÜGEN',
    'Find your people.': 'Finde deine Leute.',
    'Preparing your link…': 'Dein Link wird vorbereitet…',
    'Just a second.': 'Einen Moment.',
    'Your link couldn’t load.': 'Dein Link konnte nicht geladen werden.',
    'Try again before sharing it.': 'Versuch es nochmal, bevor du ihn teilst.',
    'Your Yubrio friend QR code': 'Dein Yubrio-QR-Code für Freunde',
    'Your link only connects people who choose to add each other.':
      'Dein Link verbindet nur Leute, die sich gegenseitig hinzufügen wollen.',
    'Scan a friend’s QR': 'QR-Code scannen',
    'Share my friend link': 'Meinen Freundeslink teilen',

    // QR scanner
    'Scan their code.': 'Scann den Code.',
    'Close scanner': 'Scanner schließen',
    'Open Yubrio on your phone to scan a friend’s QR code.':
      'Öffne Yubrio auf deinem Handy, um den QR-Code deiner Freunde zu scannen.',
    'Checking camera access…': 'Kamerazugriff wird geprüft…',
    'Yubrio needs camera access to scan friend links.':
      'Yubrio braucht Zugriff auf die Kamera, um Freundeslinks zu scannen.',
    'Allow camera': 'Kamera erlauben',
    'That code isn’t a Yubrio friend link.': 'Das ist kein Yubrio-Freundeslink.',
    'Only Yubrio friend links can be scanned here.': 'Hier lassen sich nur Yubrio-Freundeslinks scannen.',

    // Create circle sheet
    'PRIVATE CIRCLE': 'PRIVATER KREIS',
    'Make a circle.': 'Erstell einen Kreis.',
    'Circle name': 'Name des Kreises',
    'Only you see how your circles are organized.': 'Nur du siehst, wie deine Kreise sortiert sind.',
    'Save circle': 'Kreis speichern',
    'Couldn’t save that circle. Try again.': 'Der Kreis konnte nicht gespeichert werden. Versuch es nochmal.',

    // Friend link screen
    'A FRIEND LINK': 'EIN FREUNDESLINK',
    'This link has gone quiet.': 'Dieser Link ist nicht mehr aktiv.',
    'That’s your link.': 'Das ist dein Link.',
    'Ask your friend to share a new one.': 'Lass dir einfach einen neuen schicken.',
    'Share it with a friend to connect on Yubrio.': 'Teil ihn mit Freunden, um euch auf Yubrio zu verbinden.',
    'Yubrio keeps plans between people who choose each other.':
      'Auf Yubrio bleiben Pläne unter Leuten, die sich gegenseitig ausgesucht haben.',
    'This is your own friend link': 'Das ist dein eigener Freundeslink',
    'Already in your people': 'Schon bei deinen Leuten',
    'Friend request sent': 'Freundschaftsanfrage gesendet',
    'Added to your people': 'Zu deinen Leuten hinzugefügt',
    'Connection already exists': 'Ihr seid schon verbunden',
    'Couldn’t check the profile right now. You can still try the link.':
      'Das Profil lässt sich gerade nicht prüfen. Du kannst den Link trotzdem ausprobieren.',
    'Couldn’t add this friend right now. Try again.': 'Hinzufügen hat gerade nicht geklappt. Versuch es nochmal.',
    'Go to Friends': 'Zu Freunde',
    'Sign in to add': 'Anmelden und hinzufügen',

    // Sign-in
    'Enter a valid email address.': 'Gib eine gültige E-Mail-Adresse ein.',
    'Couldn’t send the link. Try again in a moment.':
      'Der Link konnte nicht gesendet werden. Versuch es gleich nochmal.',
    'Check your inbox.': 'Schau in dein Postfach.',
    'Use a different email': 'Andere E-Mail-Adresse nutzen',
    'See your people more.': 'Sieh deine Leute öfter.',
    'Sign in to see who’s free and open something spontaneous.':
      'Melde dich an, sieh, wer Zeit hat, und starte spontan etwas.',
    EMAIL: 'E-MAIL',
    'Email address': 'E-Mail-Adresse',
    'you@example.com': 'du@beispiel.de',
    'Send sign-in link': 'Anmeldelink senden',
    'No password to remember. You can turn off emails anytime.':
      'Kein Passwort nötig. E-Mails kannst du jederzeit abstellen.',

    // Sign-in callback
    'Couldn’t finish signing in.': 'Die Anmeldung hat nicht geklappt.',
    'This sign-in link could not be completed. Request a new one.':
      'Dieser Anmeldelink hat nicht funktioniert. Fordere einen neuen an.',
    'Back to Yubrio': 'Zurück zu Yubrio',
  },
  patterns: [
    [/^1 friends on Yubrio$/, '1 Freund auf Yubrio'],
    [/^(\d+) friends on Yubrio$/, '$1 Freunde auf Yubrio'],
    [/^(\d+) friend$/, '$1 Freund'],
    [/^(\d+) friends$/, '$1 Freunde'],
    [/^Add people · (\d+) selected$/, 'Leute hinzufügen · $1 ausgewählt'],
    [/^SCAN TO ADD (.+)$/, 'SCANNEN, UM $1 HINZUZUFÜGEN'],
    [/^Add me on Yubrio: (.+)$/, 'Füg mich auf Yubrio hinzu: $1'],
    [/^Your sign-in link is on its way to (.+)\.$/, 'Dein Anmeldelink ist unterwegs an $1.'],
    [/^Meet (.+)\.$/, 'Das ist $1.'],
    // A person's name follows; keep these last so the more specific "Add …" patterns win.
    [/^Accept (.+)$/, '$1 annehmen'],
    [/^Block (.+)$/, '$1 blockieren'],
    [/^Add (.+)$/, '$1 hinzufügen'],
  ],
};
