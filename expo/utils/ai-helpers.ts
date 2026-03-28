/**
 * AI Helpers & Utilities
 * 
 * This file provides easy-to-use utilities for integrating AI throughout the app.
 * All APIs are production-ready and available for developers.
 * 
 * Note: Grok API is not currently available through the @rork-ai/toolkit-sdk.
 * The toolkit uses state-of-the-art models optimized for mobile applications.
 */

import { generateObject, generateText, useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TextPart = { type: "text"; text: string };
export type ImagePart = { type: "image"; image: string };
export type UserMessage = { role: "user"; content: string | (TextPart | ImagePart)[] };
export type AssistantMessage = { role: "assistant"; content: string | TextPart[] };

export type AIMessage = UserMessage | AssistantMessage;

export type ImageFile = {
  type: "file";
  mimeType: string;
  uri: string;
};

export type MessageWithFiles = {
  text: string;
  files?: ImageFile[];
};

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024";
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";

// ============================================================================
// SIMPLE TEXT GENERATION
// ============================================================================

/**
 * Generate text from a prompt using AI
 * 
 * @example
 * ```typescript
 * const summary = await generateSimpleText("Summarize this deal in one sentence: ...");
 * const caption = await generateSimpleText("Write an Instagram caption for a fitness post");
 * ```
 */
export async function generateSimpleText(prompt: string): Promise<string> {
  try {
    return await generateText(prompt);
  } catch (error) {
    console.error('Failed to generate text:', error);
    throw error;
  }
}

/**
 * Generate text from a conversation history
 * 
 * @example
 * ```typescript
 * const response = await generateTextFromConversation([
 *   { role: 'user', content: 'What is the best time to post on Instagram?' },
 *   { role: 'assistant', content: 'The best times are typically 11am-1pm and 7pm-9pm.' },
 *   { role: 'user', content: 'What about for fitness content?' }
 * ]);
 * ```
 */
export async function generateTextFromConversation(messages: AIMessage[]): Promise<string> {
  try {
    return await generateText({ messages });
  } catch (error) {
    console.error('Failed to generate text from conversation:', error);
    throw error;
  }
}

// ============================================================================
// STRUCTURED DATA GENERATION
// ============================================================================

/**
 * Generate structured data from a prompt using Zod schema
 * 
 * @example
 * ```typescript
 * const profile = await generateStructuredData({
 *   prompt: "Create a profile for a fitness influencer with 50k followers",
 *   schema: z.object({
 *     name: z.string(),
 *     bio: z.string(),
 *     categories: z.array(z.string()),
 *     followers: z.number()
 *   })
 * });
 * ```
 */
export async function generateStructuredData<T extends z.ZodType>(params: {
  prompt: string;
  schema: T;
}): Promise<z.infer<T>> {
  try {
    return await generateObject({
      messages: [{ role: 'user', content: params.prompt }],
      schema: params.schema,
    });
  } catch (error) {
    console.error('Failed to generate structured data:', error);
    throw error;
  }
}

/**
 * Generate structured data from conversation with Zod schema
 * 
 * @example
 * ```typescript
 * const analysis = await generateStructuredDataFromConversation({
 *   messages: [
 *     { role: 'user', content: 'Analyze this deal: budget $5000, 50k followers' }
 *   ],
 *   schema: z.object({
 *     score: z.number(),
 *     strengths: z.array(z.string()),
 *     risks: z.array(z.string())
 *   })
 * });
 * ```
 */
export async function generateStructuredDataFromConversation<T extends z.ZodType>(params: {
  messages: AIMessage[];
  schema: T;
}): Promise<z.infer<T>> {
  try {
    return await generateObject(params);
  } catch (error) {
    console.error('Failed to generate structured data from conversation:', error);
    throw error;
  }
}

// ============================================================================
// IMAGE ANALYSIS
// ============================================================================

/**
 * Analyze an image with AI and return structured data
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeImage({
 *   imageUri: 'data:image/jpeg;base64,...',
 *   prompt: "Analyze this Instagram post. What's the main subject and mood?",
 *   schema: z.object({
 *     subject: z.string(),
 *     mood: z.enum(['happy', 'calm', 'energetic', 'professional']),
 *     colors: z.array(z.string()),
 *     quality: z.number().min(1).max(10)
 *   })
 * });
 * ```
 */
export async function analyzeImage<T extends z.ZodType>(params: {
  imageUri: string;
  prompt: string;
  schema: T;
}): Promise<z.infer<T>> {
  try {
    return await generateObject({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: params.prompt },
            { type: 'image', image: params.imageUri }
          ]
        }
      ],
      schema: params.schema,
    });
  } catch (error) {
    console.error('Failed to analyze image:', error);
    throw error;
  }
}

