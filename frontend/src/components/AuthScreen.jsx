import { useRef } from 'react';
import AuthBackground from './AuthBackground';
import AuthCard from './AuthCard';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AuthScreen() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Initial mount animations
    const cardEl = containerRef.current.querySelector('.glass-card');
    
    // Animate container entrance
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power2.out' }
    );

    // Bounce-in the glass authorization card
    if (cardEl) {
      gsap.fromTo(cardEl,
        { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'back.out(1.5)', delay: 0.2 }
      );
    }
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef} 
      className="auth-screen-wrapper"
    >
      {/* Dynamic Animated background mesh */}
      <AuthBackground />

      {/* Glassmorphic input panel */}
      <AuthCard />

      <style>{`
        .auth-screen-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
