import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { event } = await req.json();

    console.log('Security event received:', event);

    // Log security event to audit logs
    const { error } = await supabase.from('user_audit_logs').insert([
      {
        user_id: null, // System event
        user_email: 'system',
        action: 'SECURITY_EVENT',
        entity_type: event.type,
        entity_id: event.id,
        details: {
          type: event.type,
          severity: event.severity,
          message: event.message,
          metadata: event.metadata || {},
          timestamp: event.timestamp
        },
        ip_address: null,
        user_agent: 'Security System',
        session_id: null
      }
    ]);

    if (error) {
      console.error('Error logging security event:', error);
      throw new Error(error.message);
    }

    console.log('Security event logged successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Security event logged' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Security event logging error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {  
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});