/**
 * Extract text description from an image
 * 
 * @example
 * ```typescript
 * const description = await describeImage({
 *   imageUri: 'data:image/jpeg;base64,...',
 *   focus: 'Describe what products are shown and their positioning'
 * });
 * ```
 */
export async function describeImage(params: {
  imageUri: string;
  focus?: string;
}): Promise<string> {
  try {
    const prompt = params.focus 
      ? `Describe this image. ${params.focus}`
      : 'Describe this image in detail.';
    
    return await generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: params.imageUri }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Failed to describe image:', error);
    throw error;
  }
}

// ============================================================================
// IMAGE GENERATION
// ============================================================================

/**
 * Generate an image using DALL-E 3
 * 
 * @example
 * ```typescript
 * const result = await generateImage({
 *   prompt: "A modern Instagram post about fitness and healthy living",
 *   size: "1024x1024"
 * });
 * 
 * // Use the image
 * <Image source={{ uri: `data:${result.mimeType};base64,${result.base64Data}` }} />
 * ```
 */
export async function generateImage(params: {
  prompt: string;
  size?: ImageSize;
}): Promise<{
  base64Data: string;
  mimeType: string;
  size: string;
}> {
  try {
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        size: params.size || '1024x1024',
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Failed to generate image:', error);
    throw error;
  }
}

// ============================================================================
// IMAGE EDITING
// ============================================================================

/**
 * Edit an image using AI (Google Gemini 2.5 Flash Image)
 * 
 * @example
 * ```typescript
 * const edited = await editImage({
 *   prompt: "Make the background more vibrant and add sunlight",
 *   images: [{ type: 'image', image: 'data:image/jpeg;base64,...' }],
 *   aspectRatio: "16:9"
 * });
 * 
 * // Use the edited image
 * <Image source={{ uri: `data:${edited.mimeType};base64,${edited.base64Data}` }} />
 * ```
 */
export async function editImage(params: {
  prompt: string;
  images: Array<{ type: 'image'; image: string }>;
  aspectRatio?: AspectRatio;
}): Promise<{
  base64Data: string;
  mimeType: string;
  aspectRatio: string;
}> {
  try {
    const response = await fetch('https://toolkit.rork.com/images/edit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        images: params.images,
        aspectRatio: params.aspectRatio || '16:9',
      }),
    });

    if (!response.ok) {
      throw new Error(`Image editing failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Failed to edit image:', error);
    throw error;
  }
}

// ============================================================================
// SPEECH-TO-TEXT
// ============================================================================

/**
 * Transcribe audio to text
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('audio', {
 *   uri: recording.getURI(),
 *   name: 'recording.m4a',
 *   type: 'audio/m4a'
 * } as any);
 * 
 * const result = await transcribeAudio(formData, 'en');
 * console.log(result.text); // Transcribed text
 * console.log(result.language); // Detected language
 * ```
 */
export async function transcribeAudio(
  formData: FormData,
  language?: string
): Promise<{
  text: string;
  language: string;
}> {
  try {
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to transcribe audio:', error);
    throw error;
  }
}

// ============================================================================
// SPECIALIZED AI HELPERS FOR APP
// ============================================================================

/**
 * Analyze a gig and provide optimization suggestions
 */
export async function analyzeGig(params: {
  title: string;
  description: string;
  budget: number;
  category: string;
}) {
  return await generateStructuredData({
    prompt: `Analyze this influencer marketing gig and provide optimization suggestions:
    
Title: ${params.title}
Description: ${params.description}
Budget: $${params.budget}
Category: ${params.category}

Provide specific, actionable feedback.`,
    schema: z.object({
      score: z.number().min(0).max(100),
      strengths: z.array(z.string()),
      improvements: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
      })),
      suggestedBudgetRange: z.object({
        min: z.number(),
        max: z.number(),
      }),
      targetInfluencerProfile: z.string(),
    }),
  });
}

/**
 * Analyze an influencer profile and provide optimization tips
 */
export async function analyzeInfluencerProfile(params: {
  bio: string;
  categories: string[];
  followers: number;
  engagementRate: number;
  ratePerPost: number;
}) {
  return await generateStructuredData({
    prompt: `Analyze this influencer profile and provide optimization suggestions:
    
Bio: ${params.bio}
Categories: ${params.categories.join(', ')}
Followers: ${params.followers}
Engagement Rate: ${params.engagementRate}%
Rate per Post: $${params.ratePerPost}

Provide specific recommendations to improve their profile and attract better deals.`,
    schema: z.object({
      score: z.number().min(0).max(100),
      bioSuggestions: z.array(z.string()),
      categorySuggestions: z.array(z.string()),
      pricingSuggestion: z.object({
        recommended: z.number(),
        reason: z.string(),
      }),
      strengthsToHighlight: z.array(z.string()),
      areasToImprove: z.array(z.string()),
    }),
  });
}

