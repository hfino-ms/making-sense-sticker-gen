import styles from "./ResultScreen.module.css";
import MotionSection from "./MotionSection";
import { composeStickerFromSource } from "../utils/composeSticker";
import { composeStickerWithHtmlLabel } from "../utils/htmlToCanvas";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import type { GenerationResult } from "../types";
import Button from "./ui/Button";

type Props = {
  result: GenerationResult;
  userName?: string;
  userEmail?: string;
  agent?: { key: string; name: string } | null;
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
    stickerSource || null
  );
  const [stickerVisible, setStickerVisible] = useState(false);
  const [servicesTriggered, setServicesTriggered] = useState(false);

  const [countdown, setCountdown] = useState<number>(30);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const composeSticker = async (source?: string): Promise<string> => {
    const src = source || stickerSource;
    const alreadyComposed = !!(result as any)?.imageDataUrl;
    const isRemoteSource = String(src || "").startsWith("http");
    const drawFrame =
      !isRemoteSource &&
      !(alreadyComposed && String(src || "").startsWith("data:"));

    try {
      if ((resultAgent?.name || resultAgent?.key) && drawFrame) {
        const frameUrl =
          "https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000";
        return await composeStickerWithHtmlLabel(
          src,
          resultAgent.name || resultAgent.key,
          {
            stickerSize: 1024,
            frameUrl,
            drawFrame,
          }
        );
      } else {
        return await composeStickerFromSource(src, undefined, 1024, {
          agentLabel: resultAgent?.name || resultAgent?.key || null,
          drawFrame,
        });
      }
    } catch (e) {
      console.warn(
        "HTML composition failed in ResultScreen, using canvas fallback",
        e
      );
      return await composeStickerFromSource(src, undefined, 1024, {
        agentLabel: resultAgent?.name || resultAgent?.key || null,
        drawFrame,
      });
    }
  };

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
        console.warn("ResultScreen: failed to compose sticker on mount", e);
        if (mounted) setDisplayedSrc(stickerSource || null);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickerSource]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (!displayedSrc) {
      setStickerVisible(false);
      return () => {
        if (t) clearTimeout(t);
      };
    }

    setStickerVisible(false);
    t = setTimeout(() => setStickerVisible(true), 520);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [displayedSrc]);

  useEffect(() => {
    if (!displayedSrc || !onShare) return;
    try {
      const key = displayedSrc;
      const anyWin = window as any;
      if (!anyWin.__submittedStickerUrls)
        anyWin.__submittedStickerUrls = new Set<string>();
      const submittedSet: Set<string> = anyWin.__submittedStickerUrls;

      if (submittedSet.has(key)) {
        setServicesTriggered(true);
        return;
      }

      submittedSet.add(key);
      setServicesTriggered(true);
      onShare();
    } catch (e) {
      if (!servicesTriggered) {
        setServicesTriggered(true);
        onShare();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSrc, onShare]);

  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const shareSticker = async () => {
    let outSrc = stickerSource;
    try {
      outSrc = await composeSticker();
    } catch {
      outSrc = stickerSource;
    }

    // Attempt Web Share API with files if supported
    try {
      const title = `${resultAgent?.name || 'Agent'} Sticker`;
      const text = 'Check out my AI agent sticker';

      // Try sharing as file if supported
      if (navigator.share) {
        try {
          // Try to fetch the image and share as a File if possible
          const resp = await fetch(outSrc || '');
          const blob = await resp.blob();
          const file = new File([blob], 'sticker.png', { type: blob.type || 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title, text, files: [file] });
            setShareMessage('Shared successfully');
            setTimeout(() => setShareMessage(null), 4000);
            try { onShare(); } catch (e) {}
            return;
          }
        } catch (err) {
          // continue to try URL share
        }

        try {
          await navigator.share({ title, text, url: outSrc });
          setShareMessage('Shared successfully');
          setTimeout(() => setShareMessage(null), 4000);
          try { onShare(); } catch (e) {}
          return;
        } catch (err) {
          // Fall through to clipboard fallback
        }
      }
    } catch (err) {
      // ignore and fallback
    }

    // Fallback: copy URL to clipboard
    try {
      if (outSrc) {
        await navigator.clipboard.writeText(outSrc);
        setShareMessage('Image URL copied to clipboard');
        setTimeout(() => setShareMessage(null), 4000);
        try { onShare(); } catch (e) {}
        return;
      }
    } catch (err) {
      // final fallback: open image in new tab
      if (outSrc) {
        window.open(outSrc, '_blank');
        setShareMessage('Opened image in new tab');
        setTimeout(() => setShareMessage(null), 4000);
        try { onShare(); } catch (e) {}
        return;
      }
    }
  };

  const printSticker = async () => {
    if (isCountdownActive) {
      setCountdown(30);
    }
    let outSrc = stickerSource;
    try {
      outSrc = await composeSticker();
    } catch {
      outSrc = stickerSource;
    }

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!printFrame.contentWindow || !doc) {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
      onPrint();
      setIsCountdownActive(true);
      setCountdown(30);
      return;
    }

    doc.open();
    doc.write(`<html><head><title>${
      resultAgent?.name || "Agent"
    } Sticker</title><style>
      html,body{height:100%;margin:0}
      .print-body{height:100%;display:flex;align-items:center;justify-content:center;background:#fff}
      .print-image{max-width:90vw;max-height:90vh;object-fit:contain;}
    </style></head><body class="print-body">
      <img src="${outSrc}" class="print-image"/>
    </body></html>`);
    doc.close();
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
      onPrint();
      setIsCountdownActive(true);
      setCountdown(30);
    }, 1000);
  };

  useEffect(() => {
    if (!isCountdownActive) {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      return;
    }
    setCountdown(30);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current)
            clearInterval(countdownInterval.current);
          if (onRestart) onRestart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [isCountdownActive, onRestart]);

  const getPersonalityData = () => {
    if (!resultAgent) return null;

    const map = {
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
    } as Record<string, any>;

    const rawName = String(
      resultAgent.name || resultAgent.key || ""
    ).toLowerCase();
    let key = "integrator";
    if (rawName.includes("deal") || rawName.includes("hunter")) key = "deal";
    else if (rawName.includes("risk")) key = "risk";
    else if (rawName.includes("transform")) key = "transform";
    else if (rawName.includes("vision")) key = "vision";
    else if (rawName.includes("integrat")) key = "integrator";

    return map[key] || map.integrator;
  };

  const personalityData = getPersonalityData();

  return (
    // Using imageUrl instead of displayedSrc to avoid large white border
    <MotionSection animateKey={imageUrl || 'result'} duration={420} className={styles.resultContainer}>
      <div className={styles.resultSection}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.resultTitle}>
              {userName ? `${userName}, you are` : "You are"}
              <br />
              {resultAgent?.name || "Integrator"}!
            </h1>
            <div className={styles.resultDivider}>
              <div className={styles.dividerLine}></div>
              <div
                className={styles.dividerDot}
                style={{
                  background:
                    "linear-gradient(90deg, #0ecc7e 0%, #53c0d2 100%)",
                }}
              ></div>
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
            <div className={[styles.resultImageArea, stickerVisible ? styles.stickerVisible : styles.stickerHidden].join(' ')}>
              <img src={stickerSource || ''} alt="Result sticker" className={styles.resultImage} />
            </div>
            {isCountdownActive && (
              <div
                style={{
                  margin: "16px 0",
                  color: "#0ecc7e",
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                <p>Redirecting to start in {countdown} seconds...</p>
              </div>
            )}
            <div className={styles.ctaSection}>
              <div className={styles.ctaRow}>
                <Button variant="primary" onClick={shareSticker} className={styles.printButton}>
                  PRINT
                </Button>
                {/*
                <Button variant="secondary" onClick={shareSticker} className={styles.shareButton}>
                  SHARE
                </Button>
                <Button variant="primary" onClick={printSticker} className={styles.printButton}>
                  PRINT
                  </Button> 
                */}
              </div>

              {shareMessage && (
                <div style={{ color: '#0ecc7e', marginTop: 8, fontWeight: 600 }}>{shareMessage}</div>
              )}

              <div className={styles.startOverSection}>
                <Button variant="link" className={styles.startOverButton} onClick={onRestart}>
                  START OVER
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
};

export default ResultScreen;
