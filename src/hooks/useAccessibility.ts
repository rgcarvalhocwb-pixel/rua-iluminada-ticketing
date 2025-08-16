import { useState, useEffect, useCallback } from 'react';

// Hook para detectar preferências de acessibilidade do sistema
export const useSystemAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
    prefersDarkMode: false
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersLargeText: window.matchMedia('(prefers-reduced-data: reduce)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
      });
    };

    // Update on mount
    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-data: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  return preferences;
};

// Hook para gerenciar focus
export const useFocusManagement = () => {
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  const pushFocus = useCallback((element: HTMLElement) => {
    if (document.activeElement instanceof HTMLElement) {
      setFocusHistory(prev => [...prev, document.activeElement as HTMLElement]);
    }
    element.focus();
  }, []);

  const popFocus = useCallback(() => {
    setFocusHistory(prev => {
      const newHistory = [...prev];
      const lastElement = newHistory.pop();
      if (lastElement) {
        lastElement.focus();
      }
      return newHistory;
    });
  }, []);

  const clearFocusHistory = useCallback(() => {
    setFocusHistory([]);
  }, []);

  return {
    focusHistory,
    pushFocus,
    popFocus,
    clearFocusHistory
  };
};

// Hook para navegação por teclado
export const useKeyboardNavigation = (
  items: HTMLElement[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onSelect?: (index: number) => void;
  } = {}
) => {
  const { loop = true, orientation = 'vertical', onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return;

    let newIndex = activeIndex;
    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = loop ? (activeIndex + 1) % items.length : Math.min(activeIndex + 1, items.length - 1);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = loop ? (activeIndex - 1 + items.length) % items.length : Math.max(activeIndex - 1, 0);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = loop ? (activeIndex + 1) % items.length : Math.min(activeIndex + 1, items.length - 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = loop ? (activeIndex - 1 + items.length) % items.length : Math.max(activeIndex - 1, 0);
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = items.length - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          onSelect(activeIndex);
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        items[newIndex]?.focus();
      }
    }
  }, [activeIndex, items, loop, orientation, onSelect]);

  const bindKeyboardEvents = useCallback((element: HTMLElement) => {
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    activeIndex,
    setActiveIndex,
    bindKeyboardEvents
  };
};

// Hook para live regions (anúncios para screen readers)
export const useLiveRegion = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);

    // Create a temporary live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return {
    announcements,
    announce,
    clearAnnouncements
  };
};

// Hook para skip links
export const useSkipLinks = () => {
  const [skipLinks, setSkipLinks] = useState<Array<{ href: string; label: string }>>([]);

  const addSkipLink = useCallback((href: string, label: string) => {
    setSkipLinks(prev => [...prev, { href, label }]);
  }, []);

  const removeSkipLink = useCallback((href: string) => {
    setSkipLinks(prev => prev.filter(link => link.href !== href));
  }, []);

  const clearSkipLinks = useCallback(() => {
    setSkipLinks([]);
  }, []);

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    clearSkipLinks
  };
};

// Hook para detectar se o usuário está usando teclado para navegação
export const useKeyboardUser = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    let keyboardUsed = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        keyboardUsed = true;
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      if (keyboardUsed) {
        keyboardUsed = false;
        setIsKeyboardUser(false);
        document.body.classList.remove('keyboard-user');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

// Hook para validação de contraste de cores
export const useColorContrast = () => {
  const calculateContrastRatio = useCallback((color1: string, color2: string): number => {
    // Convert colors to RGB
    const getRGB = (color: string) => {
      // Simple hex to RGB conversion (extend for other formats)
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        return {
          r: parseInt(hex.substr(0, 2), 16),
          g: parseInt(hex.substr(2, 2), 16),
          b: parseInt(hex.substr(4, 2), 16)
        };
      }
      return { r: 0, g: 0, b: 0 };
    };

    const getLuminance = (rgb: { r: number; g: number; b: number }) => {
      const sRGB = [rgb.r, rgb.g, rgb.b].map(color => {
        color /= 255;
        return color <= 0.03928 ? color / 12.92 : Math.pow((color + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const rgb1 = getRGB(color1);
    const rgb2 = getRGB(color2);
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  const meetsWCAG = useCallback((ratio: number, level: 'AA' | 'AAA' = 'AA'): boolean => {
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }, []);

  const getContrastRating = useCallback((ratio: number): 'fail' | 'aa' | 'aaa' => {
    if (ratio >= 7) return 'aaa';
    if (ratio >= 4.5) return 'aa';
    return 'fail';
  }, []);

  return {
    calculateContrastRatio,
    meetsWCAG,
    getContrastRating
  };
};