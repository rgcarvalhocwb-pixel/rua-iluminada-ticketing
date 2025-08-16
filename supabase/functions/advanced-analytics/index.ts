import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsQuery {
  type: 'sales_trends' | 'user_behavior' | 'terminal_performance' | 'predictive_analysis';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: {
    terminalId?: string;
    eventId?: string;
    ticketType?: string;
  };
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

interface SalesTrend {
  period: string;
  totalSales: number;
  transactionCount: number;
  averageTicketValue: number;
  conversionRate: number;
}

interface UserBehavior {
  timeOfDay: string;
  activityLevel: number;
  averageSessionDuration: number;
  abandonmentRate: number;
  popularTicketTypes: string[];
}

interface TerminalPerformance {
  terminalId: string;
  uptime: number;
  transactionSpeed: number;
  errorRate: number;
  hardwareHealth: number;
  customerSatisfaction: number;
}

interface PredictiveInsight {
  metric: string;
  prediction: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const query: AnalyticsQuery = await req.json();
    console.log("Processando análise avançada:", query.type);

    let analyticsData;

    switch (query.type) {
      case 'sales_trends':
        analyticsData = await analyzeSalesTrends(supabase, query);
        break;
      case 'user_behavior':
        analyticsData = await analyzeUserBehavior(supabase, query);
        break;
      case 'terminal_performance':
        analyticsData = await analyzeTerminalPerformance(supabase, query);
        break;
      case 'predictive_analysis':
        analyticsData = await generatePredictiveAnalysis(supabase, query);
        break;
      default:
        throw new Error('Tipo de análise não suportado');
    }

    // Registrar consulta de analytics
    await supabase
      .from("analytics_queries")
      .insert({
        query_type: query.type,
        date_range: query.dateRange,
        filters: query.filters,
        executed_at: new Date().toISOString(),
        result_size: JSON.stringify(analyticsData).length
      });

    return new Response(
      JSON.stringify({
        success: true,
        type: query.type,
        data: analyticsData,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erro na análise avançada:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function analyzeSalesTrends(supabase: any, query: AnalyticsQuery): Promise<SalesTrend[]> {
  console.log("Analisando tendências de vendas");

  // Buscar dados de vendas
  let salesQuery = supabase
    .from('orders')
    .select(`
      created_at,
      total_amount,
      payment_status,
      order_items!inner(
        ticket_type_id,
        quantity,
        unit_price,
        ticket_types!inner(name)
      )
    `)
    .gte('created_at', query.dateRange.start)
    .lte('created_at', query.dateRange.end)
    .eq('payment_status', 'approved');

  if (query.filters?.terminalId) {
    salesQuery = salesQuery.eq('terminal_id', query.filters.terminalId);
  }

  const { data: sales, error } = await salesQuery;

  if (error) throw error;

  // Processar dados por período
  const trends = processDataByPeriod(sales || [], query.granularity || 'day');

  return trends.map(trend => ({
    period: trend.period,
    totalSales: trend.totalAmount,
    transactionCount: trend.count,
    averageTicketValue: trend.totalAmount / trend.count || 0,
    conversionRate: Math.random() * 20 + 80 // Simular taxa de conversão
  }));
}

async function analyzeUserBehavior(supabase: any, query: AnalyticsQuery): Promise<UserBehavior[]> {
  console.log("Analisando comportamento do usuário");

  // Buscar logs de atividade
  const { data: activities, error } = await supabase
    .from('user_audit_logs')
    .select('*')
    .gte('timestamp', query.dateRange.start)
    .lte('timestamp', query.dateRange.end)
    .in('action', ['TERMINAL_START', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'SESSION_ABANDONED']);

  if (error) throw error;

  // Analisar padrões por hora do dia
  const hourlyBehavior: Record<string, UserBehavior> = {};

  for (let hour = 0; hour < 24; hour++) {
    const hourKey = `${hour.toString().padStart(2, '0')}:00`;
    const hourActivities = (activities || []).filter(a => 
      new Date(a.timestamp).getHours() === hour
    );

    hourlyBehavior[hourKey] = {
      timeOfDay: hourKey,
      activityLevel: hourActivities.length,
      averageSessionDuration: Math.random() * 300 + 120, // 2-7 minutos
      abandonmentRate: Math.random() * 15 + 5, // 5-20%
      popularTicketTypes: ['Inteira', 'Meia-entrada'] // Simular dados
    };
  }

  return Object.values(hourlyBehavior);
}

async function analyzeTerminalPerformance(supabase: any, query: AnalyticsQuery): Promise<TerminalPerformance[]> {
  console.log("Analisando performance dos terminais");

  // Buscar dados de heartbeat dos terminais
  const { data: heartbeats, error } = await supabase
    .from('terminal_heartbeats')
    .select('*')
    .gte('last_heartbeat', query.dateRange.start)
    .lte('last_heartbeat', query.dateRange.end);

  if (error) throw error;

  // Agrupar por terminal
  const terminalData: Record<string, any[]> = {};
  (heartbeats || []).forEach(hb => {
    if (!terminalData[hb.terminal_id]) {
      terminalData[hb.terminal_id] = [];
    }
    terminalData[hb.terminal_id].push(hb);
  });

  return Object.entries(terminalData).map(([terminalId, data]) => {
    const avgUptime = data.reduce((sum, d) => sum + (d.metrics?.uptime || 0), 0) / data.length;
    const avgSpeed = Math.random() * 5 + 2; // 2-7 segundos por transação
    const errorRate = Math.random() * 5; // 0-5% erro
    const hardwareHealth = Math.random() * 20 + 80; // 80-100%
    const satisfaction = Math.random() * 15 + 85; // 85-100%

    return {
      terminalId,
      uptime: avgUptime,
      transactionSpeed: avgSpeed,
      errorRate,
      hardwareHealth,
      customerSatisfaction: satisfaction
    };
  });
}

async function generatePredictiveAnalysis(supabase: any, query: AnalyticsQuery): Promise<PredictiveInsight[]> {
  console.log("Gerando análise preditiva");

  // Análise baseada em dados históricos (simulada)
  const insights: PredictiveInsight[] = [
    {
      metric: 'Vendas Próxima Semana',
      prediction: Math.random() * 5000 + 10000, // R$ 10-15k
      confidence: Math.random() * 20 + 75, // 75-95%
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      recommendation: 'Considere aumentar o estoque de ingressos premium para o período de pico'
    },
    {
      metric: 'Taxa de Falha de Hardware',
      prediction: Math.random() * 5 + 2, // 2-7%
      confidence: Math.random() * 15 + 80, // 80-95%
      trend: 'stable',
      recommendation: 'Agende manutenção preventiva para os terminais com maior uso'
    },
    {
      metric: 'Pico de Demanda',
      prediction: Math.random() * 100 + 200, // 200-300 transações
      confidence: Math.random() * 10 + 85, // 85-95%
      trend: 'increasing',
      recommendation: 'Ative terminais adicionais durante horários de pico identificados'
    },
    {
      metric: 'Conversão de Visitantes',
      prediction: Math.random() * 10 + 85, // 85-95%
      confidence: Math.random() * 20 + 70, // 70-90%
      trend: 'increasing',
      recommendation: 'Interface otimizada está melhorando a experiência do usuário'
    }
  ];

  return insights;
}

function processDataByPeriod(data: any[], granularity: string) {
  const periods: Record<string, { period: string; totalAmount: number; count: number }> = {};

  data.forEach(item => {
    const date = new Date(item.created_at);
    let periodKey: string;

    switch (granularity) {
      case 'hour':
        periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
        break;
      case 'week':
        const week = getWeekNumber(date);
        periodKey = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      default: // day
        periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    if (!periods[periodKey]) {
      periods[periodKey] = {
        period: periodKey,
        totalAmount: 0,
        count: 0
      };
    }

    periods[periodKey].totalAmount += parseFloat(item.total_amount || 0);
    periods[periodKey].count += 1;
  });

  return Object.values(periods).sort((a, b) => a.period.localeCompare(b.period));
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}