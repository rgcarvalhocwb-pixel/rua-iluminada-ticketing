import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  type: 'fraud_detection' | 'suspicious_activity' | 'multiple_attempts' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface FraudMetrics {
  riskScore: number;
  patterns: string[];
  recommendations: string[];
}

class FraudDetector {
  private suspiciousPatterns = new Map<string, number>();
  private ipAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  
  analyzeTransaction(data: {
    customerCPF: string;
    amount: number;
    customerEmail: string;
    userAgent?: string;
    ipAddress?: string;
  }): FraudMetrics {
    let riskScore = 0;
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // Check for suspicious amounts
    if (data.amount > 100000) { // R$ 1000+
      riskScore += 30;
      patterns.push('HIGH_AMOUNT');
      recommendations.push('Verificar identidade do cliente');
    }

    // Check CPF format
    if (!this.isValidCPF(data.customerCPF)) {
      riskScore += 50;
      patterns.push('INVALID_CPF');
      recommendations.push('Validar CPF do cliente');
    }

    // Check email domain
    if (this.isSuspiciousEmail(data.customerEmail)) {
      riskScore += 25;
      patterns.push('SUSPICIOUS_EMAIL');
      recommendations.push('Verificar email do cliente');
    }

    // Check IP attempts if available
    if (data.ipAddress) {
      const attempts = this.ipAttempts.get(data.ipAddress);
      if (attempts && attempts.count > 5) {
        riskScore += 40;
        patterns.push('MULTIPLE_IP_ATTEMPTS');
        recommendations.push('Bloquear IP temporariamente');
      }
    }

    // Update attempt tracking
    if (data.ipAddress) {
      const current = this.ipAttempts.get(data.ipAddress) || { count: 0, lastAttempt: new Date() };
      this.ipAttempts.set(data.ipAddress, {
        count: current.count + 1,
        lastAttempt: new Date()
      });
    }

    return {
      riskScore: Math.min(riskScore, 100),
      patterns,
      recommendations
    };
  }

  private isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return parseInt(cpf[9]) === digit1 && parseInt(cpf[10]) === digit2;
  }

  private isSuspiciousEmail(email: string): boolean {
    const suspiciousDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return suspiciousDomains.includes(domain);
  }

  cleanup(): void {
    // Remove old IP attempts (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [ip, data] of this.ipAttempts.entries()) {
      if (data.lastAttempt < oneHourAgo) {
        this.ipAttempts.delete(ip);
      }
    }
  }
}

const fraudDetector = new FraudDetector();

// Simple encryption utilities
class SecurityUtils {
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateInput(input: string, type: 'email' | 'cpf' | 'phone'): boolean {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'cpf':
        return fraudDetector['isValidCPF'](input);
      case 'phone':
        return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(input);
      default:
        return false;
    }
  }
}

export const useAdvancedSecurity = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Log security event
  const logSecurityEvent = useCallback(async (
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    message: string,
    metadata?: Record<string, any>
  ) => {
    const event: SecurityEvent = {
      id: SecurityUtils.generateSecureToken(),
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata
    };

    setSecurityEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events

    // Log to Supabase
    try {
      await supabase.functions.invoke('log-security-event', {
        body: { event }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, []);

  // Analyze transaction for fraud
  const analyzeTransaction = useCallback((transactionData: {
    customerCPF: string;
    amount: number;
    customerEmail: string;
    userAgent?: string;
    ipAddress?: string;
  }): FraudMetrics => {
    const analysis = fraudDetector.analyzeTransaction(transactionData);
    
    if (analysis.riskScore > 70) {
      logSecurityEvent(
        'fraud_detection',
        'high',
        `High fraud risk detected: ${analysis.riskScore}%`,
        { analysis, transactionData }
      );
    } else if (analysis.riskScore > 40) {
      logSecurityEvent(
        'fraud_detection',
        'medium',
        `Medium fraud risk detected: ${analysis.riskScore}%`,
        { analysis, transactionData }
      );
    }

    return analysis;
  }, [logSecurityEvent]);

  // Monitor session security
  const monitorSessionSecurity = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true);

      // Check for suspicious browser behavior
      const checkBrowserSecurity = () => {
        // Check if developer tools are open
        let devtools = false;
        const img = new Image();
        Object.defineProperty(img, 'id', {
          get: function() {
            devtools = true;
            return 'devtools-detected';
          }
        });
        console.log(img);

        if (devtools) {
          logSecurityEvent(
            'suspicious_activity',
            'medium',
            'Developer tools detected',
            { timestamp: new Date() }
          );
        }

        // Check for unusual navigation patterns
        if (performance.navigation.type === 2) { // Back/forward navigation
          const rapidNavigation = sessionStorage.getItem('last_navigation');
          const now = Date.now();
          
          if (rapidNavigation && now - parseInt(rapidNavigation) < 1000) {
            logSecurityEvent(
              'suspicious_activity',
              'low',
              'Rapid navigation detected',
              { interval: now - parseInt(rapidNavigation) }
            );
          }
          
          sessionStorage.setItem('last_navigation', now.toString());
        }
      };

      // Run security checks periodically
      const interval = setInterval(checkBrowserSecurity, 30000); // Every 30 seconds

      return () => {
        clearInterval(interval);
        setIsMonitoring(false);
      };
    }
  }, [isMonitoring, logSecurityEvent]);

  // Secure data transmission
  const secureTransmit = useCallback(async (data: any): Promise<string> => {
    const jsonData = JSON.stringify(data);
    const hash = await SecurityUtils.hashData(jsonData);
    const token = SecurityUtils.generateSecureToken();
    
    return btoa(JSON.stringify({
      data: jsonData,
      hash,
      token,
      timestamp: Date.now()
    }));
  }, []);

  // Validate secure transmission
  const validateTransmission = useCallback(async (
    encodedData: string
  ): Promise<{ valid: boolean; data?: any }> => {
    try {
      const decoded = JSON.parse(atob(encodedData));
      const { data, hash, timestamp } = decoded;
      
      // Check if transmission is not too old (5 minutes)
      if (Date.now() - timestamp > 300000) {
        return { valid: false };
      }
      
      // Verify hash
      const expectedHash = await SecurityUtils.hashData(data);
      if (hash !== expectedHash) {
        return { valid: false };
      }
      
      return { valid: true, data: JSON.parse(data) };
    } catch (error) {
      return { valid: false };
    }
  }, []);

  // Cleanup old events and fraud data
  useEffect(() => {
    const cleanup = setInterval(() => {
      fraudDetector.cleanup();
      
      // Remove old security events (older than 24 hours)
      setSecurityEvents(prev => prev.filter(
        event => Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000
      ));
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  return {
    securityEvents,
    isMonitoring,
    analyzeTransaction,
    logSecurityEvent,
    monitorSessionSecurity,
    secureTransmit,
    validateTransmission,
    utils: SecurityUtils
  };
};