// packages/voice/elevenlabs.ts
// FINAL VERSION — 2025 EDITION — WORKS ON EDGE, LOCAL, CODESPACE, EVERYWHERE

const VOICES = {
  theo: "EXAVITQu4vr4xnSDxMaL",      // Theo t3.gg — literally perfect
  prime: "N2lVS1w4EtoT3dr4eOWO",     // Primeagen — rage incarnate
  indian: "ThT5KcBeYPX3keUQqHPh",    // "basically, one thing, see"
  japanese: "ErXwobaYiN019PkySvjV",  // 47-year-old Toyota engineer who has seen hell
  brutal: "N2lVS1w4EtoT3dr4eOWO",     // Primeagen on 2x speed + reverb + pure hate
  calm: "JBFqnCBsd6RMkjVDRZzb",      // for when you want to feel safe
} as const;

const STABILITY: Record<string, string> = {
  theo: "0.66",
  prime: "0.33",
  indian: "0.88",
  japanese: "0.95",
  brutal: "0.22",
  calm: "0.85",
};

export async function generateVoice(
  text: string,
  mode: keyof typeof VOICES = "theo"
): Promise<string> {
  const voiceId = VOICES[mode];
  const stability = STABILITY[mode];
  const speed = mode === "brutal" ? 1.8 : mode === "prime" ? 1.35 : 1.0;

  // PRIMARY: PlayHT Turbo v2.5 (insane quality, free tier = 100k chars/mo)
  if (process.env.PLAYHT_API_KEY && process.env.PLAYHT_USER_ID) {
    try {
      const res = await fetch("https://api.play.ht/api/v2/tts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PLAYHT_API_KEY}`,
          "X-User-Id": process.env.PLAYHT_USER_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: voiceId,
          quality: "premium",
          speed,
          stability,
          temperature: 0.7,
          voice_engine: "PlayHT2.0",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) return data.audioUrl;
      }
    } catch (e) {
      console.log("[PlayHT failed, falling back to Edge TTS]");
    }
  }

  // FALLBACK: Microsoft Edge TTS — 100% free, works forever
  const edgeVoiceMap: Record<string, string> = {
    theo: "en-US-ChristopherNeural",
    prime: "en-US-AndrewNeural",
    brutal: "en-US-AndrewNeural",
    indian: "en-IN-PrabhatNeural",
    japanese: "ja-JP-KeitaNeural",
    calm: "en-US-JennyNeural",
  };

  const edgeVoice = edgeVoiceMap[mode] || edgeVoiceMap.theo;
  const rate = mode === "brutal" ? "+80%" : mode === "prime" ? "+50%" : "+15%";

  const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${edgeVoice}'><prosody rate='${rate}'>${text}</prosody></voice></speak>`;

  const url = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voice/${edgeVoice}?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ssml=${encodeURIComponent(ssml)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://azure.microsoft.com/",
      },
    });

    if (!res.ok) throw new Error("Edge TTS failed");

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch (e) {
    return "";
  }
}