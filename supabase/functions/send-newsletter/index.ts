import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLOG_URL = "https://blooglee.lovable.app/blog";
const INSTAGRAM_URL = "https://www.instagram.com/blooglee_/";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  audience: string;
  category: string;
}

interface Subscriber {
  id: string;
  email: string;
  audience: string | null;
}

function generateEmailHtml(
  posts: BlogPost[],
  audienceType: 'empresas' | 'agencias' | 'both',
  unsubscribeUrl: string
): string {
  const audienceTitle = audienceType === 'empresas' 
    ? 'para Empresas' 
    : audienceType === 'agencias' 
    ? 'para Agencias' 
    : '';
    
  const audienceSubtitle = audienceType === 'empresas'
    ? 'Tips de marketing digital para hacer crecer tu negocio'
    : audienceType === 'agencias'
    ? 'Estrategias para escalar tu producción de contenido'
    : 'Lo mejor en marketing digital y automatización';

  const postsHtml = posts.map(post => `
    <div style="margin-bottom: 30px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      ${post.image_url ? `
        <img src="${post.image_url}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover;" />
      ` : ''}
      <div style="padding: 20px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 10px;">
          ${post.category}
        </span>
        <h2 style="color: #1a1a2e; margin: 10px 0; font-size: 20px; line-height: 1.3;">
          ${post.title}
        </h2>
        <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          ${post.excerpt}
        </p>
        <a href="${BLOG_URL}/${post.slug}" 
           style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Leer artículo completo →
        </a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f3ff; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
            Blooglee ${audienceTitle}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
            ${audienceSubtitle}
          </p>
        </div>
        
        <!-- Content -->
        <div style="background: #faf5ff; border-radius: 0 0 16px 16px; padding: 30px;">
          <p style="color: #555; font-size: 15px; margin-bottom: 25px;">
            ¡Hola! 👋 Aquí tienes los últimos artículos que hemos publicado para ti:
          </p>
          
          ${postsHtml}
          
          <!-- CTA -->
          <div style="text-align: center; margin-top: 30px; padding: 25px; background: white; border-radius: 12px;">
            <p style="color: #555; margin: 0 0 15px 0; font-size: 14px;">
              ¿Quieres automatizar tu blog con IA?
            </p>
            <a href="https://blooglee.lovable.app/auth" 
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Prueba Blooglee gratis
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 20px;">
          <p style="margin: 0 0 15px 0;">
            <a href="${INSTAGRAM_URL}" style="color: #8B5CF6; text-decoration: none; font-weight: 500;">
              📸 Síguenos en Instagram
            </a>
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            Blooglee - Automatiza tu blog con IA
            <br><br>
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">
              Cancelar suscripción
            </a>
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log("=== Sending Segmented Newsletters ===");

    // Get posts published today
    const { data: todaysPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, image_url, audience, category')
      .eq('is_published', true)
      .gte('published_at', todayStart.toISOString())
      .order('published_at', { ascending: false });

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!todaysPosts || todaysPosts.length === 0) {
      console.log("No posts published today, skipping newsletter");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No posts today" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${todaysPosts.length} posts published today`);

    // Separate posts by audience
    const empresasPosts = todaysPosts.filter((p: BlogPost) => p.audience === 'empresas');
    const agenciasPosts = todaysPosts.filter((p: BlogPost) => p.audience === 'agencias');

    console.log(`Posts by audience: Empresas=${empresasPosts.length}, Agencias=${agenciasPosts.length}`);

    // Get active subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, audience')
      .eq('is_active', true);

    if (subsError) {
      throw new Error(`Failed to fetch subscribers: ${subsError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No subscribers" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscribers.length} active subscribers`);

    // Segment subscribers
    const empresasSubscribers = subscribers.filter((s: Subscriber) => s.audience === 'empresas');
    const agenciasSubscribers = subscribers.filter((s: Subscriber) => s.audience === 'agencias');
    const bothSubscribers = subscribers.filter((s: Subscriber) => s.audience === 'both' || s.audience === null);

    console.log(`Subscribers: Empresas=${empresasSubscribers.length}, Agencias=${agenciasSubscribers.length}, Both=${bothSubscribers.length}`);

    let emailsSent = 0;
    let errors: string[] = [];

    // Helper to send batch emails
    async function sendToSubscribers(
      subs: Subscriber[], 
      posts: BlogPost[], 
      audienceType: 'empresas' | 'agencias' | 'both'
    ) {
      if (subs.length === 0 || posts.length === 0) return;

      for (const subscriber of subs) {
        try {
          const unsubscribeUrl = `${BLOG_URL}?unsubscribe=${subscriber.id}`;
          const html = generateEmailHtml(posts, audienceType, unsubscribeUrl);
          
          const subject = audienceType === 'empresas'
            ? `📈 Nuevo artículo para tu empresa: ${posts[0].title}`
            : audienceType === 'agencias'
            ? `🚀 Nuevo artículo para agencias: ${posts[0].title}`
            : `✨ Nuevos artículos en Blooglee`;

          await resend.emails.send({
            from: "Blooglee <onboarding@resend.dev>",
            to: [subscriber.email],
            subject: subject,
            html: html,
          });

          emailsSent++;
          console.log(`✓ Email sent to ${subscriber.email} (${audienceType})`);
        } catch (error) {
          const errMsg = `Failed to send to ${subscriber.email}: ${error}`;
          console.error(errMsg);
          errors.push(errMsg);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Send to Empresas subscribers
    if (empresasPosts.length > 0) {
      await sendToSubscribers(empresasSubscribers, empresasPosts, 'empresas');
    }

    // Send to Agencias subscribers
    if (agenciasPosts.length > 0) {
      await sendToSubscribers(agenciasSubscribers, agenciasPosts, 'agencias');
    }

    // Send to Both subscribers (all posts)
    if (todaysPosts.length > 0) {
      await sendToSubscribers(bothSubscribers, todaysPosts, 'both');
    }

    console.log(`=== Newsletter Complete: ${emailsSent} emails sent ===`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        postsCount: todaysPosts.length,
        subscribersCount: subscribers.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Newsletter error:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
