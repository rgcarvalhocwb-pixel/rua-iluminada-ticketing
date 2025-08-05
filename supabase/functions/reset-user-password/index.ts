import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  targetUserId: string;
  userEmail: string;
  newPassword?: string;
  displayName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the requesting user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if the requesting user is master or admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    if (roleError || !userRole || !['master', 'admin'].includes(userRole.role)) {
      throw new Error("Insufficient permissions");
    }

    const { targetUserId, userEmail, newPassword, displayName }: ResetPasswordRequest = await req.json();

    // Prepare update data
    const updateData: any = {};
    if (newPassword) {
      updateData.password = newPassword;
    }
    if (displayName !== undefined) {
      updateData.user_metadata = { display_name: displayName };
    }

    // Update user using admin privileges
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      updateData
    );

    if (updateError) {
      throw updateError;
    }

    let emailResponse = null;
    // Send email only if password was changed
    if (newPassword) {
      emailResponse = await resend.emails.send({
        from: "Rua Iluminada <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Nova senha criada",
        html: `
          <h1>Sua senha foi redefinida</h1>
          <p>Uma nova senha foi criada para sua conta no sistema Rua Iluminada.</p>
          <p><strong>Nova senha:</strong> ${newPassword}</p>
          <p>Por favor, faça login com esta nova senha e altere-a por uma de sua preferência.</p>
          <br>
          <p>Atenciosamente,<br>Equipe Rua Iluminada</p>
        `,
      });
    }

    console.log("User updated successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: newPassword ? "Dados atualizados e email enviado com sucesso" : "Dados atualizados com sucesso",
        emailId: emailResponse?.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);