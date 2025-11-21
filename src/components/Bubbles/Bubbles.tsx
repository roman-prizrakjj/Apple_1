import React, { useEffect, useState, useRef } from 'react';
import './Bubbles.css';

type Bubble = {
  id: number;
  left: number; // percent
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  wobbleType: string; // wobble animation type
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Toggle between bubble styles: 'rainbow' (current) or 'gradient' (new)
const BUBBLE_STYLE = 'gradient' as 'rainbow' | 'gradient';

const Bubbles: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Array<any>>([]);
  const idRef = useRef(1);
  const spawnTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  // Array of available pop sounds
  const soundFiles = [
    '/assets/bubble-pop-v2.wav',
    '/assets/bubble-pop-v3.wav',
    '/assets/bubble-pop-v4.wav'
  ];

  useEffect(() => {
    mounted.current = true;

    const spawn = () => {
      // limit total bubbles to avoid overload
      const MAX_BUBBLES = 40;
      setBubbles((s) => {
        const toAdd = [] as Bubble[];
        const currentCount = s.length;
        if (currentCount >= MAX_BUBBLES) return s;
        // spawn 1..3 bubbles per tick
        const spawnCount = Math.floor(random(1, 4));
        const wobbleTypes = ['wobble-horizontal-soft', 'wobble-horizontal-strong', 'wobble-vertical-soft', 'wobble-vertical-strong'];
        for (let i = 0; i < spawnCount && toAdd.length + currentCount < MAX_BUBBLES; i++) {
          const id = idRef.current++;
          const left = random(5, 95);
          const size = Math.round(random(96, 320));
          // make bubbles float slower: increase duration range with more variation
          const duration = Number(random(10, 35).toFixed(2));
          const delay = Number(random(0, 1.5).toFixed(2));
          const wobbleType = wobbleTypes[Math.floor(Math.random() * wobbleTypes.length)];
          toAdd.push({ id, left, size, duration, delay, wobbleType });
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

  const handlePop = (id: number, event: React.MouseEvent | React.TouchEvent) => {
    const el = document.getElementById(`bubble-${id}`);
    if (el) {
      el.classList.add('pop');
    }
    
    // Play random pop sound
    try {
      const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
      const audio = new Audio(randomSound);
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (e) {
      // ignore
    }
    
    // Get click/touch coordinates
    let clickX: number;
    let clickY: number;
    
    if ('touches' in event && event.touches.length > 0) {
      clickX = event.touches[0].clientX;
      clickY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clickX = event.clientX;
      clickY = event.clientY;
    } else {
      return;
    }
    
    console.debug('Particle spawn at click:', { clickX, clickY });
    
    // Create particles at click position
    const parts: any[] = [];
    
    // Main water droplets
    for (let i = 0; i < 12; i++) {
      const angle = random(-Math.PI, Math.PI);
      const dist = random(30, 100);
      const dx = Math.round(Math.cos(angle) * dist);
      const dy = Math.round(Math.sin(angle) * dist) - Math.round(random(8, 25));
      const size = Math.round(random(6, 16));
      const pid = `p_${Date.now()}_${i}`;
      parts.push({ id: pid, x: clickX, y: clickY, dx: `${dx}px`, dy: `${dy}px`, size, type: 'splash' });
    }
    
    // Fine mist
    for (let i = 0; i < 6; i++) {
      const angle = random(-Math.PI, Math.PI);
      const dist = random(15, 50);
      const dx = Math.round(Math.cos(angle) * dist);
      const dy = Math.round(Math.sin(angle) * dist) - Math.round(random(5, 12));
      const size = Math.round(random(3, 8));
      const pid = `m_${Date.now()}_${i}`;
      parts.push({ id: pid, x: clickX, y: clickY, dx: `${dx}px`, dy: `${dy}px`, size, type: 'mist' });
    }
    
    console.debug('Created particles:', parts.length);
    setParticles((s) => [...s, ...parts]);
    
    // Cleanup particles after animation
    setTimeout(() => {
      setParticles((s) => s.filter((p) => !parts.find((pp) => pp.id === p.id)));
    }, 1200);
    
    // Remove bubble after pop animation
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
          onClick={(e) => handlePop(b.id, e)}
          onTouchStart={(e) => handlePop(b.id, e)}
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
                  animationDuration: `${b.duration}s, 8s, 0.35s`,
                  animationDelay: `${b.delay}s, 0s, 0s`,
                }
          }
        >
          <div 
            className={`bubble__inner bubble__inner--${BUBBLE_STYLE}`}
            style={{
              animationName: b.wobbleType,
              animationDuration: '2s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite'
            }}
          >
            {BUBBLE_STYLE === 'rainbow' && <span></span>}
          </div>
        </div>
      ))}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.type === 'mist' ? 'particle--mist' : 'particle--splash'}`}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            // CSS custom properties for animation delta
            ['--dx' as any]: p.dx,
            ['--dy' as any]: p.dy,
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;
