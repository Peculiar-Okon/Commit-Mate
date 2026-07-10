import { Type } from '@google/genai';

export const CommitResponseGeminiSchema = {
  type: Type.OBJECT,

  properties: {
    title: {
      type: Type.STRING,
    },

    description: {
      type: Type.ARRAY,

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