import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import NameInput from './components/NameInput';
import QuestionScreen from './components/QuestionScreen';
import EmailCapture from './components/EmailCapture';
import PhotoCapture from './components/PhotoCapture';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import ErrorBanner from './components/ErrorBanner';
import { QUESTIONS } from './data/questions';
import type { Answers, GenerationResult } from './types';
import { deriveArchetype } from './utils/archetype';
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
  const [step, setStep] = useState<number>(STEPS.Splash);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [answers, setAnswers] = useState<Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(undefined);

  const [generatedArchetype, setGeneratedArchetype] = useState<any | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];
  const total = QUESTIONS.length;

  const setThemeOnDocument = (theme: 'light' | 'dark') => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  };

  // Set default theme
  useEffect(() => {
    setThemeOnDocument('light');

    // ONE-TIME fullscreen attempt triggered by first user interaction (gesture required by browsers)
    let attemptedFull = false;
    const tryFullscreen = async () => {
      if (attemptedFull) return;
      attemptedFull = true;
      try {
        const el = document.documentElement as any;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
        // when fullscreen entered, the browser chrome will be hidden on supported devices
      } catch (e) {
        // ignore errors — many browsers will refuse or require user gesture
      }
      // remove listener after attempt
      window.removeEventListener('pointerdown', tryFullscreen);
    };
    window.addEventListener('pointerdown', tryFullscreen, { once: true });

    return () => {
      try { window.removeEventListener('pointerdown', tryFullscreen); } catch (e) {}
    };
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
      // After completing questions, go to Photo capture step (selfie first)
      setStep(STEPS.Photo);
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

  const handleEmailSubmit = async (email: string) => {
    setUserEmail(email);
    // Now start generation process after email is captured
    await generateStickerAfterEmail();
  };

  const handleEmailSkip = async () => {
    setUserEmail(''); // Clear email if skipped
    // Start generation process even without email
    await generateStickerAfterEmail();
  };

  const submitUserData = async () => {
    try {
      // Build survey payload compatible with n8n (question_1..answer_5)
      const surveyObj: Record<string, string> = {};
      try {
        QUESTIONS.forEach((q, idx) => {
          const slot = idx + 1;
          surveyObj[`question_${slot}`] = q.title.split('\n')[0] || q.title;
          const ans = (answers || {})[q.id];
          if (!ans) {
            surveyObj[`answer_${slot}`] = '';
            return;
          }
          if (typeof ans === 'object') {
            const choiceId = ans.choice;
            const opt = q.options?.find((o: any) => o.id === choiceId);
            surveyObj[`answer_${slot}`] = (opt && opt.label) ? opt.label : String(choiceId);
          } else {
            surveyObj[`answer_${slot}`] = String(ans);
          }
        });
      } catch (e) {
        console.warn('Failed to build survey payload on client', e);
      }

      const payload = {
        email: userEmail || '',
        name: userName || '',
        timestamp: new Date().toISOString(),
        sticker: (result as any)?.imageUrl || (result as any)?.imageDataUrl || null,
        archetype: generatedArchetype?.name || (result as any)?.archetype?.name || generatedArchetype || (result as any)?.archetype || null,
        survey: surveyObj
      };

      // Use VITE_N8N_WEBHOOK_URL if provided, otherwise default to the test webhook
      let raw = (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || 'https://nano-ms.app.n8n.cloud/webhook-test/sticker-app';
      raw = String(raw).trim().replace(/^(https?:\/\/)+/i, '$1');
      const endpoint = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
    } catch (error) {
      console.error('Error submitting user data (direct n8n):', error);
      // Don't block the user experience if submission fails
    }
  };


  // Store photo data and proceed to email capture
  const preparePrompt = async (maybeSelfie?: string) => {
    setCapturedPhoto(maybeSelfie);
    setStep(STEPS.EmailCapture);
  };

  // Generate sticker after email is captured
  const generateStickerAfterEmail = async () => {
    setError(null);
    try {
      if (!navigator.onLine) throw new Error('No internet connection. Please connect to continue.');

      // Build a deterministic prompt from answers first so it always reflects user's choices
      const fallbackArche = deriveArchetype(answers);
      setGeneratedArchetype(fallbackArche);


      // Build the required fixed prompt using collected answers and chosen archetype
      const findAnswerLabel = (qid: string) => {
        try {
          const q = QUESTIONS.find((qq) => qq.id === qid);
          const ans = answers[qid];
          if (!q || !ans) return 'N/A';
          const opt = q.options?.find((o: any) => o.id === ans.choice);
          if (opt && opt.label) return opt.label;
          // If no option found, fall back to any numeric/intensity value or choice id
          return ans?.choice ?? (ans?.intensity != null ? String(ans.intensity) : 'N/A');
        } catch (e) {
          return 'N/A';
        }
      };

      const promptTemplate = `Create an original, unique sticker that embodies the archetype "${fallbackArche?.name}". Avoid using\n- archetype label\n- any text into the image\n- white borders.\n- transparent background\nOutput a high-resolution PNG (at least 1024x1024) suitable for display and printing. StyleToken:v2338;Draw inspiration from the following traits: Which best describes your approach to making business decisions?: ${findAnswerLabel('decision_style')}; Which mindset do you most identify with when new technologies emerge?: ${findAnswerLabel('innovation')}; With new opportunities, how would you describe your risk tolerance?: ${findAnswerLabel('risk')}; When working on a team project, which approach best describes your style?: ${findAnswerLabel('collaboration')}; When defining your vision for the future, which area is your primary focus?: ${findAnswerLabel('vision')}. Produce a high-quality, visually engaging sticker concept — be creative with composition; use colors drawn from the chosen archetype's colorPalette (do not force a specific hue set). The design should feature a character in the middle with small illustrations in the background. The background should fill the complete image and may be a single color or a subtle gradient that complements the palette. The style should be clean, simple, flat, with no text on it.`;

      setStep(STEPS.Generating);
      const promptToUse = promptTemplate;
      const arche = generatedArchetype ?? fallbackArche;
      const photoStep = capturedPhoto ? 'sent' : 'skipped';
      const res = await generateSticker(arche, capturedPhoto, promptToUse, photoStep);
      setResult(res);
      setStep(STEPS.Result);
    } catch (e: any) {
      setError(e?.message || 'Failed to prepare or generate sticker');
      setStep(STEPS.Splash);
    }
  };

  const submitAndStay = async () => {
    await submitUserData();
    // remain on the current screen after submitting
  };

  const restart = () => {
    setStep(STEPS.Splash);
    setUserName('');
    setUserEmail('');
    setAnswers({});
    setQuestionIndex(0);
    setError(null);
    setResult(null);
    setCapturedPhoto(undefined);
    setThemeOnDocument('light');
  };

  // Determine if we should show progress stepper
  const showProgress = step === STEPS.Questions;
  const currentStepForProgress = step === STEPS.Questions ? questionIndex + 1 : 1;

  return (
    <Layout
      showProgress={showProgress}
      currentStep={currentStepForProgress}
      totalSteps={total}
      onClose={handleCloseQuestions}
    >
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
        <EmailCapture onSubmit={handleEmailSubmit} onSkip={handleEmailSkip} />
      )}
      {step === STEPS.Photo && (
        <PhotoCapture onConfirm={(dataUrl?: string) => preparePrompt(dataUrl)} onSkip={() => preparePrompt(undefined)} />
      )}

      {step === STEPS.Generating && <LoadingScreen />}
      {step === STEPS.Result && result && <ResultScreen result={result} userName={userName} userEmail={userEmail} onShare={submitAndStay} onPrint={submitAndStay} onRestart={restart} />}
    </Layout>
  );
}

export default App;
