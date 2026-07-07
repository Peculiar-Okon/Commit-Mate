import { z } from 'zod';

export const CommitResponseSchema = z.object({
  title: z.string().min(1),

  description: z.array(
    z.string().min(1),
  ),
});

export type CommitResponse = z.infer<
  typeof CommitResponseSchema
>;