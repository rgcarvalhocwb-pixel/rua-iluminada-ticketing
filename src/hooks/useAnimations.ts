import { useState, useEffect, useRef, useCallback } from 'react';

// Hook para controlar animações baseadas em scroll
export const useScrollAnimation = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Para de observar após a primeira visualização
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { isVisible, elementRef };
};

// Hook para animações de hover
export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};

// Hook para animações de focus
export const useFocusAnimation = () => {
  const [isFocused, setIsFocused] = useState(false);

  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };

  return { isFocused, focusProps };
};

// Hook para controlar sequências de animação
export const useAnimationSequence = (steps: string[], interval: number = 1000) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    setIsPlaying(true);
    setCurrentStep(0);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, steps.length, interval]);

  return {
    currentStep: steps[currentStep],
    currentIndex: currentStep,
    isPlaying,
    play,
    pause,
    reset,
    isComplete: currentStep >= steps.length - 1
  };
};

// Hook para animações de loading
export const useLoadingAnimation = (isLoading: boolean) => {
  const [showLoader, setShowLoader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setFadeOut(false);
    } else {
      setFadeOut(true);
      // Remove o loader após a animação de fade out
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return { showLoader, fadeOut };
};

// Hook para animações de presença (enter/exit)
export const usePresenceAnimation = (isPresent: boolean, exitDelay: number = 0) => {
  const [shouldRender, setShouldRender] = useState(isPresent);
  const [stage, setStage] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
    isPresent ? 'entered' : 'exited'
  );

  useEffect(() => {
    if (isPresent) {
      setShouldRender(true);
      setStage('entering');
      // Pequeno delay para garantir que o elemento está renderizado
      const timer = setTimeout(() => setStage('entered'), 10);
      return () => clearTimeout(timer);
    } else {
      setStage('exiting');
      const timer = setTimeout(() => {
        setStage('exited');
        setShouldRender(false);
      }, exitDelay);
      return () => clearTimeout(timer);
    }
  }, [isPresent, exitDelay]);

  return { shouldRender, stage };
};

// Hook para animações de lista (staggered)
export const useStaggeredAnimation = (itemCount: number, staggerDelay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  const startAnimation = useCallback(() => {
    setVisibleItems(new Set());
    
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, i]));
      }, i * staggerDelay);
    }
  }, [itemCount, staggerDelay]);

  const reset = useCallback(() => {
    setVisibleItems(new Set());
  }, []);

  const isVisible = useCallback((index: number) => {
    return visibleItems.has(index);
  }, [visibleItems]);

  return { startAnimation, reset, isVisible };
};

// Hook para animações de contagem
export const useCountAnimation = (
  targetValue: number,
  startValue: number = 0,
  duration: number = 2000
) => {
  const [currentValue, setCurrentValue] = useState(startValue);
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = useCallback(() => {
    setIsAnimating(true);
    const startTime = Date.now();
    const difference = targetValue - startValue;

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (difference * easedProgress);
      
      setCurrentValue(Math.round(value));

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateValue);
  }, [targetValue, startValue, duration]);

  const reset = useCallback(() => {
    setCurrentValue(startValue);
    setIsAnimating(false);
  }, [startValue]);

  return { currentValue, isAnimating, animate, reset };
};

// Hook para detectar redução de movimento
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};