import { useLayoutEffect, useRef } from 'react';

type Props = {
  text: string;
  className?: string;
  /**
   * Fit within the card photo's height (the name box) instead of the
   * element's own content height, which would otherwise grow with the text.
   */
  matchPhoto?: boolean;
  /** Re-run fitting when external sizing (e.g. the text-size slider) changes. */
  scale?: number;
};

const MIN_SIZE = 4;

/**
 * Shrinks its text until it fits the available box. The CSS font size acts as
 * the upper bound, so the design's clamp() still decides how large text gets
 * when there is room. Fitting runs on text changes and container resizes, and
 * the inline font size is captured with the DOM during PNG export.
 */
export default function FitText({ text, className, matchPhoto = false, scale }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      // Reset first so the CSS-defined size can be read again as the maximum.
      el.style.fontSize = '';
      const maxSize = Number.parseFloat(window.getComputedStyle(el).fontSize);
      if (!Number.isFinite(maxSize)) return;

      const width = el.clientWidth;
      let height = el.clientHeight;
      if (matchPhoto) {
        const photo = el
          .closest('.profile-card')
          ?.querySelector<HTMLElement>('.card-photo');
        height = photo?.clientHeight ?? height;
      }
      if (width <= 0 || height <= 0) return;

      const fits = (size: number) => {
        el.style.fontSize = `${size}px`;
        return el.scrollWidth <= width + 0.5 && el.scrollHeight <= height + 0.5;
      };

      if (fits(maxSize)) {
        el.style.fontSize = '';
        return;
      }

      if (!fits(MIN_SIZE)) {
        el.style.fontSize = `${MIN_SIZE}px`;
        return;
      }

      let low = MIN_SIZE;
      let high = maxSize;
      for (let step = 0; step < 8; step += 1) {
        const mid = (low + high) / 2;
        if (fits(mid)) low = mid;
        else high = mid;
      }
      el.style.fontSize = `${low.toFixed(2)}px`;
    };

    fit();

    // Observe the card, not the text box: changing the font size changes the
    // text box and would otherwise ping-pong with the observer.
    const target = el.closest('.profile-card') ?? el.parentElement ?? el;
    const observer = new ResizeObserver(fit);
    observer.observe(target);
    return () => observer.disconnect();
  }, [text, matchPhoto, scale]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
