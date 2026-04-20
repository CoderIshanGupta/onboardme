// packages/voice/elevenlabs.ts

const VOICE_STYLES = {
  professional: { rate: 0.95, pitch: 1.0 },
  technical: { rate: 0.9, pitch: 1.0 },
  beginner: { rate: 0.85, pitch: 1.05 },
  casual: { rate: 1.0, pitch: 1.0 },
  brutal: { rate: 1.1, pitch: 0.95 },
} as const;

// Timeout helper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Voice generation timed out")), ms)
    ),
  ]);
}

export async function generateVoice(
  text: string,
  mode: keyof typeof VOICE_STYLES = "professional"
): Promise<string> {
  // Limit text length for faster generation
  const trimmedText = text.slice(0, 1500);

  // Try PlayHT with 10s timeout
  if (process.env.PLAYHT_API_KEY && process.env.PLAYHT_USER_ID) {
    try {
      const url = await withTimeout(generateWithPlayHT(trimmedText, mode), 10000);
      if (url) return url;
    } catch (e) {
      console.log("[PlayHT skipped — timeout or error]");
    }
  }

  // Try ElevenLabs with 10s timeout
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const url = await withTimeout(generateWithElevenLabs(trimmedText, mode), 10000);
      if (url) return url;
    } catch (e) {
      console.log("[ElevenLabs skipped — timeout or error]");
    }
  }

  // Fallback: Client-side TTS (instant)
  return `__TTS__${encodeURIComponent(trimmedText)}__${mode}__`;
}

async function generateWithPlayHT(text: string, mode: string): Promise<string | null> {
  const res = await fetch("https://api.play.ht/api/v2/tts/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PLAYHT_API_KEY}`,
      "X-User-Id": process.env.PLAYHT_USER_ID!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      voice: "s3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/original/manifest.json",
      output_format: "mp3",
      speed: VOICE_STYLES[mode as keyof typeof VOICE_STYLES]?.rate || 0.95,
    }),
  });

  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  return `data:audio/mpeg;base64,${Buffer.from(buffer).toString("base64")}`;
}

async function generateWithElevenLabs(text: string, mode: string): Promise<string | null> {
  const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Default voice

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  return `data:audio/mpeg;base64,${Buffer.from(buffer).toString("base64")}`;
}