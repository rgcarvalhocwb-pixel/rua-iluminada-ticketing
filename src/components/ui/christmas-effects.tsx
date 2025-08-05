import { useEffect, useState } from 'react';
import santaImage from '@/assets/santa-claus.png';

export const ChristmasEffects = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate snowflakes
  useEffect(() => {
    const generateSnowflakes = () => {
      const flakes = [];
      for (let i = 0; i < 50; i++) {
        flakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 3 + Math.random() * 7,
          size: 8 + Math.random() * 8
        });
      }
      setSnowflakes(flakes);
    };

    generateSnowflakes();
  }, []);

  // Track mouse position for Santa
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX - 30, // Center Santa on cursor
        y: e.clientY - 30
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Snow Effect */}
      <div className="snow-container">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              fontSize: `${flake.size}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Santa Following Mouse */}
      <div
        className="santa-follower"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      >
        <img 
          src={santaImage} 
          alt="Papai Noel" 
          draggable={false}
        />
      </div>
    </>
  );
};