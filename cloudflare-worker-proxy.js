// Cloudflare Worker: comprenozet-webhook-proxy
// URL de destino (Supabase Edge Function)
const SUPABASE_WEBHOOK_URL = 'https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/comprenozet-webhook';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const startTime = Date.now();
  
  try {
    // Get original request body
    const body = await request.text();
    
    // Log incoming webhook (opcional - remover se não quiser logs)
    console.log('📥 Webhook received from Compre no Zet', {
      timestamp: new Date().toISOString(),
      contentLength: body.length,
      ip: request.headers.get('cf-connecting-ip'),
      country: request.headers.get('cf-ipcountry'),
    });

    // Validate JSON structure
    try {
      const payload = JSON.parse(body);
      if (!payload.action || !payload.data) {
        throw new Error('Invalid payload structure');
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Forward to Supabase
    const supabaseResponse = await fetch(SUPABASE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Cloudflare-Worker-Proxy/1.0',
        // Preserve original IP
        'X-Forwarded-For': request.headers.get('cf-connecting-ip'),
        'X-Real-IP': request.headers.get('cf-connecting-ip'),
      },
      body: body,
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await supabaseResponse.text();

    // Log result
    console.log('✅ Webhook forwarded to Supabase', {
      status: supabaseResponse.status,
      responseTime: `${responseTime}ms`,
    });

    // Return Supabase response
    return new Response(responseBody, {
      status: supabaseResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`,
      },
    });

  } catch (error) {
    console.error('❌ Error proxying webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Proxy error',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
