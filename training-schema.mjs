const string = { type: "string" },
  number = { type: "number" },
  strings = { type: "array", items: string };
const object = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
export const trainingSchema = object({
  title: string,
  style: string,
  durationMinutes: number,
  objectives: strings,
  sources: {
    type: "array",
    items: object({
      title: string,
      url: string,
      accessedAt: string,
      supports: strings,
    }),
  },
  glossary: {
    type: "array",
    items: object({ term: string, definition: string, example: string }),
  },
  quiz: {
    type: "array",
    items: object({
      question: string,
      options: strings,
      correctIndex: { type: "integer" },
      explanation: string,
    }),
  },
  slides: {
    type: "array",
    items: object({
      title: string,
      layout: {
        type: "string",
        enum: [
          "cover",
          "cards",
          "process",
          "statement",
          "exercise",
          "comparison",
        ],
      },
      points: strings,
      notes: string,
      voiceScript: string,
      participantNotes: string,
      activityMinutes: number,
      icon: {
        type: "string",
        enum: [
          "ai",
          "target",
          "group",
          "chart",
          "shield",
          "document",
          "clock",
          "microphone",
          "lamp",
          "check-circle",
          "search",
          "apis",
        ],
      },
    }),
  },
});
