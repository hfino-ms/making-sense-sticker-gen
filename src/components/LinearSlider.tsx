import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './LinearSlider.module.css';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const LinearSlider = ({ value, onChange }: Props) => {
  const [localValue, setLocalValue] = useState(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newValue)));
    setLocalValue(clamped);
    onChange(clamped);
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(Number(e.target.value));
  };

  const computeValueFromEvent = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (clientX <= rect.left) return 0;
    if (clientX >= rect.right) return 100;
    const x = clientX - rect.left;
    const pct = x / (rect.width || 1);
    return Math.round(pct * 100);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // allow only primary button / touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    draggingRef.current = true;
    activePointerIdRef.current = e.pointerId;
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch (err) { console.debug('setPointerCapture failed', err); }
    const val = computeValueFromEvent(e.clientX);
    handleChange(val);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    // ignore moves from other pointers
    if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) return;
    const val = computeValueFromEvent(e.clientX);
    handleChange(val);
    e.preventDefault();
  };

  const endPointer = (e?: React.PointerEvent | PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    activePointerIdRef.current = null;
    try {
      // release pointer capture if possible (may fail if event is from window)
      const anyEvent: any = e;
      const pointerId = anyEvent?.pointerId;
      const target = anyEvent?.target || anyEvent?.srcElement || null;
      if (pointerId != null && target && typeof (target as any).releasePointerCapture === 'function') {
        try { (target as any).releasePointerCapture(pointerId); } catch (err) {}
      }
    } catch (err) { console.debug('releasePointerCapture failed', err); }
  };

  // ensure we clean up if pointerup happens outside the component
  useEffect(() => {
    const onWinUp = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      endPointer(ev);
    };
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
    return () => {
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    };
  }, []);

  const filledWidth = localValue === 0 ? 0 : Math.max((localValue / 100) * 100, 10.2); // hide when zero, otherwise ensure minimum width
  const thumbPosition = (localValue / 100) * 100;
  const containerClass = `${styles.container} ${localValue === 0 ? styles.zero : ''}`;

  return (
    <div className={containerClass}>
      <div className={styles.result}>
        <div className={styles.percentage}>{Math.round(localValue)}%</div>
        <div className={styles.label}>RISK TOLERANCE</div>
      </div>

      <div className={styles.controls}>
        <div
          ref={containerRef}
          className={styles.sliderContainer}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endPointer(e)}
          onPointerCancel={(e) => endPointer(e)}
          onPointerLeave={(e) => endPointer(e)}
        >
          {/* Blur shadow effect */}
          <div className={styles.trackBlur} />

          {/* White background track */}
          <div className={styles.trackWhite} />

          {/* Filled gradient track */}
          <div
            className={styles.trackFilled}
            style={{
              // dynamic width via CSS variable
              ['--filled-width' as any]: `${filledWidth}%`
            } as React.CSSProperties}
          />

          {/* Glow effect behind thumb */}
          <div
            className={styles.sliderThumbGlow}
            style={{
              ['--thumb-position' as any]: `${thumbPosition}%`
            } as React.CSSProperties}
          />

          {/* Thumb handle */}
          <div
            className={styles.sliderThumb}
            style={{
              ['--thumb-position' as any]: `${thumbPosition}%`
            } as React.CSSProperties}
          />

          {/* Hidden native input for accessibility and keyboard */}
          <input
            type="range"
            min={0}
            max={100}
            value={localValue}
            onChange={handleInputChange}
            className={styles.input}
            aria-label="Risk tolerance percentage"
          />
        </div>

        {/* Labels */}
        <div className={styles.labels}>
          <div className={styles.labelItem}>LOW</div>
          <div className={styles.labelItem}>MODERATE-LOW</div>
          <div className={styles.labelItem}>MODERATE-HIGH</div>
          <div className={styles.labelItem}>HIGH</div>
        </div>
      </div>
    </div>
  );
};

export default LinearSlider;
