import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Fetch the webpage
    const pageResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RecipeBot/1.0)" },
    });

    if (!pageResponse.ok) {
      throw new Error(`Could not fetch that URL (${pageResponse.status}). The site may be blocking requests.`);
    }

    const html = await pageResponse.text();

    // Strip scripts, styles, and HTML tags — keep readable text only
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20000);

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Extract the recipe from this webpage and return a JSON object with exactly these fields:

- title (string): the recipe name
- ingredients (string): each ingredient on its own line, e.g. "2 cups flour\\n1 cup sugar"
- steps (string): each step on its own line, e.g. "Preheat oven to 180C\\nMix dry ingredients"
- notes (string): any tips, story, or notes about the recipe — empty string if none
- tags (string): comma-separated relevant tags like "dessert, chocolate" — empty string if none

Return ONLY valid JSON with these exact keys. No markdown, no explanation.

Webpage text:
${text}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response from Claude");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract recipe data from this page");

    const recipe = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
