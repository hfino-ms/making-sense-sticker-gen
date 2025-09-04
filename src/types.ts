export type QuestionOption = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  title: string;
  options: QuestionOption[];
};

export type Answers = Record<string, { choice: string; intensity?: number }>;

export type Archetype = {
  name: string;
  descriptor: string;
  valueLine: string;
  backgroundStyle: string;
  robotType: string;
  robotPose: string;
  colorPalette: string;
};

export type GenerationResult = {
  imageUrl: string; // data URL or remote URL
  archetype: Archetype;
  prompt: string;
  source?: 'openai' | 'fallback';
  providerError?: string | null;
};
