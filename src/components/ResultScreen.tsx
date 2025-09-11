import type { GenerationResult } from '../types';
import styles from './ResultScreen.module.css';
import Button from './ui/Button';
import { useState, useEffect } from 'react';
import { composeStickerFromSource } from '../utils/composeSticker';
import { composeStickerWithHtmlLabel } from '../utils/htmlToCanvas';
import type { FC } from 'react';

type Props = {
  result: GenerationResult;
  userName?: string;
  userEmail?: string;
  agent?: { key: string; name: string } | null;
  onShare: () => void;
  onPrint: () => void;
  onRestart?: () => void;
};

const ResultScreen: FC<Props> = ({ result, userName, agent, onShare, onPrint, onRestart }) => {
  const imageUrl = (result as any)?.imageUrl || '';
  // Determine agent info: prefer result.agent, fallback to prop 'agent'
  const resultAgent = (result as any)?.agent || agent || null;
  // Use the frame URL directly - no complex composition
  const stickerSource = (result as any)?.imageDataUrl || imageUrl;

  // displayedSrc will hold the final composed image dataURL when available
  const [displayedSrc, setDisplayedSrc] = useState<string | null>(stickerSource || null);
  const [servicesTriggered, setServicesTriggered] = useState(false);

  // Compose sticker for export (include frame overlay) — wrap the shared util
  const composeSticker = async (source?: string): Promise<string> => {
    const src = source || stickerSource;
    // If result.imageDataUrl exists it's likely already composed on the server; avoid re-drawing the frame
    const alreadyComposed = !!((result as any)?.imageDataUrl);
    const isRemoteSource = String(src || '').startsWith('http');
    // Avoid drawing the frame if the source is a remote URL (server may have already composed it)
    // or if the server already provided an imageDataUrl
    const drawFrame = !isRemoteSource && !(alreadyComposed && String(src || '').startsWith('data:'));

    try {
      // Try HTML approach first if we have an agent name and drawing frame is allowed
      if ((resultAgent?.name || resultAgent?.key) && drawFrame) {
        const frameUrl = 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000';
        return await composeStickerWithHtmlLabel(src, resultAgent.name || resultAgent.key, {
          stickerSize: 1024,
          frameUrl,
          drawFrame
        });
      } else {
        // Fallback to canvas approach
        return await composeStickerFromSource(src, undefined, 1024, { agentLabel: resultAgent?.name || resultAgent?.key || null, drawFrame });
      }
    } catch (e) {
      console.warn('HTML composition failed in ResultScreen, using canvas fallback', e);
      return await composeStickerFromSource(src, undefined, 1024, { agentLabel: resultAgent?.name || resultAgent?.key || null, drawFrame });
    }
  };

  // Try composing on mount so the final screen shows the composed sticker with frame
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!stickerSource) return;
      try {
        const composed = await composeSticker(stickerSource);
        if (mounted && composed) {
          setDisplayedSrc(composed);
        }
      } catch (e) {
        console.warn('ResultScreen: failed to compose sticker on mount', e);
        // leave displayedSrc as original
        if (mounted) setDisplayedSrc(stickerSource || null);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickerSource]);

  // Auto-trigger services when component mounts and sticker is ready
  useEffect(() => {
    if (!displayedSrc || !onShare) return;

    try {
      // Use a global window Set to avoid duplicate triggers across React StrictMode double mounts
      const key = displayedSrc;
      const anyWin = window as any;
      if (!anyWin.__submittedStickerUrls) anyWin.__submittedStickerUrls = new Set<string>();
      const submittedSet: Set<string> = anyWin.__submittedStickerUrls;

      if (submittedSet.has(key)) {
        // already submitted this sticker, skip
        setServicesTriggered(true);
        return;
      }

      // mark and call
      submittedSet.add(key);
      setServicesTriggered(true);
      onShare();
    } catch (e) {
      // fallback: call once via local state
      if (!servicesTriggered) {
        setServicesTriggered(true);
        onShare();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSrc, onShare]);

  const printSticker = async () => {
    const w = window.open('', '_blank');
    if (!w) {
      onPrint();
      return;
    }
    let outSrc = stickerSource;
    try {
      outSrc = await composeSticker();
    } catch (e) {
      outSrc = stickerSource;
    }

    w.document.write(`<html><head><title>${resultAgent?.name || 'Agent'} Sticker</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;">
      <img src="${outSrc}" style="max-width:90vw;max-height:90vh;object-fit:contain;"/>
      <script>window.onload=function(){setTimeout(function(){window.print();}, 300)}<\/script>
    </body></html>`);
    w.document.close();
    setTimeout(() => onPrint(), 1000);
  };

  const providerError = (result as any)?.providerError || null;

  // Extract personality data from the agent
  const getPersonalityData = () => {
    if (!resultAgent) return null;

    const map = {
      'deal': {
        title: 'The Deal Hunter',
        personality: 'Fast, decisive, and always scanning the market for the next big opportunity.',
        strengths: 'Rapid due diligence, spotting hidden gems, predicting market trends before they hit the mainstream.',
        bestFor: 'PE professionals who move quickly on opportunities and thrive in competitive deal environments.',
        agentWill: 'Feed you high-probability deal leads, flag undervalued targets, and surface early-stage market shifts.'
      },
      'risk': {
        title: 'The Risk Balancer',
        personality: 'Cautious yet opportunistic, ensuring calculated risks with downside protection.',
        strengths: 'Risk modeling, scenario planning, and creating win–win deal structures.',
        bestFor: 'Investors who weigh upside potential against volatility and prefer stable, sustainable growth.',
        agentWill: 'Run risk simulations, stress-test deals, and flag portfolio vulnerabilities before they become threats.'
      },
      'transform': {
        title: 'The Transformer',
        personality: 'Change-maker focused on operational excellence and rapid value creation in portfolio companies.',
        strengths: 'Identifying inefficiencies, driving process automation, and unlocking productivity.',
        bestFor: 'Operating partners and value creation teams aiming for quick performance uplifts.',
        agentWill: 'Audit operations, recommend AI-driven efficiencies, and track post-acquisition performance gains.'
      },
      'vision': {
        title: 'The Visionary',
        personality: 'Future-focused leader who bets on innovation and market disruption.',
        strengths: 'Spotting emerging trends, funding disruptive business models, and future-proofing investments.',
        bestFor: 'Investors who see tech adoption and product innovation as the main growth lever.',
        agentWill: 'Map out long-term market shifts, validate innovative strategies, and identify early adoption opportunities.'
      },
      'integrator': {
        title: 'The Integrator',
        personality: 'Connector of people, processes, and strategies across the portfolio.',
        strengths: 'Building strong management teams, fostering collaboration, and ensuring alignment with the fund\'s vision.',
        bestFor: 'Leaders who believe strong execution comes from strong relationships.',
        agentWill: 'Optimize team structures, improve communication flows, and align execution with investment theses.'
      }
    } as Record<string, any>;

    const rawName = String(resultAgent.name || resultAgent.key || '').toLowerCase();

    // Determine key by looking for keyword matches
    let key = 'integrator';
    if (rawName.includes('deal') || rawName.includes('hunter')) key = 'deal';
    else if (rawName.includes('risk')) key = 'risk';
    else if (rawName.includes('transform')) key = 'transform';
    else if (rawName.includes('vision')) key = 'vision';
    else if (rawName.includes('integrat')) key = 'integrator';

    return map[key] || map.integrator;
  };

  const personalityData = getPersonalityData();

  return (
    <div className={styles.resultContainer}>

      {/* Main Section */}
      <div className={styles.resultSection}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.resultTitle}>
              {userName ? `${userName}, you are` : 'You are'}<br />
              The {resultAgent?.name || 'Integrator'}!
            </h1>

            <div className={styles.resultDivider}>
              <div className={styles.dividerLine}></div>
              <svg width="5" height="4" viewBox="0 0 5 4" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.dividerDot}>
                <circle cx="2.5" cy="2" r="2" fill="url(#paint0_linear)"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="0.688744" y1="1.47298" x2="2.12203" y2="3.02577" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1EDD8E"/>
                    <stop offset="1" stopColor="#53C0D2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {personalityData && (
              <div className={styles.personalityDescription}>
                <span className={styles.bold}>Personality: </span>
                <span className={styles.regular}>{personalityData.personality} </span>
                <span className={styles.bold}>Strengths: </span>
                <span className={styles.regular}>{personalityData.strengths} </span>
                <span className={styles.bold}>Best For: </span>
                <span className={styles.regular}>{personalityData.bestFor} </span>
                <span className={styles.bold}>Your Agent Will: </span>
                <span className={styles.regular}>{personalityData.agentWill}</span>
              </div>
            )}
          </div>

          {/* Sticker Image */}
          <div className={styles.stickerContainer}>
            {displayedSrc ? (
              <img src={displayedSrc} alt="Sticker" className={styles.stickerImage} />
            ) : stickerSource ? (
              <img src={stickerSource} alt="Sticker" className={styles.stickerImage} />
            ) : (
              <div className={styles.stickerPlaceholder} />
            )}
          </div>

          {/* CTAs */}
          <div className={styles.ctaSection}>
            <Button variant="primary" onClick={printSticker} className={styles.printButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 17H17V22H7V17Z" fill="currentColor"/>
                <path d="M17 9H20C21.1046 9 22 9.89543 22 11V17H17V9Z" fill="currentColor"/>
                <path d="M7 9V17H2V11C2 9.89543 2.89543 9 4 9H7Z" fill="currentColor"/>
                <path d="M7 2H17V9H7V2Z" fill="currentColor"/>
              </svg>
              PRINT
            </Button>
          </div>
        </div>

        {/* Start Over Button */}
        <div className={styles.startOverSection}>
          <Button variant="text" onClick={onRestart || (() => window.location.reload())} className={styles.startOverButton}>
            START OVER
          </Button>
        </div>

        {providerError && (
          <div className={styles.resultProviderError}>Generation fallback used: {String(providerError)}</div>
        )}
      </div>
    </div>
  );
};

export default ResultScreen;
