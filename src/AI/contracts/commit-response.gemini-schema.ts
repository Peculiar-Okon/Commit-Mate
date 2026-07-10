import { Type } from '@google/genai';

export const CommitResponseGeminiSchema = {
  type: Type.OBJECT,

  properties: {
    title: {
      type: Type.STRING,
      description: 'A Conventional Commit title.',
    },

    description: {
      type: Type.ARRAY,

      description:
        'A list of concise bullet points describing the changes.',

      items: {
        type: Type.STRING,
      },
    },
  },

  required: [
    'title',
    'description',
  ],
};