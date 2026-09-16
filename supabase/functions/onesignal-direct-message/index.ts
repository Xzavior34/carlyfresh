// Supabase Edge Function — onesignal-direct-message
// Sends a push notification for a direct message. The sender is validated
// server-side from the caller's JWT: the browser never gets to choose the
// sender name. Admins always push as "CarlyFresh Admin".

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiver_id, message } = await req.json();

    if (!receiver_id || !message) {
      return new Response(
        JSON.stringify({ error: 'receiver_id and message are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validate the signed-in sender from the Authorization header.
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Sign in to send messages.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Backend is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Your session has expired. Sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const senderId = userData.user.id;
    if (senderId === receiver_id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Cannot notify yourself.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Derive the sender's display identity from the database — never from the browser.
    const [roleRes, profileRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', senderId).maybeSingle(),
      supabase.from('profiles').select('business_name, full_name').eq('user_id', senderId).maybeSingle(),
    ]);

    const role = roleRes.data?.role ?? 'buyer';
    let senderName: string;
    if (role === 'admin') {
      senderName = 'CarlyFresh Admin';
    } else {
      const raw =
        (profileRes.data?.business_name ?? '').trim() ||
        (profileRes.data?.full_name ?? '').trim();
      senderName = raw && !/^supabase$/i.test(raw) ? raw : 'A CarlyFresh user';
    }

    // 3. Send the push.
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Push notifications are not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: [receiver_id],
      },
      target_channel: 'push',
      headings: { en: `New message from ${senderName}` },
      contents: { en: message },
      data: { app: 'CarlyFresh', sender_id: senderId },
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('OneSignal direct message response:', JSON.stringify(data));

    if (!response.ok) {
      const detail = data?.errors ? data.errors.join(', ') : `OneSignal returned ${response.status}`;
      return new Response(
        JSON.stringify({ error: detail }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Direct Message Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
