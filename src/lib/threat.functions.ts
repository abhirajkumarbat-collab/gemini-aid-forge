import { createServerFn } from "@tanstack/react-start";

interface ThreatInput {
  text?: string;
  imageDataUrl?: string;
}

const SYSTEM = `You are CyberTool's Threat Analyst. A user shares a suspicious message, link, or screenshot.
Reply in short mobile-friendly plain text with EXACTLY these sections:

RISK: <Safe | Suspicious | Dangerous> (one line, add a confidence word)
WHY: 2-4 short bullet lines of the specific red flags you can see.
NEXT STEPS: 3-5 short bullet lines of safe actions the user should take now.
NOTE: one line reminding them never to share OTPs, passwords or bank details.

Never help with attacking anyone. Keep it under 180 words. No markdown headers, no asterisks.`;

export const analyzeThreat = createServerFn({ method: "POST" })
  .inputValidator((input: ThreatInput) => {
    if (!input?.text?.trim() && !input?.imageDataUrl) {
      throw new Error("Paste a message or add a screenshot first.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const content: Array<Record<string, unknown>> = [];
    if (data.text?.trim()) {
      content.push({ type: "input_text", text: `Analyse this:\n\n${data.text.trim()}` });
    } else {
      content.push({ type: "input_text", text: "Analyse this screenshot." });
    }
    if (data.imageDataUrl) {
      content.push({ type: "input_image", image_url: data.imageDataUrl });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: [{ role: "user", content }],
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
      }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error("Too many scans right now. Try again in a minute.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Add credits to continue.");
      throw new Error("The scan failed. Please try again.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let out = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            out += evt.delta;
          } else if (evt.type === "response.completed" && !out && evt.response?.output_text) {
            out = evt.response.output_text;
          }
        } catch {
          /* ignore keep-alive lines */
        }
      }
    }

    return { result: out.trim() || "No clear verdict. Treat the message as suspicious and do not tap any links." };
  });
