import { useEffect, useRef, useState } from 'react';
import styles from './LoadingScreen.module.css';
import MotionSection from './MotionSection';

const LoadingScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const STEP_DURATION = 6500;
    const FADE_DURATION = 300;
    let step = 1;
    setCurrentStep(step);

    const progressToNextStep = () => {
      if (step < 3) {
        setIsTransitioning(true);
        setTimeout(() => {
          step = step + 1;
          setCurrentStep(step);
          setTimeout(() => {
            setIsTransitioning(false);
            if (step < 3) setTimeout(progressToNextStep, STEP_DURATION);
          }, FADE_DURATION / 2);
        }, FADE_DURATION / 2);
      }
    };

    const firstTimeout = setTimeout(progressToNextStep, STEP_DURATION);
    return () => clearTimeout(firstTimeout);
  }, []);

  // Carousel drag functionality
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const pointerStart = (clientX: number) => {
      isDown = true;
      el.classList.add('dragging');
      startX = clientX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const pointerMove = (clientX: number) => {
      if (!isDown) return;
      const x = clientX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerStart(e.pageX);
      e.preventDefault();
    };
    const onPointerUp = () => {
      isDown = false;
      el.classList.remove('dragging');
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      e.preventDefault();
      pointerMove(e.pageX);
    };

    const onTouchStart = (e: TouchEvent) => {
      const clientX = e.touches[0].pageX;
      pointerStart(clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const clientX = e.touches[0].pageX;
      pointerMove(clientX);
    };

    // Add scroll listener to update indicators
    const onScroll = () => {
      if (!el) return;
      const cardWidth = 310 + 24; // card width + gap
      const newIndex = Math.round(el.scrollLeft / cardWidth);
      setCarouselIndex(newIndex);
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onPointerUp);
    el.addEventListener('scroll', onScroll);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onPointerUp);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const renderStep1 = () => (
    <div className={styles.loadingContent}>
      <div className={styles.loadingFeatures}>
        <div className={styles.featureItem}>
          <div className={styles.featureBullet}></div>
          <span>20+ years driving digital innovation</span>
        </div>
        <div className={styles.featureItem}>
          <div className={styles.featureBullet}></div>
          <span>100+ successful projects</span>
        </div>
        <div className={styles.featureItem}>
          <div className={styles.featureBullet}></div>
          <span>Expertise in Private Equity & Portfolio Companies</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.loadingContent}>
      <div className={styles.loadingDescriptionSection}>
        <h2 className={styles.loadingSubtitle}>From Due Diligence to Value Creation.</h2>
        <p className={styles.loadingDescription}>
          We help Private Equity firms and their portfolio companies maximize ROI and accelerate growth through technology.
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.loadingContent}>
      <div className={styles.loadingServicesSection}>
        <h2 className={styles.loadingSubtitle}>How We Help?</h2>
        <div className={styles.servicesCarousel} ref={carouselRef}>
          <div className={styles.serviceCard}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M29.6727 24.2827C29.6727 21.1592 27.1426 18.6177 24.033 18.6177C20.9234 18.6177 18.3932 21.1592 18.3932 24.2827C18.3932 27.4062 20.9234 29.9455 24.033 29.9455C25.0688 29.9455 26.0388 29.662 26.873 29.1716L29.4159 32.5104C29.5539 32.6917 29.7619 32.7876 29.9721 32.7876C30.1206 32.7876 30.2692 32.7407 30.3966 32.6426C30.7044 32.406 30.7616 31.9646 30.5282 31.6576L27.9853 28.3166C29.0254 27.289 29.6727 25.8605 29.6727 24.2827Z" fill="url(#paint0_linear_search)"/>
              <defs>
                <linearGradient id="paint0_linear_search" x1="17.1303" y1="16.5304" x2="33.6004" y2="36.0627" gradientUnits="userSpaceOnUse">
                  <stop offset="0.22" stopColor="#00CB78"/>
                  <stop offset="0.83" stopColor="#00C3D0"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Technology Due Diligence</span>
          </div>
          
          <div className={styles.serviceCard}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.2968 2.62281V16.1937C23.2968 17.3152 22.3838 18.2303 21.2602 18.2303H12.4393V24.3379H17.1892C17.5637 24.3379 17.868 24.6422 17.868 25.0167C17.868 25.3913 17.5637 25.6956 17.1892 25.6956H6.33376C5.95921 25.6956 5.65489 25.3913 5.65489 25.0167C5.65489 24.6422 5.95921 24.3379 6.33376 24.3379H11.0837V18.2303H2.26271C1.14121 18.2303 0.226127 17.3173 0.226127 16.1937V3.98054C0.226127 3.60599 0.530445 3.30168 0.904989 3.30168C1.27953 3.30168 1.58385 3.60599 1.58385 3.98054V16.1937C1.58385 16.5682 1.88817 16.8725 2.26271 16.8725H21.2623C21.6369 16.8725 21.9412 16.5682 21.9412 16.1937V2.62281C21.9412 2.24827 21.6369 1.94395 21.2623 1.94395H3.62044C3.24589 1.94395 2.94157 1.63963 2.94157 1.26509C2.94157 0.890546 3.24589 0.586229 3.62044 0.586229H21.2623C22.3838 0.586229 23.2989 1.49918 23.2989 2.62281H23.2968Z" fill="url(#paint0_linear_legacy)"/>
              <defs>
                <linearGradient id="paint0_linear_legacy" x1="3.69066" y1="3.6826" x2="20.7856" y2="19.273" gradientUnits="userSpaceOnUse">
                  <stop offset="0.22" stopColor="#00CB78"/>
                  <stop offset="0.83" stopColor="#00C3D0"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Tech Maturity Assessment</span>
          </div>
          
          <div className={styles.serviceCard}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M34.2703 16.3202H27.8932V15.3217C27.8932 14.2848 27.0483 13.4399 26.0114 13.4399H21.1961C20.1592 13.4399 19.3164 14.2827 19.3164 15.3196V16.3181H12.9394C11.9025 16.3181 11.0598 17.1608 11.0598 18.1977V22.2876C11.0598 22.7122 11.4054 23.06 11.8321 23.06C12.2588 23.06 12.6044 22.7143 12.6044 22.2876V18.1977C12.6044 18.0121 12.7559 17.8606 12.9415 17.8606H34.2724C34.458 17.8606 34.6095 18.0121 34.6095 18.1977V32.1893C34.6095 32.3749 34.458 32.5264 34.2724 32.5264H12.9415C12.7559 32.5264 12.6044 32.3749 12.6044 32.1893V27.7921C12.6044 27.3675 12.2588 27.0198 11.8321 27.0198C11.4054 27.0198 11.0598 27.3654 11.0598 27.7921V32.1871C11.0598 33.224 11.9046 34.0689 12.9415 34.0689H34.2724C35.3093 34.0689 36.152 33.2262 36.152 32.1893V18.1977C36.152 17.1608 35.3072 16.3159 34.2703 16.3159V16.3202Z" fill="url(#paint0_linear_pe)"/>
              <defs>
                <linearGradient id="paint0_linear_pe" x1="11.1856" y1="19.6869" x2="34.1209" y2="29.8637" gradientUnits="userSpaceOnUse">
                  <stop offset="0.22" stopColor="#00CB78"/>
                  <stop offset="0.83" stopColor="#00C3D0"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Post-M&A Integrations</span>
          </div>
          
          <div className={styles.serviceCard}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 8C20.42 8 17.46 10.96 17.46 14.54C17.46 18.12 20.42 21.08 24 21.08C27.58 21.08 30.54 18.12 30.54 14.54C30.54 10.96 27.58 8 24 8ZM24 19.08C21.52 19.08 19.46 17.02 19.46 14.54C19.46 12.06 21.52 10 24 10C26.48 10 28.54 12.06 28.54 14.54C28.54 17.02 26.48 19.08 24 19.08Z" fill="url(#paint0_linear_cloud)"/>
              <defs>
                <linearGradient id="paint0_linear_cloud" x1="11.1856" y1="19.6869" x2="34.1209" y2="29.8637" gradientUnits="userSpaceOnUse">
                  <stop offset="0.22" stopColor="#00CB78"/>
                  <stop offset="0.83" stopColor="#00C3D0"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Cloud Migration & Modernization</span>
          </div>
          
          <div className={styles.serviceCard}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 8C15.16 8 8 15.16 8 24C8 32.84 15.16 40 24 40C32.84 40 40 32.84 40 24C40 15.16 32.84 8 24 8ZM24 38C16.27 38 10 31.73 10 24C10 16.27 16.27 10 24 10C31.73 10 38 16.27 38 24C38 31.73 31.73 38 24 38Z" fill="url(#paint0_linear_digital)"/>
              <defs>
                <linearGradient id="paint0_linear_digital" x1="11.1856" y1="19.6869" x2="34.1209" y2="29.8637" gradientUnits="userSpaceOnUse">
                  <stop offset="0.22" stopColor="#00CB78"/>
                  <stop offset="0.83" stopColor="#00C3D0"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Digital Transformation & Enablement</span>
          </div>
        </div>
        
        <div className={styles.carouselIndicators}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div 
              key={index}
              className={`${styles.indicator} ${carouselIndex === index ? styles.indicatorActive : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <MotionSection animateKey={`loading-step-${currentStep}`} duration={500} className={styles.loadingScreen}>
      <div className={styles.loadingSection}>
        {/* Static header: main title, divider and loader spinner */}
        <div className={styles.staticHeader}>
          <h1 className={styles.loadingMainTitle}>
            Making Sense<br />
            Technology for smarter<br />
            investments.
          </h1>

          <div className={styles.loadingDivider}>
            <div className={styles.dividerLine}></div>
            <div className={styles.dividerDot}></div>
          </div>

          <div className={styles.loadingSpinnerContainer}>
            <div className={styles.glowEffect}></div>
            <div className={styles.sparkles}>
              <div className={styles.sparkle}></div>
              <div className={styles.sparkle}></div>
              <div className={styles.sparkle}></div>
              <div className={styles.sparkle}></div>
            </div>
            <svg className={styles.loadingSpinnerSvg} viewBox="0 0 56 56" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28ZM8.4 28C8.4 38.8248 17.1752 47.6 28 47.6C38.8248 47.6 47.6 38.8248 47.6 28C47.6 17.1752 38.8248 8.4 28 8.4C17.1752 8.4 8.4 17.1752 8.4 28Z" fill="url(#paint0_angular_spinner)"/>
              <defs>
                <linearGradient id="paint0_angular_spinner" x1="0" y1="28" x2="56" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0ECC7E"/>
                  <stop offset="100%" stopColor="rgba(83, 192, 210, 0)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {!isTransitioning && (
          <div className={styles.loadingContentWrapper}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
        )}
      </div>
    </MotionSection>
  );
};

export default LoadingScreen;
