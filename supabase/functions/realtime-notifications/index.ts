import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEvent {
  type: 'new_order' | 'user_pending' | 'low_stock' | 'system_alert';
  data: any;
  timestamp: string;
}

const connectedClients = new Set<WebSocket>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Request to upgrade to WebSocket required", { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", () => {
    console.log("New client connected to notifications");
    connectedClients.add(socket);
    
    // Enviar mensagem de boas-vindas
    socket.send(JSON.stringify({
      type: 'connected',
      message: 'Conectado às notificações em tempo real',
      timestamp: new Date().toISOString()
    }));
  });

  socket.addEventListener("close", () => {
    console.log("Client disconnected from notifications");
    connectedClients.delete(socket);
  });

  socket.addEventListener("error", (e) => {
    console.error("WebSocket error:", e);
    connectedClients.delete(socket);
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);
      
      // Broadcast para todos os clientes conectados
      if (data.type === 'broadcast') {
        broadcastToAllClients(data.notification);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  return response;
});

function broadcastToAllClients(notification: NotificationEvent) {
  const message = JSON.stringify(notification);
  
  connectedClients.forEach(client => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    } catch (error) {
      console.error("Error sending to client:", error);
      connectedClients.delete(client);
    }
  });
  
  console.log(`Broadcasted notification to ${connectedClients.size} clients`);
}