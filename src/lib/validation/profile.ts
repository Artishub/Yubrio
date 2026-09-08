import { z } from 'zod';

export const profileNameSchema = z.string().trim().min(1, 'Enter your name.').max(60, 'Keep your name under 60 characters.');
