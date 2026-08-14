import { useEffect, useState } from "react";
import { formatRub } from "../lib/format";

interface Props {
  value: number;
}

export function CountUpAmount({ value }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 500;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setShown(value * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <div className="hero-amount">{formatRub(shown)}</div>;
}
