import React from 'react';
import { cn } from '@/lib/utils';

// Touch-friendly Button Component
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'touch';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  size = 'touch',
  variant = 'default',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
    touch: 'px-6 py-4 text-lg min-h-[56px] min-w-[56px]' // WCAG recommended touch target
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'touch-manipulation', // Disable double-tap zoom
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Swipe Gesture Component
interface SwipeAreaProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const SwipeArea: React.FC<SwipeAreaProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className
}) => {
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Determine if it's a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// Pull to Refresh Component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className
}) => {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || !containerRef.current || containerRef.current.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform z-10"
        style={{
          transform: `translateY(${pullDistance - threshold}px)`,
          height: `${threshold}px`
        }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full border-2 border-primary transition-all",
            isRefreshing ? "animate-spin" : ""
          )}
          style={{
            transform: `rotate(${pullProgress * 360}deg)`,
            opacity: pullDistance > 10 ? 1 : 0
          }}
        >
          <div className="w-full h-full rounded-full border-t-2 border-transparent" />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Mobile Navigation Bar
interface MobileNavBarProps {
  items: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }>;
  activeItem: string;
  onItemSelect: (id: string) => void;
  className?: string;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  items,
  activeItem,
  onItemSelect,
  className
}) => {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-background border-t border-border",
      "safe-area-padding-bottom", // For devices with home indicators
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item.id)}
            className={cn(
              "flex flex-col items-center justify-center",
              "min-h-[56px] min-w-[56px] px-2 py-1 rounded-lg",
              "transition-colors touch-manipulation",
              activeItem === item.id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// Mobile Viewport Height Fix
export const useMobileViewportHeight = () => {
  React.useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
};

// Safe Area Padding Component
interface SafeAreaProps {
  children: React.ReactNode;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  className?: string;
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  className
}) => {
  const paddingClasses = edges.map(edge => `safe-area-padding-${edge}`).join(' ');

  return (
    <div className={cn(paddingClasses, className)}>
      {children}
    </div>
  );
};

// Haptic Feedback Hook
export const useHapticFeedback = () => {
  const vibrate = React.useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightImpact = React.useCallback(() => {
    vibrate(10);
  }, [vibrate]);

  const mediumImpact = React.useCallback(() => {
    vibrate(20);
  }, [vibrate]);

  const heavyImpact = React.useCallback(() => {
    vibrate(30);
  }, [vibrate]);

  const selectionChanged = React.useCallback(() => {
    vibrate([5, 10, 5]);
  }, [vibrate]);

  const notificationSuccess = React.useCallback(() => {
    vibrate([10, 50, 10]);
  }, [vibrate]);

  const notificationWarning = React.useCallback(() => {
    vibrate([20, 100, 20]);
  }, [vibrate]);

  const notificationError = React.useCallback(() => {
    vibrate([50, 200, 50]);
  }, [vibrate]);

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionChanged,
    notificationSuccess,
    notificationWarning,
    notificationError
  };
};

// Mobile Input Component with better UX
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  clearable?: boolean;
  onClear?: () => void;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  icon: Icon,
  clearable = false,
  onClear,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        )}
        <input
          className={cn(
            "w-full px-3 py-4 rounded-lg border border-input",
            "bg-background text-foreground",
            "min-h-[56px] text-lg", // Touch-friendly size
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200",
            Icon ? "pl-11" : "",
            clearable && "pr-11",
            error ? "border-destructive" : "",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {clearable && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-accent"
          >
            <span className="sr-only">Limpar</span>
            ×
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};