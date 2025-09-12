import { useState, useEffect, useRef } from 'react';
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
import MotionSection from './components/MotionSection';
import { preparePromptAndAgent, generateAndCompose, submitComposed } from './services/workflowClient';

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

  const [agentResult, setAgentResult] = useState<{ key: string; name: string } | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [, setGenerating] = useState<boolean>(false);

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
    // Delegate generation preparation to workflow service and immediately start generation
    try {
      const { agent, prompt } = await preparePromptAndAgent(answers, Boolean(capturedPhoto));
      setAgentResult(agent);
      setPromptText(prompt);
      // Immediately trigger generation without manual preview step
      await generateFromState(agent, prompt);
    } catch (e: any) {
      console.error('Failed to prepare prompt and agent', e);
      setError(String(e?.message || e));
      setStep(STEPS.Splash);
    }
  };

  const submittedStickersRef = useRef<Set<string>>(new Set());

  const submitUserData = async () => {
    const surveyObj: Record<string, string> = {};
    try {
      QUESTIONS.forEach((q, idx) => {
        const slot = idx + 1;
        surveyObj[`question_${slot}`] = q.title.split('\n')[0] || q.title;
        const ans = (answers || {})[q.id];
        if (!ans) { surveyObj[`answer_${slot}`] = ''; return; }
        if (typeof ans === 'object') {
          const choiceId = ans.choice;
          const opt = q.options?.find((o: any) => o.id === choiceId);
          surveyObj[`answer_${slot}`] = (opt && opt.label) ? opt.label : String(choiceId);
        } else {
          surveyObj[`answer_${slot}`] = String(ans);
        }
      });
    } catch (e) { console.warn('Failed to build survey payload on client', e); }

    const stickerDataUrl = (result as any)?.imageDataUrl || (result as any)?.imageUrl || null;
    if (!stickerDataUrl) {
      setError('No sticker image available to submit');
      setStep(STEPS.Result);
      return;
    }

    // Prevent duplicate submissions for the same sticker data URL
    if (submittedStickersRef.current.has(stickerDataUrl)) {
      console.log('Skipping duplicate submission for', stickerDataUrl);
      return;
    }

    // Mark as submitted immediately to prevent race conditions from multiple clicks.
    submittedStickersRef.current.add(stickerDataUrl);

    try {
      const resp = await submitComposed({
        email: userEmail || '',
        name: userName || '',
        timestamp: new Date().toISOString(),
        agent: agentResult || (result as any)?.agent || null,
        survey: surveyObj,
        photo: capturedPhoto || '',
        composedDataUrl: stickerDataUrl
      });

      if (!resp || !resp.ok) {
        throw new Error(`Submission failed: ${JSON.stringify(resp)}`);
      }

      const imageUrl = resp.imageUrl || resp?.image || resp?.url || null;
      if (!imageUrl) {
        throw new Error('Upload succeeded but no imageUrl returned');
      }

      // At this point, upload is successful. Now, notify n8n.
      try {
        const { sendToN8nFromClient } = await import('./services/submitClient');
        const webhookPayload = {
          email: userEmail || '',
          name: userName || '',
          timestamp: new Date().toISOString(),
          sticker: imageUrl,
          archetype: (agentResult as any)?.name || (agentResult as any)?.key || null,
          survey: surveyObj
        };
        const hookResp = await sendToN8nFromClient(webhookPayload);
        console.log('n8n webhook response', hookResp);

      } catch (hookErr) {
        console.warn('Failed to send n8n webhook from client', hookErr);
        setError('Failed to notify via webhook, but your sticker was saved.');
      }

      console.log('Submission successful', resp);

    } catch (e) {
      // If any part of the main submission fails, allow user to try again.
      submittedStickersRef.current.delete(stickerDataUrl);

      console.error('Error submitting user data:', e);
      setError(String((e as any)?.message || e));
      setStep(STEPS.Result);
    }
  };


  // Store photo data and proceed to email capture
  const preparePrompt = async (maybeSelfie?: string) => {
    setCapturedPhoto(maybeSelfie);
    setStep(STEPS.EmailCapture);
  };

  // Helper to trigger generation based on current state / provided agent+prompt
  const generateFromState = async (providedAgent?: any, providedPrompt?: string) => {
    setGenerating(true);
    try {
      // Build survey payload
      const surveyPayload: Record<string,string> = (() => {
        const surveyObj: Record<string,string> = {};
        try {
          QUESTIONS.forEach((q, idx) => {
            const slot = idx + 1;
            surveyObj[`question_${slot}`] = q.title.split('\n')[0] || q.title;
            const ans = (answers || {})[q.id];
            if (!ans) { surveyObj[`answer_${slot}`] = ''; return; }
            if (typeof ans === 'object') {
              const choiceId = ans.choice;
              const opt = q.options?.find((o: any) => o.id === choiceId);
              surveyObj[`answer_${slot}`] = (opt && opt.label) ? opt.label : String(choiceId);
            } else {
              surveyObj[`answer_${slot}`] = String(ans);
            }
          });
        } catch (e) { console.warn('Failed to build survey payload', e); }
        return surveyObj;
      })();

      setStep(STEPS.Generating);
      const out = await generateAndCompose(providedAgent || agentResult || null, surveyPayload, capturedPhoto);

      if (!out || (!out.gen)) {
        setError('No generation data returned from server');
        setStep(STEPS.Result);
        return;
      }

      if (out.composedDataUrl) {
        setResult({ imageDataUrl: out.composedDataUrl, agent: providedAgent || agentResult as any, prompt: providedPrompt || promptText, source: 'openai' });
        setStep(STEPS.Result);
      } else if (out.source) {
        if (out.source.startsWith('data:')) {
          setResult({ imageDataUrl: out.source, agent: providedAgent || agentResult as any, prompt: providedPrompt || promptText, source: 'openai' });
        } else {
          setResult({ imageUrl: out.source, agent: providedAgent || agentResult as any, prompt: providedPrompt || promptText, source: 'openai' });
        }
        setStep(STEPS.Result);
      } else {
        setError('OpenAI returned no image data');
        setStep(STEPS.Result);
      }
    } catch (e: any) {
      console.error('Failed to call generation service', e);
      setError(String(e?.message || e));
      setStep(STEPS.Result);
    } finally {
      setGenerating(false);
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

      <MotionSection animateKey={step} duration={360}>
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
        {step === STEPS.Result && result && <ResultScreen result={result} userName={userName} userEmail={userEmail} agent={agentResult} onShare={submitAndStay} onPrint={submitAndStay} onRestart={restart} />}
      </MotionSection>
    </Layout>
  );
}

export default App;
