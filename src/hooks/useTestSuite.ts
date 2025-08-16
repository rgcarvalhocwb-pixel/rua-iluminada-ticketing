import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'running';
  message?: string;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  overall: 'pass' | 'fail' | 'running' | 'idle';
}

export const useTestSuite = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (name: string, testFn: () => Promise<void>): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      await testFn();
      return {
        name,
        status: 'pass',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  const runPaymentFlowTests = useCallback(async () => {
    const tests: TestResult[] = [];
    
    // Test 1: Terminal Payment Function
    tests.push(await runTest('Terminal Payment Creation', async () => {
      const response = await supabase.functions.invoke('terminal-payment', {
        body: {
          orderId: 'test-' + Date.now(),
          amount: 2500,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerCPF: '12345678901',
          description: 'Test Payment'
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.paymentUrl) throw new Error('No payment URL returned');
    }));

    // Test 2: Hardware Status Check
    tests.push(await runTest('Hardware Status Check', async () => {
      const response = await supabase.functions.invoke('terminal-hardware-status', {
        body: { terminalId: 'test-terminal', hardwareType: 'all' }
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.devices) throw new Error('No devices data returned');
    }));

    // Test 3: Database Connection
    tests.push(await runTest('Database Connection', async () => {
      const { data, error } = await supabase.from('events').select('count').limit(1);
      if (error) throw new Error(error.message);
    }));

    return {
      name: 'Payment Flow Tests',
      tests,
      overall: tests.some(t => t.status === 'fail') ? 'fail' as const : 'pass' as const
    };
  }, []);

  const runSecurityTests = useCallback(async () => {
    const tests: TestResult[] = [];
    
    // Test 1: RLS Policy Check
    tests.push(await runTest('RLS Policy Check', async () => {
      const { error } = await supabase.from('orders').select('*').limit(1);
      // Should fail without proper authentication
      if (!error) throw new Error('RLS policies not working - unauthorized access allowed');
    }));

    // Test 2: Audit Logging
    tests.push(await runTest('Audit Logging', async () => {
      const { data, error } = await supabase.from('user_audit_logs').select('count').limit(1);
      if (error) throw new Error('Audit logging not accessible');
    }));

    return {
      name: 'Security Tests',
      tests,
      overall: tests.some(t => t.status === 'fail') ? 'fail' as const : 'pass' as const
    };
  }, []);

  const runPerformanceTests = useCallback(async () => {
    const tests: TestResult[] = [];
    
    // Test 1: API Response Time
    tests.push(await runTest('API Response Time', async () => {
      const start = Date.now();
      const { error } = await supabase.from('events').select('id').limit(10);
      const responseTime = Date.now() - start;
      
      if (error) throw new Error(error.message);
      if (responseTime > 2000) throw new Error(`Response time too slow: ${responseTime}ms`);
    }));

    // Test 2: Memory Usage
    tests.push(await runTest('Memory Usage', async () => {
      const memInfo = (performance as any).memory;
      if (memInfo && memInfo.usedJSHeapSize > 50 * 1024 * 1024) {
        throw new Error(`High memory usage: ${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB`);
      }
    }));

    return {
      name: 'Performance Tests',
      tests,
      overall: tests.some(t => t.status === 'fail') ? 'fail' as const : 'pass' as const
    };
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestSuites([]);

    try {
      const suites = await Promise.all([
        runPaymentFlowTests(),
        runSecurityTests(),
        runPerformanceTests()
      ]);

      setTestSuites(suites);
    } finally {
      setIsRunning(false);
    }
  }, [runPaymentFlowTests, runSecurityTests, runPerformanceTests]);

  return {
    testSuites,
    isRunning,
    runAllTests,
    runPaymentFlowTests,
    runSecurityTests,
    runPerformanceTests
  };
};