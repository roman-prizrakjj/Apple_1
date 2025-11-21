import React, { useEffect, useState, useRef } from 'react';
import './Bubbles.css';

type Bubble = {
  id: number;
  left: number; // percent
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const Bubbles: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(1);
  const spawnTimer = useRef<number | null>(null);
  const mounted = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    mounted.current = true;

    // prepare pop sound
    try {
      // try a few common paths; project currently has a WAV named "Bubble Pop Shoot! v4.wav"
      const path = encodeURI('/assets/pop.wav');
      audioRef.current = new Audio(path);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.6;
    } catch (e) {
      // ignore if audio not available
      // keep audioRef null
      // console.debug('pop audio init failed', e);
      audioRef.current = null;
    }

    const spawn = () => {
      // limit total bubbles to avoid overload
      const MAX_BUBBLES = 40;
      setBubbles((s) => {
        const toAdd = [] as Bubble[];
        const currentCount = s.length;
        if (currentCount >= MAX_BUBBLES) return s;
        // spawn 1..3 bubbles per tick
        const spawnCount = Math.floor(random(1, 4));
        for (let i = 0; i < spawnCount && toAdd.length + currentCount < MAX_BUBBLES; i++) {
          const id = idRef.current++;
          const left = random(5, 95);
          const size = Math.round(random(48, 160));
          // make bubbles float slower: increase duration range
          const duration = Number(random(12, 28).toFixed(2));
          const delay = Number(random(0, 1.5).toFixed(2));
          toAdd.push({ id, left, size, duration, delay });
        }
        return [...s, ...toAdd];
      });

      // schedule next spawn (more frequent)
      const next = random(200, 700);
      spawnTimer.current = window.setTimeout(() => {
        if (mounted.current) spawn();
      }, next);
    };

    spawn();

    return () => {
      mounted.current = false;
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
    };
  }, []);

  const handlePop = (id: number) => {
    // add pop class by replacing bubble with a 'popping' clone that will be removed soon
    const el = document.getElementById(`bubble-${id}`);
    if (el) {
      el.classList.add('pop');
    }
    // play pop sound (user gesture from click should allow playback)
    try {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        // play may return a promise we can safely ignore
        a.play().catch(() => {});
      }
    } catch (e) {
      // no-op
    }
    // remove from state after animation
    setTimeout(() => {
      setBubbles((s) => s.filter((b) => b.id !== id));
    }, 350);
  };

  const handleFloatEnd = (id: number) => {
    setBubbles((s) => s.filter((b) => b.id !== id));
  };

  // respect reduced motion
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="bubbles-root" aria-hidden>
      {bubbles.map((b) => (
        <div
          key={b.id}
          id={`bubble-${b.id}`}
          className="bubble"
          onClick={() => handlePop(b.id)}
          onAnimationEnd={(e) => {
            // if float animation ended, cleanup
            // access animationName in a safe, untyped way to satisfy TS
            const anyE = e as unknown as { animationName?: string };
            if (anyE.animationName === 'floatUp') handleFloatEnd(b.id);
          }}
          style={
            reduceMotion
              ? { left: `${b.left}%`, width: b.size, height: b.size }
              : {
                  left: `${b.left}%`,
                  width: b.size,
                  height: b.size,
                  animationDuration: `${b.duration}s, 0.35s`,
                  animationDelay: `${b.delay}s, 0s`,
                }
          }
        >
          <div className="bubble__inner" />
        </div>
      ))}
    </div>
  );
};

export default Bubbles;
