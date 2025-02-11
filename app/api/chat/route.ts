import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ERROR_MESSAGES = {
  MISSING_API_KEY: 'Missing API key in server configuration.',
  INVALID_REQUEST: 'Invalid request format or empty message.',
  PROCESSING_ERROR: 'An error occurred while processing your request.',
  MEDIA_ERROR: 'Unable to process the uploaded media. Please try again.',
  NO_RESPONSE: 'Unable to generate a response. Please try again.',
  MODEL_ERROR: 'The language model is currently unavailable. Please try again later.',
  NETWORK_ERROR: 'Network connection error. Please check your connection and try again.',
  INVALID_RESPONSE: 'Received an invalid response from the model.',
  RATE_LIMIT: 'Rate limit exceeded. Please try again in a moment.',
  INVALID_API_KEY: 'Invalid API key. Please check your API key configuration.',
  CONTENT_POLICY: 'Your request could not be processed due to content policy restrictions.',
  SAFETY_ERROR: 'The request was flagged by our safety system.',
  REGION_ERROR: 'OpenAI services are not available in your region. Please use a VPN or contact support.'
} as const;

type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];

// Cache for storing recent responses
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Function to generate cache key
function generateCacheKey(prompt: string, type: 'text' | 'image' | 'audio'): string {
  return `${type}:${prompt}`;
}

async function generateImage(prompt: string): Promise<string> {
  const cacheKey = generateCacheKey(prompt, 'image');
  const cached = responseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const base64Image = response.data[0]?.b64_json;
    if (!base64Image) {
      throw new Error(ERROR_MESSAGES.NO_RESPONSE);
    }

    responseCache.set(cacheKey, { data: base64Image, timestamp: Date.now() });
    return base64Image;
  } catch (error) {
    console.error('Image generation error:', error);
    if (error instanceof OpenAI.APIError && error.code === 'unsupported_country_region_territory') {
      throw new Error(ERROR_MESSAGES.REGION_ERROR);
    }
    throw new Error(ERROR_MESSAGES.MEDIA_ERROR);
  }
}

async function generateAudio(text: string): Promise<string> {
  const cacheKey = generateCacheKey(text, 'audio');
  const cached = responseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    let voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova";
    
    if (text.includes("?")) {
      voice = "shimmer";
    } else if (text.length > 200) {
      voice = "onyx";
    } else if (text.includes("!")) {
      voice = "fable";
    }

    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",  // Using standard TTS model for faster response
      voice: voice,
      input: text,
      speed: 1.0,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    
    responseCache.set(cacheKey, { data: base64Audio, timestamp: Date.now() });
    return base64Audio;
  } catch (error) {
    console.error('Audio generation error:', error);
    if (error instanceof OpenAI.APIError && error.code === 'unsupported_country_region_territory') {
      throw new Error(ERROR_MESSAGES.REGION_ERROR);
    }
    throw new Error(ERROR_MESSAGES.MEDIA_ERROR);
  }
}

async function generateText(prompt: string, history: Array<{ role: 'user' | 'system'; content: string }>) {
  try {
    // Optimize history length to reduce token usage
    const recentHistory = history.slice(-5); // Keep only last 5 messages

    const isImageRequest = /generate|create|make|draw|show|give me|imagine/i.test(prompt) && 
                          /image|picture|photo|artwork|drawing|illustration|logo|icon/i.test(prompt);

    const isAudioRequest = /generate|create|make|speak|say|tell|read/i.test(prompt) && 
                          /audio|speech|voice|sound|speak|talk/i.test(prompt);

    if (isImageRequest) {
      try {
        const imagePromptResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Using faster model for image prompt generation
          messages: [
            ...recentHistory,
            { role: "user", content: prompt },
            { 
              role: "system", 
              content: "Create a concise image description for DALL-E 3. Focus on key visual elements. Keep it under 100 words.",
              name: "imagePrompt"
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
          presence_penalty: 0,
          frequency_penalty: 0,
        });

        const imagePrompt = imagePromptResponse.choices[0]?.message?.content;
        if (!imagePrompt) throw new Error(ERROR_MESSAGES.NO_RESPONSE);

        const imageBase64 = await generateImage(imagePrompt);

        return {
          type: 'image',
          content: "Here's the generated image based on your request.",
          url: `data:image/png;base64,${imageBase64}`
        };
      } catch (error) {
        if (error instanceof Error && error.message === ERROR_MESSAGES.REGION_ERROR) {
          return {
            type: 'text',
            content: ERROR_MESSAGES.REGION_ERROR
          };
        }
        throw error;
      }
    }

    if (isAudioRequest) {
      try {
        const textResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Using faster model for audio text generation
          messages: [
            ...recentHistory,
            { role: "user", content: prompt },
            { 
              role: "system", 
              content: "Generate a brief, natural response for text-to-speech. Keep it under 100 words.",
              name: "audioPrompt"
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
          presence_penalty: 0,
          frequency_penalty: 0,
        });

        const textContent = textResponse.choices[0]?.message?.content;
        if (!textContent) throw new Error(ERROR_MESSAGES.NO_RESPONSE);

        const audioBase64 = await generateAudio(textContent);

        return {
          type: 'audio',
          content: textContent,
          url: `data:audio/mp3;base64,${audioBase64}`
        };
      } catch (error) {
        if (error instanceof Error && error.message === ERROR_MESSAGES.REGION_ERROR) {
          return {
            type: 'text',
            content: ERROR_MESSAGES.REGION_ERROR
          };
        }
        throw error;
      }
    }

    // For regular text responses
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using faster model for regular responses
      messages: [
        ...recentHistory,
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500, // Reduced max tokens for faster response
      presence_penalty: 0,
      frequency_penalty: 0,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error(ERROR_MESSAGES.NO_RESPONSE);
    
    return {
      type: 'text',
      content
    };
  } catch (error) {
    console.error('Text generation error:', error);
    if (error instanceof OpenAI.APIError && error.code === 'unsupported_country_region_territory') {
      return {
        type: 'text',
        content: ERROR_MESSAGES.REGION_ERROR
      };
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_API_KEY },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const message = formData.get('message');
    const historyStr = formData.get('history');
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_REQUEST },
        { status: 400 }
      );
    }

    let history: Array<{ role: 'user' | 'system'; content: string }> = [];
    try {
      if (historyStr && typeof historyStr === 'string') {
        history = JSON.parse(historyStr);
      }
    } catch (error) {
      console.error('History parsing error:', error);
    }

    try {
      const response = await generateText(message, history);
      return NextResponse.json(response);
    } catch (error) {
      console.error('Generation error:', error);
      
      if (error instanceof OpenAI.APIError) {
        const status = error.status || 500;
        let errorMessage: ErrorMessage = ERROR_MESSAGES.MODEL_ERROR;

        if (error.status === 401) errorMessage = ERROR_MESSAGES.INVALID_API_KEY;
        if (error.status === 429) errorMessage = ERROR_MESSAGES.RATE_LIMIT;
        if (error.code === 'content_policy_violation') {
          errorMessage = ERROR_MESSAGES.CONTENT_POLICY;
          return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        if (error.code === 'unsupported_country_region_territory') {
          errorMessage = ERROR_MESSAGES.REGION_ERROR;
        }

        return NextResponse.json({ error: errorMessage }, { status });
      }

      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.PROCESSING_ERROR;
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.PROCESSING_ERROR;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}