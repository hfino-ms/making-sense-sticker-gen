import type { GenerationResult } from "../types";
import styles from "./ResultScreen.module.css";
import Button from "./ui/Button";
import { useState, useEffect, useRef, useCallback } from "react";
import { composeStickerFromSource } from "../utils/composeSticker";
import { composeStickerWithHtmlLabel } from "../utils/htmlToCanvas";
import PrintPreview from "./PrintPreview";
import type { FC } from "react";

type Agent = { key: string; name: string } | null;

const PERSONALITY_MAP = {
  deal: {
    title: "The Deal Hunter",
    personality:
      "Fast, decisive, and always scanning the market for the next big opportunity.",
    strengths:
      "Rapid due diligence, spotting hidden gems, predicting market trends before they hit the mainstream.",
    bestFor:
      "PE professionals who move quickly on opportunities and thrive in competitive deal environments.",
    agentWill:
      "Feed you high-probability deal leads, flag undervalued targets, and surface early-stage market shifts.",
  },
  risk: {
    title: "The Risk Balancer",
    personality:
      "Cautious yet opportunistic, ensuring calculated risks with downside protection.",
    strengths:
      "Risk modeling, scenario planning, and creating win–win deal structures.",
    bestFor:
      "Investors who weigh upside potential against volatility and prefer stable, sustainable growth.",
    agentWill:
      "Run risk simulations, stress-test deals, and flag portfolio vulnerabilities before they become threats.",
  },
  transform: {
    title: "The Transformer",
    personality:
      "Change-maker focused on operational excellence and rapid value creation in portfolio companies.",
    strengths:
      "Identifying inefficiencies, driving process automation, and unlocking productivity.",
    bestFor:
      "Operating partners and value creation teams aiming for quick performance uplifts.",
    agentWill:
      "Audit operations, recommend AI-driven efficiencies, and track post-acquisition performance gains.",
  },
  vision: {
    title: "The Visionary",
    personality:
      "Future-focused leader who bets on innovation and market disruption.",
    strengths:
      "Spotting emerging trends, funding disruptive business models, and future-proofing investments.",
    bestFor:
      "Investors who see tech adoption and product innovation as the main growth lever.",
    agentWill:
      "Map out long-term market shifts, validate innovative strategies, and identify early adoption opportunities.",
  },
  integrator: {
    title: "The Integrator",
    personality:
      "Connector of people, processes, and strategies across the portfolio.",
    strengths:
      "Building strong management teams, fostering collaboration, and ensuring alignment with the fund's vision.",
    bestFor:
      "Leaders who believe strong execution comes from strong relationships.",
    agentWill:
      "Optimize team structures, improve communication flows, and align execution with investment theses.",
  },
};

const getPersonalityData = (agent: Agent) => {
  if (!agent) return PERSONALITY_MAP.integrator;

  const rawName = String(agent.name || agent.key || "").toLowerCase();
  if (rawName.includes("deal") || rawName.includes("hunter"))
    return PERSONALITY_MAP.deal;
  if (rawName.includes("risk")) return PERSONALITY_MAP.risk;
  if (rawName.includes("transform")) return PERSONALITY_MAP.transform;
  if (rawName.includes("vision")) return PERSONALITY_MAP.vision;
  if (rawName.includes("integrat")) return PERSONALITY_MAP.integrator;

  return PERSONALITY_MAP.integrator;
};

const composeSticker = async (
  stickerSource: string,
  result: GenerationResult,
  agent: Agent
): Promise<string> => {
  const alreadyComposed = !!(result as any)?.imageDataUrl;
  const isRemoteSource = stickerSource.startsWith("http");
  const drawFrame =
    !isRemoteSource && !(alreadyComposed && stickerSource.startsWith("data:"));

  try {
    if ((agent?.name || agent?.key) && drawFrame) {
      const frameUrl =
        "https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000";
      return await composeStickerWithHtmlLabel(
        stickerSource,
        agent.name || agent.key,
        { stickerSize: 1024, frameUrl, drawFrame }
      );
    }
    return await composeStickerFromSource(stickerSource, undefined, 1024, {
      agentLabel: agent?.name || agent?.key || null,
      drawFrame,
    });
  } catch (e) {
    console.warn("Sticker composition failed, using fallback.", e);
    return await composeStickerFromSource(stickerSource, undefined, 1024, {
      agentLabel: agent?.name || agent?.key || null,
      drawFrame,
    });
  }
};

const triggerShareService = (key: string, onShare: () => void) => {
  const anyWin = window as any;
  if (!anyWin.__submittedStickerUrls) {
    anyWin.__submittedStickerUrls = new Set<string>();
  }
  const submittedSet: Set<string> = anyWin.__submittedStickerUrls;

  if (!submittedSet.has(key)) {
    submittedSet.add(key);
    onShare();
  }
};

