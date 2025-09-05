import { useState, useEffect } from 'react';
import './App.css';
import SplashScreen from './components/SplashScreen';
import NameInput from './components/NameInput';
import QuestionScreen from './components/QuestionScreen';
import EmailCapture from './components/EmailCapture';
import PhotoCapture from './components/PhotoCapture';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import ThankYouScreen from './components/ThankYouScreen';
import ErrorBanner from './components/ErrorBanner';
import { QUESTIONS } from './data/questions';
import type { Answers, GenerationResult } from './types';
import { deriveArchetype } from './utils/archetype';
import { buildPromptFromAnswers } from './utils/prompt';
import { generateSticker } from './services/imageService';

const STEPS = {
  Splash: 0,
  NameInput: 1,
  Questions: 2,
  EmailCapture: 3,
  PhotoIntro: 4,
  Photo: 5,
  PromptPreview: 6,
  Generating: 7,
  Result: 8,
  ThankYou: 9,
} as const;

function App() {
  const LOGO_LIGHT = 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F361d511becfe4af99cffd14033941816?format=webp&width=800';
  const LOGO_DARK = 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F8a91974e9a9e4d5399b528034240d956?format=webp&width=800';

  const [step, setStep] = useState<number>(STEPS.Splash);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [answers, setAnswers] = useState<Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [generatedArchetype, setGeneratedArchetype] = useState<any | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];
  const total = QUESTIONS.length;

  const setThemeOnDocument = (theme: 'light' | 'dark') => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  };

  // Ensure default theme on mount
  useEffect(() => {
    setThemeOnDocument('light');
  }, []);

  const handleSelect = (optId: string, intensity?: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { choice: optId, intensity } }));

    // When on the 'innovation' question (screen #2) and user chooses 'disruptive', switch to dark theme
    if (currentQuestion.id === 'innovation' && optId === 'disruptive') {
      setThemeOnDocument('dark');
    } else if (currentQuestion.id === 'innovation') {
      setThemeOnDocument('light');
    }
  };

  const handleNext = () => {
    setError(null);
    if (!answers[currentQuestion.id]) return;
    if (questionIndex < total - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep(STEPS.EmailCapture);
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else {
      setStep(STEPS.NameInput);
    }
  };

  const handleCloseQuestions = () => {
    setStep(STEPS.Splash);
    setUserName('');
    setAnswers({});
    setQuestionIndex(0);
    setError(null);
    setThemeOnDocument('light');
  };

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setStep(STEPS.Photo);
  };


  // Prepare prompt using LLM (or fallback) and generate immediately (skip prompt preview)
  const preparePrompt = async (maybeSelfie?: string) => {
    setError(null);
    try {
      if (!navigator.onLine) throw new Error('No internet connection. Please connect to continue.');

      // Build a deterministic prompt from answers first so it always reflects user's choices
      const fallbackArche = deriveArchetype(answers);
      const variantToken = 'v' + Math.floor(Math.random() * 10000);
      const localPrompt = buildPromptFromAnswers(fallbackArche, answers, variantToken);
      setGeneratedArchetype(fallbackArche);

      // Then ask LLM to refine/creative prompt; if LLM returns, use it, otherwise keep localPrompt
      let finalPrompt = localPrompt;
      try {
        const llm = await import('./services/llmService');
        const out = await llm.generateArchetypeWithLLM(answers, variantToken);
        // if the LLM produced a different prompt use it, otherwise keep local
        if (out?.prompt && out.prompt.trim().length > 0 && out.prompt.trim() !== localPrompt.trim()) {
          finalPrompt = out.prompt;
          setGeneratedArchetype(out.archetype);
        }
      } catch (llmErr) {
        // keep local prompt
      }

      // Skip PromptPreview and start generation immediately
      setStep(STEPS.Generating);
      const promptToUse = finalPrompt;
      const arche = generatedArchetype ?? fallbackArche;
      const res = await generateSticker(arche, maybeSelfie, promptToUse);
      setResult(res);
      setStep(STEPS.Result);
    } catch (e: any) {
      setError(e?.message || 'Failed to prepare or generate sticker');
      setStep(STEPS.Splash);
    } finally {
    }
  };

  const goToThankYou = () => {
    setStep(STEPS.ThankYou);
  };

  const restart = () => {
    setStep(STEPS.Splash);
    setUserName('');
    setUserEmail('');
    setAnswers({});
    setQuestionIndex(0);
    setError(null);
    setResult(null);
    setThemeOnDocument('light');
  };

  return (
    <div className="app-root">
      <div className="theme-overlay" aria-hidden />

      <header className="app-header" aria-hidden>
        <img className="brand-logo-img logo-light persistent-logo" src={LOGO_LIGHT} alt="Making Sense logo light" />
        <img className="brand-logo-img logo-dark persistent-logo" src={LOGO_DARK} alt="Making Sense logo dark" />
      </header>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {step === STEPS.Splash && <SplashScreen onStart={() => setStep(STEPS.NameInput)} />}
      {step === STEPS.NameInput && <NameInput onContinue={(name) => { setUserName(name); setStep(STEPS.Questions); }} />}
      {step === STEPS.Questions && (
        <QuestionScreen
          question={currentQuestion}
          selected={answers[currentQuestion.id]}
          onSelect={handleSelect}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleCloseQuestions}
          step={questionIndex + 1}
          total={total}
        />
      )}
      {step === STEPS.EmailCapture && (
        <EmailCapture onSubmit={handleEmailSubmit} />
      )}
      {step === STEPS.Photo && (
        <PhotoCapture onConfirm={(dataUrl?: string) => preparePrompt(dataUrl)} onSkip={() => preparePrompt(undefined)} />
      )}


      {step === STEPS.Generating && <LoadingScreen />}
      {step === STEPS.Result && result && <ResultScreen result={result} userName={userName} userEmail={userEmail} onShare={goToThankYou} onPrint={goToThankYou} />}
      {step === STEPS.ThankYou && <ThankYouScreen onRestart={restart} />}
      <footer className="app-footer">Making Sense - 2025. All rights reserved.</footer>
    </div>
  );
}

export default App;
