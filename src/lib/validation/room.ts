import { z } from 'zod';
import { isWithinMaxDuration } from '@/lib/validation/rules';

export const roomDraftSchema = z.object({
  activity: z.string().min(1),
  title: z.string().trim().max(80).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  audience: z.enum(['friends', 'circle', 'people']),
  locationMode: z.enum(['in_person', 'online', 'undecided']),
}).superRefine((draft, ctx) => {
  const duration = draft.endsAt.getTime() - draft.startsAt.getTime();
  if (duration <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endsAt'], message: 'A room must end after it starts.' });
  if (duration > 0 && !isWithinMaxDuration(draft.startsAt, draft.endsAt)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endsAt'], message: 'Rooms can last up to 24 hours.' });
});