/**
 * Generate contract terms for a deal
 */
export async function generateContractTerms(params: {
  dealType: string;
  budget: number;
  deliverables: string[];
  timeline: string;
}) {
  return await generateStructuredData({
    prompt: `Generate professional contract terms for this influencer marketing deal:
    
Deal Type: ${params.dealType}
Budget: $${params.budget}
Deliverables: ${params.deliverables.join(', ')}
Timeline: ${params.timeline}

Generate clear, fair terms that protect both parties.`,
    schema: z.object({
      paymentTerms: z.array(z.string()),
      deliverySchedule: z.array(z.object({
        milestone: z.string(),
        deadline: z.string(),
        payment: z.number(),
      })),
      contentRights: z.array(z.string()),
      cancellationPolicy: z.string(),
      revisionPolicy: z.string(),
      additionalClauses: z.array(z.string()),
    }),
  });
}

/**
 * Generate content ideas for influencers
 */
export async function generateContentIdeas(params: {
  category: string;
  platform: string;
  audience: string;
  brand?: string;
}) {
  return await generateStructuredData({
    prompt: `Generate creative content ideas for an influencer:
    
Category: ${params.category}
Platform: ${params.platform}
Target Audience: ${params.audience}
${params.brand ? `Brand: ${params.brand}` : ''}

Generate unique, engaging ideas that would perform well.`,
    schema: z.object({
      ideas: z.array(z.object({
        title: z.string(),
        description: z.string(),
        format: z.string(),
        estimatedEngagement: z.enum(['high', 'medium', 'low']),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        tips: z.array(z.string()),
      })),
    }),
  });
}

/**
 * Predict deal success
 */
export async function predictDealSuccess(params: {
  gigTitle: string;
  budget: number;
  influencerFollowers: number;
  influencerEngagement: number;
  category: string;
  historicalData?: {
    totalDeals: number;
    completedDeals: number;
    cancelledDeals: number;
  };
}) {
  return await generateStructuredData({
    prompt: `Predict the success of this influencer marketing deal:
    
Gig: ${params.gigTitle}
Budget: $${params.budget}
Influencer Followers: ${params.influencerFollowers}
Engagement Rate: ${params.influencerEngagement}%
Category: ${params.category}
${params.historicalData ? `
Historical Performance:
- Total Deals: ${params.historicalData.totalDeals}
- Completed: ${params.historicalData.completedDeals}
- Cancelled: ${params.historicalData.cancelledDeals}
` : ''}

Analyze and predict success.`,
    schema: z.object({
      successScore: z.number().min(0).max(100),
      likelihood: z.enum(['very_high', 'high', 'medium', 'low', 'very_low']),
      strengths: z.array(z.string()),
      risks: z.array(z.string()),
      improvements: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
      })),
      estimatedTimeline: z.string(),
      confidenceLevel: z.number().min(0).max(100),
    }),
  });
}

/**
 * Generate market insights
 */
export async function generateMarketInsights(params: {
  userRole: string;
  dealStats: {
    total: number;
    completed: number;
    active: number;
  };
  marketData: {
    totalGigs: number;
    avgBudget: number;
  };
}) {
  return await generateStructuredData({
    prompt: `Generate market insights for an influencer marketing platform user:
    
Role: ${params.userRole}
Deal Stats: ${params.dealStats.total} total, ${params.dealStats.completed} completed, ${params.dealStats.active} active
Market: ${params.marketData.totalGigs} gigs available, avg budget $${params.marketData.avgBudget}

Generate actionable insights, predictions, and trends.`,
    schema: z.object({
      insights: z.array(z.object({
        title: z.string(),
        description: z.string(),
        type: z.enum(['opportunity', 'warning', 'success', 'trend']),
        priority: z.enum(['high', 'medium', 'low']),
      })),
      predictions: z.array(z.object({
        metric: z.string(),
        current: z.number(),
        predicted: z.number(),
        change: z.number(),
        timeframe: z.string(),
      })),
      trends: z.array(z.object({
        category: z.string(),
        growth: z.number(),
        demand: z.enum(['high', 'medium', 'low']),
        avgPrice: z.number(),
      })),
    }),
  });
}

// ============================================================================
// CHAT/AGENT EXPORTS
// ============================================================================

export { useRorkAgent, createRorkTool };
export type { ToolUIPart } from 'ai';
