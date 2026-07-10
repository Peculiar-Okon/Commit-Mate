export const CommitResponseJsonSchema = {
  type: 'object',

  properties: {
    title: {
      type: 'string',
    },

    description: {
      type: 'array',

      items: {
        type: 'string',
      },
    },
  },

  required: [
    'title',
    'description',
  ],
} as const;