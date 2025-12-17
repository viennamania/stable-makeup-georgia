import { useEffect, useRef, useState } from "react";

interface Options {
  duration?: number; // ms
  decimalPlaces?: number; // 소수점 자릿수
}

export function useAnimatedNumber(
  value: number,
  { duration = 1000, decimalPlaces = 0 }: Options = {}
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

      setDisplayValue(
        decimalPlaces === 0 
          ? Math.round(next) 
          : Math.round(next * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, decimalPlaces]);

  return displayValue;
}