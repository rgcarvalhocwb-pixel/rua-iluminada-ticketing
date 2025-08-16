import React from 'react';
import { cn } from '@/lib/utils';

// Screen Reader Only Text
interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  className 
}) => {
  return (
    <span className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      "clip-[rect(0,0,0,0)]",
      className
    )}>
      {children}
    </span>
  );
};

// Skip Navigation Link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className
}) => {
  return (
    <a
      href={href}
      className={cn(
        "absolute top-0 left-0 z-50 p-4 bg-primary text-primary-foreground",
        "transform -translate-y-full transition-transform",
        "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true,
  restoreFocus = true,
  className
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastFocusedElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element
    lastFocusedElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forward)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (restoreFocus && lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    };
  }, [isActive, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Announce Live Region
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  className
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
};

// High Contrast Mode Detector
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Keyboard Navigation Helper
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEnter,
  onSpace,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  className
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      case ' ':
        if (onSpace) {
          event.preventDefault();
          onSpace();
        }
        break;
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight();
        }
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};

// Color Contrast Checker Component
interface ContrastCheckerProps {
  backgroundColor: string;
  textColor: string;
  children: React.ReactNode;
  className?: string;
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  backgroundColor,
  textColor,
  children,
  className
}) => {
  // Simple contrast ratio calculation (simplified version)
  const getLuminance = (color: string) => {
    // This is a simplified version - in production, use a proper color library
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const getContrastRatio = () => {
    const l1 = getLuminance(backgroundColor);
    const l2 = getLuminance(textColor);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const contrastRatio = getContrastRatio();
  const meetsWCAG = contrastRatio >= 4.5; // AA standard

  return (
    <div 
      className={cn(
        className,
        !meetsWCAG && "ring-2 ring-orange-500 ring-offset-2"
      )}
      style={{ backgroundColor, color: textColor }}
      title={!meetsWCAG ? `Contrast ratio: ${contrastRatio.toFixed(2)} (Below WCAG AA)` : undefined}
    >
      {children}
    </div>
  );
};

// Font Size Preference Hook
export const useFontSizePreference = () => {
  const [fontSize, setFontSize] = React.useState('medium');

  React.useEffect(() => {
    const stored = localStorage.getItem('fontSizePreference');
    if (stored) {
      setFontSize(stored);
      document.documentElement.style.fontSize = getFontSizeValue(stored);
    }
  }, []);

  const getFontSizeValue = (size: string) => {
    switch (size) {
      case 'small': return '14px';
      case 'medium': return '16px';
      case 'large': return '18px';
      case 'extra-large': return '20px';
      default: return '16px';
    }
  };

  const setFontSizePreference = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSizePreference', size);
    document.documentElement.style.fontSize = getFontSizeValue(size);
  };

  return { fontSize, setFontSizePreference };
};

// Accessibility Settings Panel
interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className
}) => {
  const { fontSize, setFontSizePreference } = useFontSizePreference();
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      '--reduce-motion',
      reduceMotion ? 'reduce' : 'no-preference'
    );
  }, [reduceMotion]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  return (
    <div className={cn("space-y-4 p-4 border rounded-lg", className)}>
      <h3 className="text-lg font-semibold">Configurações de Acessibilidade</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Tamanho da Fonte
        </label>
        <select
          value={fontSize}
          onChange={(e) => setFontSizePreference(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
        >
          <option value="small">Pequena</option>
          <option value="medium">Média</option>
          <option value="large">Grande</option>
          <option value="extra-large">Extra Grande</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="reduce-motion"
          checked={reduceMotion}
          onChange={(e) => setReduceMotion(e.target.checked)}
          className="rounded focus:ring-2 focus:ring-primary"
        />
        <label htmlFor="reduce-motion" className="text-sm">
          Reduzir Animações
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="high-contrast"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
          className="rounded focus:ring-2 focus:ring-primary"
        />
        <label htmlFor="high-contrast" className="text-sm">
          Alto Contraste
        </label>
      </div>
    </div>
  );
};