import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are AgroMihira, an AI farming assistant for farmers in Srikakulam district, Andhra Pradesh, India. You provide practical, actionable advice on crops, irrigation, weather, soil, pest management, and climate adaptation.

Guidelines:
- Keep answers concise (3-5 sentences) and practical.
- Use simple language a farmer can understand.
- When the question is about a specific crop disease or serious issue, recommend contacting the nearest agricultural officer for confirmation.
- Consider the local context: Srikakulam has a tropical climate, monsoon season Jun-Sep, main crops are paddy, maize, groundnut, pulses.
- If asked about weather, mention checking the Weather section of the app.
- Respond in the same language the user uses (English or Telugu).`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation for the AI
    const conversation = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Use Gemini API if key is available, otherwise use a local knowledge-based fallback
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    let reply: string;

    if (geminiKey) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: conversation
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
          }),
        }
      );

      if (!resp.ok) {
        throw new Error(`Gemini API error: ${resp.status}`);
      }

      const data = await resp.json();
      reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "I'm sorry, I couldn't generate a response. Please try again.";
    } else {
      // Fallback: knowledge-based responses for common farming questions
      reply = generateFallbackReply(messages[messages.length - 1].content);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateFallbackReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("crop") && (msg.includes("grow") || msg.includes("season"))) {
    return "For the current Kharif season in Srikakulam, paddy (rice) is the most suitable crop given the monsoon rainfall. Maize and groundnut are also good options. Check the Crop Recommendation section for detailed sowing, irrigation, and fertilizer guidance. For confirmation, please contact your nearest agricultural officer.";
  }
  if (msg.includes("irrigat") || msg.includes("water")) {
    return "For paddy in Kharif, flood irrigate every 5-7 days, relying on monsoon rainfall. For maize, irrigate every 8-10 days during dry spells. Always check the Weather section for rain probability before irrigating to save water. For confirmation, please contact your nearest agricultural officer.";
  }
  if (msg.includes("yellow") && msg.includes("leaf")) {
    return "Yellowing leaves can indicate nitrogen deficiency, overwatering, or a fungal disease like leaf blast in paddy. Check if the yellowing is uniform (likely nutrient deficiency) or spotted (likely disease). Apply nitrogen fertilizer if deficient, improve drainage if waterlogged, and consult an agricultural officer for disease confirmation.";
  }
  if (msg.includes("drought") || msg.includes("dry")) {
    return "To reduce drought damage: 1) Use mulch to retain soil moisture, 2) Switch to drought-tolerant crops like groundnut or pulses, 3) Use drip irrigation to save water, 4) Harvest rainwater in farm ponds. Check the Climate Data section for historical rainfall patterns. For confirmation, please contact your nearest agricultural officer.";
  }
  if (msg.includes("pest") || msg.includes("insect")) {
    return "For pest management: 1) Use integrated pest management (IPM), 2) Install pheromone traps, 3) Apply neem oil as a natural pesticide, 4) Avoid excessive chemical use. Identify the pest first — take a photo and use the Crop Disease Detection feature. For confirmation, please contact your nearest agricultural officer.";
  }
  if (msg.includes("fertiliz") || msg.includes("nutrient")) {
    return "For paddy in Srikakulam: apply NPK 80:40:40 kg/ha in 3 splits — basal at sowing, tillering, and panicle initiation. Add zinc sulphate 25 kg/ha if deficiency is observed. Get a soil test done for precise recommendations. For confirmation, please contact your nearest agricultural officer.";
  }

  return "I'm here to help with farming questions about crops, irrigation, weather, soil, pests, and climate adaptation for Srikakulam district. You can ask me things like: 'Which crop should I grow this season?', 'When should I irrigate?', or 'Why are my crop leaves turning yellow?'. For specific issues, please also contact your nearest agricultural officer.";
}
