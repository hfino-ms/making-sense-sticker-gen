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
    const x = clientX - rect.left;
    const pct = x / rect.width;
    return Math.round(pct * 100);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // allow only primary button / touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const val = computeValueFromEvent(e.clientX);
    handleChange(val);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const val = computeValueFromEvent(e.clientX);
    handleChange(val);
    e.preventDefault();
  };

  const endPointer = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch (err) {}
  };

  const filledWidth = Math.max((localValue / 100) * 100, 10.2); // Minimum width to show progress
  const thumbPosition = (localValue / 100) * 100;

  return (
    <div className={styles.container}>
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
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={endPointer}
          onTouchStart={(e) => { const t = e.touches[0]; if (t) { const val = computeValueFromEvent(t.clientX); handleChange(val); e.preventDefault(); } }}
          onTouchMove={(e) => { const t = e.touches[0]; if (t) { const val = computeValueFromEvent(t.clientX); handleChange(val); e.preventDefault(); } }}
          onTouchEnd={() => { /* release drag state */ }}
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
          <div className={styles.labelItem}>MEDIUM</div>
          <div className={styles.labelItem}>HIGH</div>
        </div>
      </div>
    </div>
  );
};

export default LinearSlider;
