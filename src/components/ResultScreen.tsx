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
  onRestart?: () => void;
};

const ResultScreen: FC<Props> = ({
  result,
  userName,
  agent,
  onShare,
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

  // =========================
  // ADDED FUNCTIONS (ONLY)
  // =========================

  // Re-encode any src (http(s) or data:) into a FRESH PNG via <canvas>,
  // then share it as a File so iOS shows preview + photo actions.
  async function reencodeSrcToPngBlob(src: string): Promise<Blob> {
    // Load image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      // Allow data: and same-origin without CORS hassle; remote http(s) still display-only
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });

    // Draw to canvas at natural size (no scaling artifacts)
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, img.naturalWidth || img.width || 1024);
    canvas.height = Math.max(1, img.naturalHeight || img.height || 1024);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Prefer toBlob; fallback via dataURL
    const blob: Blob = await new Promise<Blob>((resolve) => {
      if ("toBlob" in canvas) {
        (canvas as HTMLCanvasElement).toBlob(
          (b) => resolve((b as Blob) || new Blob()),
          "image/png",
          1
        );
      } else {
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL("image/png", 1);
        fetch(dataUrl).then((r) => r.blob()).then(resolve);
      }
    });

    // Force PNG MIME just in case
    if (blob.type !== "image/png") {
      return new Blob([await blob.arrayBuffer()], { type: "image/png" });
    }
    return blob;
  }

  async function sharePngFromSrc(src: string, filename = "sticker.png") {
    // If it’s already a data: URL, skip fetch ambiguity and re-encode
    let pngBlob: Blob;
    if (src.startsWith("data:")) {
      pngBlob = await reencodeSrcToPngBlob(src);
    } else {
      // Remote/local URL → try fetch; if type is wrong/empty, re-encode
      try {
        const resp = await fetch(src, { mode: "cors" });
        const b = await resp.blob();
        pngBlob =
          b.type === "image/png" && b.size > 0
            ? b
            : await reencodeSrcToPngBlob(src);
      } catch {
        // Any fetch hiccup → re-encode via <img>/<canvas>
        pngBlob = await reencodeSrcToPngBlob(src);
      }
    }

    // Wrap as a proper PNG File (extension matters on iOS)
    const safeName = filename.endsWith(".png") ? filename : `${filename}.png`;
    const file = new File([pngBlob], safeName, { type: "image/png" });

    // iOS share sheet (files-only) — this is what preserves preview/actions
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      throw new Error("This device cannot share image files.");
    }
    await navigator.share({ files: [file] });
    setShareMessage("Shared!");
  }

  // Backward-compatible wrappers (names you already used elsewhere)
  async function shareImgElement(imgEl: HTMLImageElement, filename = "sticker.png") {
    const src = imgEl?.currentSrc || imgEl?.src || "";
    if (!src) throw new Error("No image src");
    return sharePngFromSrc(src, filename);
  }
  async function shareImageFile(input: HTMLImageElement | string | Blob, filename = "sticker.png") {
    if (input instanceof HTMLImageElement) {
      return shareImgElement(input, filename);
    }
    if (typeof input === "string") {
      return sharePngFromSrc(input, filename);
    }
    // Blob path: normalize into PNG File and share
    const png =
      input.type === "image/png" ? input : new Blob([await input.arrayBuffer()], { type: "image/png" });
    const file = new File([png], filename.endsWith(".png") ? filename : `${filename}.png`, { type: "image/png" });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      throw new Error("This device cannot share image files.");
    }
    return navigator.share({ files: [file] });
  }

  // =========================
  // END ADDED FUNCTIONS
  // =========================

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
              <img src={stickerSource || ''} alt="Result sticker" className={styles.resultImage} id="sticker" onClick={() => shareImgElement(document.getElementById("sticker") as HTMLImageElement)} />
            </div>
            {isCountdownActive && (
              <div className={styles.toast}>Redirecting to start in {countdown} seconds...</div>
            )}
            <div className={styles.ctaSection}>
              <div className={styles.ctaRow}>
                {/* MODIFIED: PRINT button (only) */}
                <Button
                  variant="primary"
                  onClick={() => {
                    // Prefer displayedSrc when available; falls back to the <img> if needed.
                    if (displayedSrc) {
                      sharePngFromSrc(displayedSrc, "sticker.png");
                    } else {
                      const img = document.getElementById("sticker") as HTMLImageElement | null;
                      if (img) shareImgElement(img, "sticker.png");
                    }
                  }}
                  className={styles.printButton}
                >
                  PRINT
                </Button>
              </div>

              {shareMessage && (
                <div className={[styles.toast, styles.fadeOut].join(' ')}>{shareMessage}</div>
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