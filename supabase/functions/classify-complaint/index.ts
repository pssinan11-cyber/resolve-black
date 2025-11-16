import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_SEVERITIES = ['low', 'medium', 'high', 'urgent'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, description, severity } = await req.json();

    // Input validation
    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Title is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Description is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!severity || !VALID_SEVERITIES.includes(severity)) {
      return new Response(
        JSON.stringify({ error: `Severity must be one of: ${VALID_SEVERITIES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Length validation
    if (title.length > MAX_TITLE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Title must not exceed ${MAX_TITLE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs (trim whitespace)
    const sanitizedTitle = title.trim();
    const sanitizedDescription = description.trim();

    if (!sanitizedTitle || !sanitizedDescription) {
      return new Response(
        JSON.stringify({ error: 'Title and description cannot be empty or only whitespace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a complaint classification AI. Return JSON with: category, confidence (0-1), tags (array), priority_score (0-100), predicted_hours (integer).'
          },
          {
            role: 'user',
            content: `Classify this complaint:\nTitle: ${sanitizedTitle}\nDescription: ${sanitizedDescription}\nSeverity: ${severity}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_complaint",
            description: "Classify a complaint and return structured data",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string" },
                confidence: { type: "number" },
                tags: { type: "array", items: { type: "string" } },
                priority_score: { type: "number" },
                predicted_hours: { type: "number" }
              },
              required: ["category", "confidence", "tags", "priority_score", "predicted_hours"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "classify_complaint" } }
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      category: 'General',
      confidence: 0.5,
      tags: [],
      priority_score: 50,
      predicted_hours: 24
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});