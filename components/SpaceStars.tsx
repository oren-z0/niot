"use client";

import { useEffect, useState } from "react";

const starsCount = 40;
const animationDuration = 8;

export default function SpaceStars() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  };

  return (
    <div className="hidden dark:block">
    {
      Array.from({ length: starsCount }).map((_, index) => {
        const isContainer = index % 10 === 0;
        const angle = 2 * Math.PI * Math.random();
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        // travel if hitting horizontal edge first
        const travelX = (window.innerWidth / 2) / Math.abs(cosAngle);
        // travel if hitting vertical edge first
        const travelY = (window.innerHeight / 2) / Math.abs(sinAngle);
        const travel = Math.min(travelX, travelY) * 0.9;
        return (
          <div
            key={index}
            className={isContainer ? "traveling-container" : "traveling-star"}
            style={{
              animationDuration: `${animationDuration * (0.5 + Math.random() * 1)}s`,
              animationDelay: `${Math.random() * 10 - 5}s`,
              animationName: `space-travel-${Math.floor(Math.random() * 3) + 1}`,
              "--travel-x": `${travel * 100 * cosAngle / window.innerWidth}vw`,
              "--travel-y": `${travel * 100 * sinAngle / window.innerHeight}vh`,
            } as React.CSSProperties}
          >
            {
              isContainer && (
                <div style={{ transform: `rotate(${Math.round(-90 + Math.random() * 180)}deg)` }}>
                  {
                    (index / 10 % 2) ? "🛸" : "🛰️"
                  }
                </div>
              )
            }
          </div>
        );
      })
    }
    </div>
  );
}
