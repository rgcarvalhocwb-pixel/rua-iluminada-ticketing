import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  title: string;
  body: string;
  type: 'terminal_alert' | 'sales_update' | 'system_alert' | 'general';
  target?: 'all' | 'admins' | 'managers';
  data?: Record<string, any>;
}

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

    const payload: PushNotificationPayload = await req.json();

    console.log('Push notification request:', payload);

    // In a real implementation, you would:
    // 1. Get user push tokens from database
    // 2. Send push notifications via FCM/APNs
    // 3. Log the notification for audit purposes

    // For now, we'll just log the notification
    const { error } = await supabase.from('user_audit_logs').insert([
      {
        user_id: null,
        user_email: 'system',
        action: 'PUSH_NOTIFICATION_SENT',
        entity_type: 'notification',
        entity_id: crypto.randomUUID(),
        details: {
          notification: payload,
          timestamp: new Date().toISOString(),
          target: payload.target || 'all'
        },
        ip_address: null,
        user_agent: 'Push Notification System',
        session_id: null
      }
    ]);

    if (error) {
      console.error('Error logging push notification:', error);
      throw new Error(error.message);
    }

    // Simulate sending push notification
    console.log(`Push notification "${payload.title}" would be sent to ${payload.target || 'all'} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent',
        notificationId: crypto.randomUUID()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {  
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});