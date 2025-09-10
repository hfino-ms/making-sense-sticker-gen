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
import { composeStickerFromSource } from './utils/composeSticker';
import { buildPromptFromAnswers } from './utils/prompt';

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

  const submitUserData = async () => {
    try {
      // Build survey payload
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

      // Compose sticker (with frame)
      let stickerDataUrl = (result as any)?.imageDataUrl || (result as any)?.imageUrl || null;
      try {
        const composed = await composeStickerFromSource((result as any)?.imageDataUrl || (result as any)?.imageUrl || null);
        if (composed) stickerDataUrl = composed;
      } catch (e) {
        console.warn('Failed to compose sticker on client before submit', e);
      }

      // Ensure sticker is a public URL. If we have a data URL, upload it to server which returns a public URL.
      let stickerUrl = stickerDataUrl;
      try {
        if (stickerDataUrl && String(stickerDataUrl).startsWith('data:')) {
          const uploadResp = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl: stickerDataUrl })
          });
          if (uploadResp.ok) {
            const ujson = await uploadResp.json().catch(() => null);
            if (ujson && ujson.url) stickerUrl = ujson.url;
            else {
              console.warn('Upload endpoint returned no url', ujson);
            }
          } else {
            const txt = await uploadResp.text().catch(() => '');
            console.warn('Upload endpoint failed', uploadResp.status, txt);
            // surface server error to UI
            setError(`Upload failed: ${uploadResp.status} ${txt}`);
            setStep(STEPS.Result);
            return;
          }

          // If after upload attempt stickerUrl is still a data URL, abort and inform user
          if (stickerUrl && String(stickerUrl).startsWith('data:')) {
            console.error('Sticker upload did not return a public URL. Aborting payload send.');
            setError('No se pudo subir la imagen al servidor. Intenta nuevamente.');
            setStep(STEPS.Result);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to upload composed sticker before payload', e);
        setError(`Upload failed: ${String((e as any)?.message || e)}`);
        setStep(STEPS.Result);
      }

      const payload = {
        email: userEmail || '',
        name: userName || '',
        timestamp: new Date().toISOString(),
        sticker: stickerUrl,
        archetype: generatedArchetype?.name || (result as any)?.archetype?.name || generatedArchetype || (result as any)?.archetype || null,
        survey: surveyObj
      };

      console.log('Submitting payload to /api/submit-user-data:', payload);
      const resp = await fetch('/api/submit-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        console.error('Server responded with error when submitting payload:', resp.status, txt);
      } else {
        const json = await resp.json().catch(() => null);
        console.log('Server submit response:', json);
      }
    } catch (error) {
      console.error('Error submitting user data to server:', error);
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

      // Build a deterministic archetype from answers and generate a concise prompt using the dedicated util
      const fallbackArche = deriveArchetype(answers);
      setGeneratedArchetype(fallbackArche);

      const arche = generatedArchetype ?? fallbackArche;
      const promptToUse = buildPromptFromAnswers(arche, answers);

      setStep(STEPS.Generating);
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
        <EmailCapture onSubmit={handleEmailSubmit} />
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
