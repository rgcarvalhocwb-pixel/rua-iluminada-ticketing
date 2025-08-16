import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  requestCount: number;
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>();
  private hits = 0;
  private misses = 0;

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.data;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  size(): number {
    return this.cache.size;
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new SmartCache();

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    requestCount: 0
  });

  // Image compression function
  const compressImage = useCallback((file: File, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve!, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Cached fetch function
  const cachedFetch = useCallback(async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const startTime = Date.now();
    
    // Try cache first
    const cached = cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fetch and cache
    try {
      const data = await fetchFn();
      cache.set(key, data, ttl);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        averageResponseTime: (prev.averageResponseTime + responseTime) / 2,
        requestCount: prev.requestCount + 1
      }));

      return data;
    } catch (error) {
      console.error('Cached fetch error:', error);
      throw error;
    }
  }, []);

  // Lazy loading with intersection observer
  const useLazyLoading = useCallback((threshold: number = 0.1) => {
    const [isVisible, setIsVisible] = useState(false);
    const [element, setElement] = useState<Element | null>(null);

    useEffect(() => {
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold }
      );

      observer.observe(element);

      return () => observer.disconnect();
    }, [element, threshold]);

    return { isVisible, setElement };
  }, []);

  // Debounced function
  const useDebounce = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) => {
    const [debounced, setDebounced] = useState<T>();

    useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      
      const handler = (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      };
      
      setDebounced(() => handler as T);
      
      return () => clearTimeout(timeoutId);
    }, [callback, delay]);

    return debounced;
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cache.cleanup();
      
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cache.getHitRate(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Preload critical resources
  const preloadResource = useCallback((url: string, type: 'image' | 'script' | 'style') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
    }
    
    document.head.appendChild(link);
  }, []);

  return {
    metrics,
    cache: {
      get: cache.get.bind(cache),
      set: cache.set.bind(cache),
      clear: cache.clear.bind(cache),
      size: cache.size.bind(cache)
    },
    compressImage,
    cachedFetch,
    useLazyLoading,
    useDebounce,
    preloadResource
  };
};