type Props = {
  result: GenerationResult;
  userName?: string;
  userEmail?: string;
  agent?: Agent;
  onShare: () => void;
  onPrint: () => void;
  onRestart?: () => void;
};

const ResultScreen: FC<Props> = ({
  result,
  userName,
  agent,
  onShare,
  onPrint,
  onRestart,
}) => {
  const imageUrl = (result as any)?.imageUrl || "";
  const resultAgent = (result as any)?.agent || agent || null;
  const stickerSource = (result as any)?.imageDataUrl || imageUrl;

  const [displayedSrc, setDisplayedSrc] = useState<string | null>(
    stickerSource
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const countdownIntervalRef = useRef<number | null>(null);

  const stopCountdown = useCallback(() => {
    setIsCountdownActive(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!stickerSource) return;

    let mounted = true;

    const processSticker = async () => {
      try {
        const composed = await composeSticker(
          stickerSource,
          result,
          resultAgent
        );
        if (mounted) {
          setDisplayedSrc(composed);
          triggerShareService(composed, onShare);
        }
      } catch (e) {
        console.warn("ResultScreen: failed to compose sticker on mount", e);
        if (mounted) {
          setDisplayedSrc(stickerSource);
          triggerShareService(stickerSource, onShare);
        }
      }
    };

    processSticker();

    return () => {
      mounted = false;
    };
  }, [stickerSource, result, resultAgent, onShare]);

  useEffect(() => {
    if (isCountdownActive) {
      setCountdown(30);
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopCountdown();
            if (onRestart) onRestart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isCountdownActive, onRestart, stopCountdown]);

  const handlePrint = async () => {
    stopCountdown();
    onPrint();
    setIsPrinting(true);
  };

  const handleClosePrint = () => {
    setIsPrinting(false);
    setIsCountdownActive(true);
  };

  const providerError = (result as any)?.providerError || null;
  const personalityData = getPersonalityData(resultAgent);

  return (
    <div className={styles.resultContainer}>
      {isPrinting && displayedSrc && (
        <PrintPreview src={displayedSrc} onClose={handleClosePrint} />
      )}
      <div className={styles.resultSection}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.resultTitle}>
              {userName ? `${userName}, you are` : "You are"}
              <br />
              The {resultAgent?.name || "Integrator"}!
            </h1>

            <div className={styles.resultDivider}>
              <div className={styles.dividerLine}></div>
              <svg
                width="5"
                height="4"
                viewBox="0 0 5 4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.dividerDot}
              >
                <circle cx="2.5" cy="2" r="2" fill="url(#paint0_linear)" />
                <defs>
                  <linearGradient
                    id="paint0_linear"
                    x1="0.688744"
                    y1="1.47298"
                    x2="2.12203"
                    y2="3.02577"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#1EDD8E" />
                    <stop offset="1" stopColor="#53C0D2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {personalityData && (
              <div className={styles.personalityDescription}>
                <span className={styles.bold}>Personality: </span>
                <span className={styles.regular}>
                  {personalityData.personality}{" "}
                </span>
                <span className={styles.bold}>Strengths: </span>
                <span className={styles.regular}>
                  {personalityData.strengths}{" "}
                </span>
                <span className={styles.bold}>Best For: </span>
                <span className={styles.regular}>
                  {personalityData.bestFor}{" "}
                </span>
                <span className={styles.bold}>Your Agent Will: </span>
                <span className={styles.regular}>
                  {personalityData.agentWill}
                </span>
              </div>
            )}
          </div>

          <div className={styles.stickerContainer}>
            {displayedSrc ? (
              <img
                src={displayedSrc}
                alt="Sticker"
                className={styles.stickerImage}
              />
            ) : (
              <div className={styles.stickerPlaceholder} />
            )}
          </div>

          <div
            className={styles.countdown}
            style={{ visibility: isCountdownActive ? "visible" : "hidden" }}
          >
            <p>Redirecting to start in {countdown} seconds...</p>
          </div>

          <div className={styles.ctaSection}>
            <Button
              variant="primary"
              onClick={handlePrint}
              className={styles.printButton}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7 17H17V22H7V17Z" fill="currentColor" />
                <path
                  d="M17 9H20C21.1046 9 22 9.89543 22 11V17H17V9Z"
                  fill="currentColor"
                />
                <path
                  d="M7 9V17H2V11C2 9.89543 2.89543 9 4 9H7Z"
                  fill="currentColor"
                />
                <path d="M7 2H17V9H7V2Z" fill="currentColor" />
              </svg>
              PRINT
            </Button>
          </div>
        </div>

        <div className={styles.startOverSection}>
          <Button
            variant="text"
            onClick={onRestart || (() => window.location.reload())}
            className={styles.startOverButton}
          >
            START OVER
          </Button>
        </div>

        {providerError && (
          <div className={styles.resultProviderError}>
            Generation fallback used: {String(providerError)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultScreen;
