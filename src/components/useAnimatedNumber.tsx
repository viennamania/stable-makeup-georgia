import { useEffect, useRef, useState } from "react";

interface Options {
  duration?: number; // ms
}

export function useAnimatedNumber(
  value: number,
  { duration = 1000 }: Options = {}
) {
  const [displayValue, setDisplayValue] = useState(value);
  const startValue = useRef(value);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;

    const animate = (time: number) => {
      if (!startTime.current) startTime.current = time;
      const progress = Math.min((time - startTime.current) / duration, 1);

      const next =
        startValue.current +
        (value - startValue.current) * progress;

      setDisplayValue(Math.round(next));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}