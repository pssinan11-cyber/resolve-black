import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "improve":
        systemPrompt = "You are a text improvement assistant. Your job is to ONLY return the improved version of the text. Do not include any explanations, introductions, or reasoning. Just return the improved text directly, nothing else.";
        userPrompt = `Improve this complaint description to be clear, professional, and detailed while maintaining the original intent:\n\n${text}`;
        break;
      
      case "suggest_title":
        systemPrompt = "You are a helpful assistant that suggests clear, concise complaint titles. Create a title that accurately summarizes the issue in 5-10 words.";
        userPrompt = `Based on this complaint description, suggest a clear title:\n\n${description}`;
        break;
      
      case "suggest_category":
        systemPrompt = "You are a helpful assistant that categorizes complaints. Analyze the complaint and suggest the most appropriate category from: Academic, Administrative, Facilities, Technical, or Other.";
        userPrompt = `Categorize this complaint:\n\n${text}`;
        break;
      
      case "chat":
        systemPrompt = "You are a helpful assistant for the Brototype complaint system. Help students with writing complaints, understanding the process, and providing guidance. Be concise and supportive.";
        userPrompt = text;
        break;
      
      default:
        throw new Error("Invalid action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-writing-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process AI request";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
