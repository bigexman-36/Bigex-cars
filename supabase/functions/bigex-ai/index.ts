const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

const systemPrompt = `You are Bigex Intelligence, a friendly Nigerian car-shopping assistant inside Bigex Cars.

Talk naturally, like a helpful friend who understands the user's situation. The user may describe their budget, spouse, children, work, driving habits, fuel concerns, style preferences, or dislikes in normal conversation. Do not force them into a form.

Your job:
1. Understand the user's latest message in the context of the conversation.
2. Remember useful preferences from earlier messages.
3. Recommend ONLY cars present in the supplied inventory.
4. Rank recommendations by how well they fit the user's stated needs.
5. If important information is missing, ask a natural follow-up question instead of pretending you know.
6. Never invent a price, specification, seller, location, or availability.
7. If there are no strong matches, say so and explain what compromise could help.
8. Keep replies concise and conversational.
9. Recommendations must contain the exact inventory id.
10. You are not a mechanic or financial adviser; don't make unsupported safety, reliability, or financing claims.

Return valid JSON only with this shape:
{
  "message": "natural conversational response",
  "recommendations": [
    {"id": "exact inventory id", "reason": "short reason"}
  ]
}

Return at most 4 recommendations.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const message = String(body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];
    const cars = Array.isArray(body?.cars) ? body.cars : [];

    if (!message) return json({ error: "Tell me what kind of car you're looking for." }, 400);
    if (!cars.length) {
      return json({
        message: "I don't have any approved cars to work with yet. Once listings are available, I can help you narrow them down.",
        recommendations: []
      });
    }

    const inventory = cars.map((car: any) => ({
      id: String(car.id ?? ""),
      name: String(car.name ?? ""),
      price: String(car.price ?? ""),
      year: String(car.year ?? ""),
      type: String(car.type ?? ""),
      fuel: String(car.fuel ?? ""),
      mileage: String(car.mileage ?? ""),
      location: String(car.location ?? ""),
      transmission: String(car.transmission ?? ""),
      seller_name: String(car.seller_name ?? "")
    }));

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Bigex Intelligence is not configured yet." }, 503);

    const input = [
      { role: "system", content: systemPrompt },
      { role: "system", content: "CURRENT INVENTORY (the only cars you may recommend):\n" + JSON.stringify(inventory) },
      ...history.filter((item: any) => item?.role && item?.content).map((item: any) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.content).slice(0, 2000)
      })),
      { role: "user", content: message.slice(0, 3000) }
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input,
        text: { format: { type: "json_object" } },
        max_output_tokens: 700
      })
    });

    const raw = await openaiResponse.json();
    if (!openaiResponse.ok) {
      console.error("OpenAI error", raw);
      return json({ error: "Bigex Intelligence could not respond right now." }, 502);
    }

    const outputText = raw.output_text || raw.output?.flatMap((item: any) =>
      item.content?.map((part: any) => part.text || "") || []
    ).join("") || "";

    const parsed = JSON.parse(outputText);
    const allowed = new Set(inventory.map(car => car.id));

    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .filter((item: any) => allowed.has(String(item?.id)))
          .slice(0, 4)
          .map((item: any) => ({
            id: String(item.id),
            reason: String(item.reason || "Matches your preferences").slice(0, 180)
          }))
      : [];

    return json({
      message: String(parsed.message || "I found a few options worth looking at.").slice(0, 700),
      recommendations
    });
  } catch (error) {
    console.error("Bigex AI error", error);
    return json({ error: "Something went wrong while talking to Bigex Intelligence." }, 500);
  }
});
