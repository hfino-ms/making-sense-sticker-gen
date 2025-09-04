import { useState } from 'react';
import './App.css';
import SplashScreen from './components/SplashScreen';
import QuestionScreen from './components/QuestionScreen';
import PhotoCapture from './components/PhotoCapture';
import PromptPreview from './components/PromptPreview';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import ErrorBanner from './components/ErrorBanner';
import { QUESTIONS } from './data/questions';
import type { Answers, GenerationResult } from './types';
import { deriveArchetype } from './utils/archetype';
import { buildPromptFromAnswers } from './utils/prompt';
import { generateSticker } from './services/imageService';

const STEPS = {
  Splash: 0,
  Questions: 1,
  Photo: 2,
  PromptPreview: 3,
  Generating: 4,
  Result: 5,
} as const;

function App() {
  const [step, setStep] = useState<number>(STEPS.Splash);
  const [answers, setAnswers] = useState<Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [pendingSelfie, setPendingSelfie] = useState<string | undefined>(undefined);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | undefined>(undefined);
  const [generatedArchetype, setGeneratedArchetype] = useState<any | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);

  const currentQuestion = QUESTIONS[questionIndex];
  const total = QUESTIONS.length;

  const handleSelect = (optId: string, intensity?: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { choice: optId, intensity } }));
  };

  const handleNext = () => {
    setError(null);
    if (!answers[currentQuestion.id]) return;
    if (questionIndex < total - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep(STEPS.Photo);
    }
  };

  // Prepare prompt using LLM (or fallback) and go to PromptPreview
  const preparePrompt = async (maybeSelfie?: string) => {
    setPendingSelfie(maybeSelfie);
    setPromptLoading(true);
    setError(null);
    try {
      if (!navigator.onLine) throw new Error('No internet connection. Please connect to continue.');

      // Build a deterministic prompt from answers first so it always reflects user's choices
      const fallbackArche = deriveArchetype(answers);
      const variantToken = 'v' + Math.floor(Math.random() * 10000);
      const localPrompt = buildPromptFromAnswers(fallbackArche, answers, variantToken);
      setGeneratedArchetype(fallbackArche);
      setGeneratedPrompt(localPrompt);

      // Then ask LLM to refine/creative prompt; if LLM returns, use it, otherwise keep localPrompt
      try {
        const llm = await import('./services/llmService');
        const out = await llm.generateArchetypeWithLLM(answers, variantToken);
        // if the LLM produced a different prompt use it, otherwise keep local
        if (out?.prompt && out.prompt.trim().length > 0 && out.prompt.trim() !== localPrompt.trim()) {
          setGeneratedArchetype(out.archetype);
          setGeneratedPrompt(out.prompt);
        }
      } catch (llmErr) {
        // keep local prompt
      }

      setStep(STEPS.PromptPreview);
    } catch (e: any) {
      setError(e?.message || 'Failed to prepare prompt');
    } finally {
      setPromptLoading(false);
    }
  };

  const startGeneration = async () => {
    setStep(STEPS.Generating);
    setError(null);
    try {
      if (!navigator.onLine) throw new Error('No internet connection. Please connect to continue.');
      const promptToUse = generatedPrompt;
      const arche = generatedArchetype ?? deriveArchetype(answers);
      const res = await generateSticker(arche, pendingSelfie, promptToUse);
      setResult(res);
      setStep(STEPS.Result);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
      setStep(STEPS.PromptPreview);
    }
  };

  const restart = () => {
    setStep(STEPS.Splash);
    setAnswers({});
    setQuestionIndex(0);
    setError(null);
    setResult(null);
  };

  return (
    <div className="app-root">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {step === STEPS.Splash && <SplashScreen onStart={() => setStep(STEPS.Questions)} />}
      {step === STEPS.Questions && (
        <QuestionScreen
          question={currentQuestion}
          selected={answers[currentQuestion.id]}
          onSelect={handleSelect}
          onNext={handleNext}
          step={questionIndex + 1}
          total={total}
        />
      )}
      {step === STEPS.Photo && (
        <PhotoCapture onConfirm={(dataUrl?: string) => preparePrompt(dataUrl)} onSkip={() => preparePrompt(undefined)} />
      )}

      {step === STEPS.PromptPreview && generatedPrompt && generatedArchetype && (
        <PromptPreview
          archetype={generatedArchetype}
          prompt={generatedPrompt}
          onChange={(p) => setGeneratedPrompt(p)}
          onGenerate={startGeneration}
          onRegenerate={async () => {
            setPromptLoading(true);
            try {
              const llm = await import('./services/llmService');
              const variant = 'v' + Math.floor(Math.random() * 10000);
              const out = await llm.generateArchetypeWithLLM(answers, variant);
              setGeneratedArchetype(out.archetype);
              setGeneratedPrompt(out.prompt);
            } catch (e: any) {
              setError('Regenerate failed');
            } finally {
              setPromptLoading(false);
            }
          }}
          loading={promptLoading}
        />
      )}

      {step === STEPS.Generating && <LoadingScreen />}
      {step === STEPS.Result && result && <ResultScreen result={result} onRestart={restart} />}
    </div>
  );
}

export default App;
