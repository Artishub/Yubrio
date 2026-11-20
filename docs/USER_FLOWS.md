# Core user flows

## Home

Launch → Home → own status (I’m free in one tap, or options) → free friends → rooms. Quiet state says “Pretty quiet right now. You could change that.” and offers to open a room.

## Open a room

Home → Open in the tab bar → activity → time + duration → In person / Online / Undecided → audience → options → Create → immediate room transition.

## Join a room

Home → room row → room detail → Yeb! or Yeb, but later → participant list → optional temporary chat. Yeb also works directly on the row. Joined state says “You’re in.”

## Availability

Home → I’m free (one tap: 3 hours, all friends) or options → when → audience → optional note → publish → status card with Change and End. Free friend → quick note → temporary conversation → open a room with that friend.

## Friends and circles

Friends → Add friend → QR/share/search → reciprocal acceptance. Friends → Circles → Create circle → select friends → save. Circle audiences can target rooms and availability.

## Navigation

Home, Open, Friends. Rooms and availability live on Home; room creation is entered from the centered Open tab action. Messaging remains contextual. You (profile, current availability, your rooms, appearance, settings, account) opens from the avatar on Home.

## Required states

Every core surface has loading skeletons, optimistic feedback where safe, recoverable errors, empty states, disabled/loading actions, and reduced-motion behavior.

## Demo reactions

Without Supabase, seeded friends react so the flows can be felt: a friend from the room's audience joins a room you open after a few seconds, and a free friend answers your first quick note. From a quick note, “Open a room with <name>” starts room creation with that friend preselected as the audience.
