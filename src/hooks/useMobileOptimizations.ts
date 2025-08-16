import { useState, useEffect, useCallback } from 'react';

// Hook para detectar se é um dispositivo móvel
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent) || width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      const isDesktopDevice = width >= 1024;

      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      setIsDesktop(isDesktopDevice);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};

// Hook para orientação da tela
export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
};

// Hook para conexão de rede
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    isSlowConnection: ['slow-2g', '2g'].includes(connectionType)
  };
};

// Hook para gestos de toque
export const useTouchGestures = () => {
  const [gestureState, setGestureState] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    deltaX: 0,
    deltaY: 0,
    isGesturing: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setGestureState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      isGesturing: true
    }));
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!gestureState.isGesturing) return;
    
    const touch = e.touches[0];
    setGestureState(prev => ({
      ...prev,
      endX: touch.clientX,
      endY: touch.clientY,
      deltaX: touch.clientX - prev.startX,
      deltaY: touch.clientY - prev.startY
    }));
  }, [gestureState.isGesturing]);

  const handleTouchEnd = useCallback(() => {
    setGestureState(prev => ({
      ...prev,
      isGesturing: false
    }));
  }, []);

  const detectSwipe = useCallback((threshold: number = 50) => {
    const { deltaX, deltaY } = gestureState;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        return deltaX > 0 ? 'right' : 'left';
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }
    
    return null;
  }, [gestureState]);

  return {
    gestureState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    detectSwipe
  };
};

// Hook para vibração háptica
export const useHaptic = () => {
  const isSupported = 'vibrate' in navigator;

  const vibrate = useCallback((pattern: number | number[]) => {
    if (isSupported) {
      navigator.vibrate(pattern);
    }
  }, [isSupported]);

  const patterns = {
    tap: 10,
    click: [10, 30, 10],
    success: [20, 50, 20],
    warning: [30, 100, 30],
    error: [50, 200, 50, 200, 50],
    notification: [100, 50, 100]
  };

  const playPattern = useCallback((patternName: keyof typeof patterns) => {
    vibrate(patterns[patternName]);
  }, [vibrate]);

  return {
    isSupported,
    vibrate,
    patterns,
    playPattern
  };
};

// Hook para scroll suave em mobile
export const useSmoothScroll = () => {
  const scrollToElement = useCallback((
    element: HTMLElement | string,
    options: ScrollIntoViewOptions = {}
  ) => {
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element;

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
        ...options
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  return {
    scrollToElement,
    scrollToTop,
    scrollToBottom
  };
};

// Hook para safe area insets
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0')
      });
    };

    // Set CSS custom properties for safe area
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
    }

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

// Hook para prevenção de zoom em mobile
export const usePreventZoom = (prevent: boolean = true) => {
  useEffect(() => {
    if (!prevent) return;

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventDoubleTapZoom = (e: TouchEvent) => {
      const t2 = e.timeStamp;
      const t1 = e.currentTarget && (e.currentTarget as any).lastTouch || t2;
      const dt = t2 - t1;
      const fingers = e.touches.length;
      
      if (dt < 500 && fingers === 1) {
        e.preventDefault();
      }
      
      if (e.currentTarget) {
        (e.currentTarget as any).lastTouch = t2;
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchstart', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchstart', preventDoubleTapZoom);
    };
  }, [prevent]);
};

// Hook para otimização de performance em mobile
export const useMobilePerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memory: 0,
    batteryLevel: 0,
    isLowEndDevice: false
  });

  useEffect(() => {
    const updateMetrics = async () => {
      let memory = 0;
      let batteryLevel = 0;
      let isLowEndDevice = false;

      // Memory usage
      if ('memory' in (performance as any)) {
        memory = (performance as any).memory.usedJSHeapSize / 1048576; // MB
      }

      // Battery level
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          batteryLevel = battery.level * 100;
        } catch (error) {
          console.log('Battery API not available');
        }
      }

      // Device capabilities detection
      const hardwareConcurrency = navigator.hardwareConcurrency || 1;
      const deviceMemory = (navigator as any).deviceMemory || 1;
      
      isLowEndDevice = hardwareConcurrency <= 2 || deviceMemory <= 1;

      setPerformanceMetrics({
        memory,
        batteryLevel,
        isLowEndDevice
      });
    };

    updateMetrics();
  }, []);

  const optimizeForLowEnd = useCallback(() => {
    if (performanceMetrics.isLowEndDevice) {
      // Reduce animations
      document.documentElement.style.setProperty('--animation-duration', '0s');
      
      // Reduce visual effects
      document.body.classList.add('low-end-device');
    }
  }, [performanceMetrics.isLowEndDevice]);

  return {
    performanceMetrics,
    optimizeForLowEnd
  };
};