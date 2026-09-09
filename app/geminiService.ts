
const NARRATIVE_IMAGES: Record<string, string> = {
  human_network: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  interaction: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=1200&q=80",
  contrast: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
  reflective: "https://images.unsplash.com/photo-1484069560501-87d72b0e3d05?auto=format&fit=crop&w=1200&q=80",
  gradual_closeness: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80",
  shared_space: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  cold_to_warm: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  social_distance: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80",
};

export const generateConceptualImage = async (prompt: string): Promise<string | null> => {
  const modelMatch = prompt.match(/Narrative model: (\w+)/);
  const model = modelMatch ? modelMatch[1] : 'interaction';

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === '') {
    return NARRATIVE_IMAGES[model] ?? NARRATIVE_IMAGES['interaction'];
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
      Create a conceptual 2D FLAT vector illustration.
      STYLE RULES:
      - 2D Flat, clean vectors. NO texture, NO noise, NO grain.
      - NO realistic shadows, NO 3D volume, NO cinematic lighting.
      - NO text, NO labels, NO numbers, NO typography (Persian or English).
      - Palette: Backgrounds: #0F172A, #111827. Accents: #22D3EE, #8B5CF6, #22C55E.
      - Outlines: 2px uniform stroke.
      - Focus: Human gestures, body language, hands, distance between bodies.
      - Mood: Professional, premium, minimalist.
      CONTENT: ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: systemPrompt }] }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return NARRATIVE_IMAGES[model] ?? null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return NARRATIVE_IMAGES[model] ?? null;
  }
};
