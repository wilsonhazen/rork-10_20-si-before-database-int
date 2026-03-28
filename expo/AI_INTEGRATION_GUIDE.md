# AI Integration Guide

This guide shows developers how to integrate AI features throughout the app using the available APIs.

## Table of Contents
- [Overview](#overview)
- [Available AI APIs](#available-ai-apis)
- [Quick Start Examples](#quick-start-examples)
- [Integration Patterns](#integration-patterns)
- [Best Practices](#best-practices)
- [Advanced Use Cases](#advanced-use-cases)

## Overview

The app has built-in AI capabilities through `@rork-ai/toolkit-sdk` and utility helpers in `utils/ai-helpers.ts`.

**Note:** Grok API is not currently available. The toolkit uses state-of-the-art models optimized for mobile applications, including GPT-4, DALL-E 3, Google Gemini 2.5 Flash Image, and Whisper.

## Available AI APIs

### 1. Text Generation
- **Simple prompts** → Text responses
- **Conversation history** → Contextual responses
- **Use cases**: Summaries, captions, descriptions, suggestions

### 2. Structured Data Generation
- **Prompts + Zod schema** → Typed data
- **Type-safe** responses
- **Use cases**: Analysis, predictions, recommendations, structured content

### 3. Image Analysis
- **Image + prompt** → Text or structured insights
- **Use cases**: Content moderation, product detection, mood analysis, quality scoring

### 4. Image Generation
- **Text prompt** → Generated image (DALL-E 3)
- **Multiple sizes** supported
- **Use cases**: Thumbnails, mockups, creative assets

### 5. Image Editing
- **Image + edit instructions** → Modified image (Gemini 2.5 Flash Image)
- **Multiple aspect ratios**
- **Use cases**: Background changes, style adjustments, enhancements

### 6. Speech-to-Text
- **Audio file** → Transcribed text
- **Auto language detection**
- **Use cases**: Voice notes, audio messages, voice commands

### 7. Conversational AI (Agent)
- **Multi-turn conversations**
- **Tool calling** (execute functions based on conversation)
- **Use cases**: AI assistants, chatbots, guided workflows

---

## Quick Start Examples

### Example 1: Generate Text Caption

```typescript
import { generateSimpleText } from '@/utils/ai-helpers';

const caption = await generateSimpleText(
  "Write a compelling Instagram caption for a fitness influencer promoting a protein shake"
);

console.log(caption);
```

### Example 2: Analyze Profile (Structured Data)

```typescript
import { analyzeInfluencerProfile } from '@/utils/ai-helpers';

const analysis = await analyzeInfluencerProfile({
  bio: "Fitness enthusiast sharing healthy recipes",
  categories: ["Fitness", "Food"],
  followers: 50000,
  engagementRate: 5.2,
  ratePerPost: 500
});

console.log(analysis.score); // 85
console.log(analysis.bioSuggestions); // ["Add specific achievements...", ...]
console.log(analysis.pricingSuggestion.recommended); // 650
```

### Example 3: Analyze Image

```typescript
import { analyzeImage } from '@/utils/ai-helpers';
import { z } from 'zod';

const result = await analyzeImage({
  imageUri: 'data:image/jpeg;base64,...',
  prompt: "Analyze this Instagram post. What's the vibe and quality?",
  schema: z.object({
    subject: z.string(),
    mood: z.enum(['happy', 'calm', 'energetic', 'professional']),
    quality: z.number().min(1).max(10),
    suggestions: z.array(z.string())
  })
});

console.log(result);
// {
//   subject: "Person working out at gym",
//   mood: "energetic",
//   quality: 8,
//   suggestions: ["Better lighting", "Show product more clearly"]
// }
```

### Example 4: Generate Image

```typescript
import { generateImage } from '@/utils/ai-helpers';
import { Image } from 'react-native';

const result = await generateImage({
  prompt: "A modern Instagram post template for fitness content, minimalist design",
  size: "1024x1024"
});

// Display the generated image
<Image 
  source={{ uri: `data:${result.mimeType};base64,${result.base64Data}` }}
  style={{ width: 300, height: 300 }}
/>
```

### Example 5: Edit Image

```typescript
import { editImage } from '@/utils/ai-helpers';

const edited = await editImage({
  prompt: "Make the background more vibrant and add warm sunlight effect",
  images: [{ 
    type: 'image', 
    image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' 
  }],
  aspectRatio: "16:9"
});

// Use edited image
<Image 
  source={{ uri: `data:${edited.mimeType};base64,${edited.base64Data}` }}
/>
```

### Example 6: Speech-to-Text

```typescript
import { transcribeAudio } from '@/utils/ai-helpers';
import { Audio } from 'expo-av';

// Record audio
const recording = new Audio.Recording();
await recording.prepareToRecordAsync({
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
  },
});

await recording.startAsync();
// ... user speaks ...
await recording.stopAndUnloadAsync();

// Transcribe
const uri = recording.getURI();
const formData = new FormData();
formData.append('audio', {
  uri,
  name: 'recording.m4a',
  type: 'audio/m4a'
} as any);

const result = await transcribeAudio(formData);
console.log(result.text); // "This is what the user said"
console.log(result.language); // "en"
```

### Example 7: AI Chat Agent

```typescript
import { useRorkAgent, createRorkTool } from '@/utils/ai-helpers';
import { z } from 'zod';
import { useState } from 'react';

function AIChatScreen() {
  const [input, setInput] = useState('');
  
  const { messages, sendMessage } = useRorkAgent({
    tools: {
      createGig: createRorkTool({
        description: "Create a new gig when user wants to post an opportunity",
        zodSchema: z.object({
          title: z.string(),
          budget: z.number(),
          category: z.string()
        }),
        execute(input) {
          // Create the gig
          console.log('Creating gig:', input);
          // Call your createGig function
          return "Gig created successfully!";
        },
      }),
    },
  });

  return (
    <View>
      {messages.map((m) => (
        <View key={m.id}>
          <Text>{m.role}: </Text>
          {m.parts.map((part, i) => {
            if (part.type === 'text') {
              return <Text key={i}>{part.text}</Text>;
            }
            if (part.type === 'tool') {
              if (part.state === 'output-available') {
                return <Text key={i}>✓ Tool executed: {part.toolName}</Text>;
              }
            }
          })}
        </View>
      ))}
      
      <TextInput 
        value={input}
        onChangeText={setInput}
        placeholder="Ask AI anything..."
      />
      <Button title="Send" onPress={() => sendMessage(input)} />
    </View>
  );
}
```

---

## Integration Patterns

### Pattern 1: Smart Form Assistance

Use AI to help users fill out forms or create content.

```typescript
// In a gig creation form
const handleAIAssist = async () => {
  const suggestion = await generateSimpleText(
    `Suggest a compelling gig title for: ${category}, budget $${budget}`
  );
  setTitle(suggestion);
};
```

### Pattern 2: Content Quality Scoring

Analyze user-generated content and provide real-time feedback.

```typescript
import { generateStructuredData } from '@/utils/ai-helpers';
import { z } from 'zod';

const scoreGig = async (title: string, description: string) => {
  return await generateStructuredData({
    prompt: `Score this gig listing. Title: "${title}". Description: "${description}"`,
    schema: z.object({
      score: z.number().min(0).max(100),
      feedback: z.array(z.string()),
      improvements: z.array(z.string())
    })
  });
};

// Use in form
const [score, setScore] = useState<number | null>(null);

useEffect(() => {
  if (title && description) {
    scoreGig(title, description).then(result => {
      setScore(result.score);
      // Show feedback
    });
  }
}, [title, description]);
```

### Pattern 3: Smart Matching

Enhance your matching algorithm with AI insights.

```typescript
import { generateStructuredData } from '@/utils/ai-helpers';
import { z } from 'zod';

const getAIMatchScore = async (influencer: any, gig: any) => {
  return await generateStructuredData({
    prompt: `Analyze match quality between:
    Influencer: ${influencer.categories.join(', ')}, ${influencer.followers} followers
    Gig: ${gig.title}, $${gig.price}, ${gig.categories.join(', ')}`,
    schema: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
      suggestions: z.array(z.string())
    })
  });
};

// Combine with existing algorithm
const finalScore = (algorithmScore * 0.7) + (aiScore * 0.3);
```

### Pattern 4: Predictive Analytics

Add predictive features to help users make better decisions.

```typescript
import { predictDealSuccess } from '@/utils/ai-helpers';

const analyzeDealBeforeApplying = async () => {
  const prediction = await predictDealSuccess({
    gigTitle: gig.title,
    budget: gig.price,
    influencerFollowers: user.followers,
    influencerEngagement: user.engagementRate,
    category: gig.categories[0]
  });

  // Show prediction to user before they apply
  if (prediction.successScore > 80) {
    showBanner("This is a great match! High success probability.");
  } else {
    showBanner(`Success score: ${prediction.successScore}/100. ${prediction.improvements[0]?.suggestion}`);
  }
};
```

### Pattern 5: Auto-Generated Content

Generate content for users automatically.

```typescript
import { generateContentIdeas } from '@/utils/ai-helpers';

const getContentIdeas = async () => {
  const ideas = await generateContentIdeas({
    category: user.categories[0],
    platform: 'Instagram',
    audience: 'Fitness enthusiasts aged 18-35',
    brand: selectedBrand
  });

  return ideas.ideas; // Array of content ideas
};

// Display in UI
const [ideas, setIdeas] = useState([]);
useEffect(() => {
  getContentIdeas().then(setIdeas);
}, []);
```

---

## Best Practices

### 1. Error Handling

Always wrap AI calls in try-catch blocks:

```typescript
try {
  const result = await generateSimpleText(prompt);
  // Use result
} catch (error) {
  console.error('AI failed:', error);
  // Provide fallback or user-friendly message
  Alert.alert('AI Unavailable', 'Please try again later');
}
```

### 2. Loading States

Show loading indicators during AI operations:

```typescript
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = async () => {
  setIsGenerating(true);
  try {
    const result = await generateSimpleText(prompt);
    setContent(result);
  } finally {
    setIsGenerating(false);
  }
};
```

### 3. Caching

Cache AI results when appropriate:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: analysis } = useQuery({
  queryKey: ['profile-analysis', userId],
  queryFn: () => analyzeInfluencerProfile(profile),
  staleTime: 1000 * 60 * 60, // Cache for 1 hour
});
```

### 4. Rate Limiting

Debounce AI calls for real-time features:

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedAnalyze = useMemo(
  () => debounce(async (text: string) => {
    const result = await analyzeText(text);
    setAnalysis(result);
  }, 500),
  []
);

// Use in onChange
<TextInput onChangeText={debouncedAnalyze} />
```

### 5. Type Safety

Always use Zod schemas for structured data:

```typescript
import { z } from 'zod';

const responseSchema = z.object({
  title: z.string().min(1).max(100),
  score: z.number().min(0).max(100),
  tags: z.array(z.string()).max(5)
});

type Response = z.infer<typeof responseSchema>;

const result = await generateStructuredData({
  prompt: "...",
  schema: responseSchema
});

// result is fully typed!
console.log(result.title); // TypeScript knows this is a string
```

---

## Advanced Use Cases

### Use Case 1: AI-Powered Search

Natural language search for gigs:

```typescript
import { generateStructuredData } from '@/utils/ai-helpers';
import { z } from 'zod';

async function searchWithNLP(query: string, allGigs: Gig[]) {
  const searchIntent = await generateStructuredData({
    prompt: `Parse this search query: "${query}". Extract filters.`,
    schema: z.object({
      categories: z.array(z.string()),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      location: z.string().optional(),
      keywords: z.array(z.string())
    })
  });

  // Apply filters
  return allGigs.filter(gig => {
    if (searchIntent.categories.length > 0) {
      if (!searchIntent.categories.some(cat => 
        gig.categories.includes(cat)
      )) return false;
    }
    
    if (searchIntent.budgetMin && gig.price < searchIntent.budgetMin) {
      return false;
    }
    
    // ... more filters
    return true;
  });
}

// Usage
const results = await searchWithNLP("fitness gigs under $5000 in LA", allGigs);
```

### Use Case 2: Smart Notifications

Generate personalized notification content:

```typescript
import { generateSimpleText } from '@/utils/ai-helpers';

async function createPersonalizedNotification(user: User, event: Event) {
  const message = await generateSimpleText(
    `Create a friendly notification for ${user.name} (${user.role}) about: ${event.type}. 
    Keep it under 50 characters and action-oriented.`
  );
  
  return {
    title: "New Opportunity!",
    body: message,
    data: { eventId: event.id }
  };
}
```

### Use Case 3: Content Moderation

Automatically moderate user-generated content:

```typescript
import { generateStructuredData } from '@/utils/ai-helpers';
import { z } from 'zod';

async function moderateContent(text: string, images?: string[]) {
  const moderation = await generateStructuredData({
    prompt: `Moderate this content for inappropriate material: "${text}"`,
    schema: z.object({
      safe: z.boolean(),
      issues: z.array(z.string()),
      severity: z.enum(['none', 'low', 'medium', 'high']),
      recommendation: z.enum(['approve', 'flag', 'reject'])
    })
  });

  if (moderation.recommendation === 'reject') {
    throw new Error('Content violates guidelines: ' + moderation.issues.join(', '));
  }

  return moderation.recommendation === 'approve';
}
```

### Use Case 4: Dynamic Pricing

AI-suggested pricing based on market data:

```typescript
import { generateStructuredData } from '@/utils/ai-helpers';
import { z } from 'zod';

async function suggestPrice(params: {
  category: string;
  followers: number;
  engagement: number;
  marketData: any[];
}) {
  return await generateStructuredData({
    prompt: `Suggest pricing for influencer:
    Category: ${params.category}
    Followers: ${params.followers}
    Engagement: ${params.engagement}%
    Market avg: $${params.marketData.reduce((a, b) => a + b.price, 0) / params.marketData.length}`,
    schema: z.object({
      suggested: z.number(),
      min: z.number(),
      max: z.number(),
      reasoning: z.string(),
      marketPosition: z.enum(['budget', 'competitive', 'premium'])
    })
  });
}
```

### Use Case 5: Auto-Contract Generation

Generate complete contracts from deal details:

```typescript
import { generateContractTerms } from '@/utils/ai-helpers';

async function createContract(deal: Deal) {
  const terms = await generateContractTerms({
    dealType: deal.type,
    budget: deal.price,
    deliverables: deal.deliverables,
    timeline: deal.timeline
  });

  // Generate full contract document
  const contract = {
    parties: {
      influencer: deal.influencerName,
      sponsor: deal.sponsorName
    },
    terms: terms,
    signatures: [],
    createdAt: new Date().toISOString()
  };

  return contract;
}
```

---

## Performance Tips

1. **Batch Requests**: If you need multiple AI calls, consider batching them:
   ```typescript
   const [analysis, ideas, price] = await Promise.all([
     analyzeProfile(profile),
     generateContentIdeas(params),
     suggestPrice(params)
   ]);
   ```

2. **Background Processing**: Use mutations for non-blocking AI:
   ```typescript
   const mutation = useMutation({
     mutationFn: (profile) => analyzeInfluencerProfile(profile),
     onSuccess: (data) => {
       // Handle result
     }
   });
   ```

3. **Streaming (Agent)**: For chat, use the agent which streams responses in real-time

4. **Fallbacks**: Always have fallback data in case AI fails:
   ```typescript
   let insights;
   try {
     insights = await generateMarketInsights(data);
   } catch {
     insights = DEFAULT_INSIGHTS; // Pre-defined fallback
   }
   ```

---

## Testing AI Features

### Mock AI Responses

During development, you can mock AI responses:

```typescript
// utils/__mocks__/ai-helpers.ts
export async function generateSimpleText(prompt: string) {
  return "This is a mocked response for: " + prompt;
}

export async function analyzeInfluencerProfile(params: any) {
  return {
    score: 85,
    bioSuggestions: ["Mock suggestion 1", "Mock suggestion 2"],
    // ... other fields
  };
}
```

### Test with Real API

For testing with real API, use small prompts and cache results during development.

---

## API Limits & Costs

Currently, the AI APIs are available without explicit rate limits for development.

In production:
- Consider implementing your own rate limiting
- Cache frequently requested data
- Use debouncing for real-time features
- Monitor usage and optimize prompts

---

## Support & Questions

For questions about AI integration:
1. Check this guide first
2. Review `utils/ai-helpers.ts` for implementation examples
3. See existing AI screens in `app/ai-*.tsx` for patterns
4. Review `app/ai-assistant.tsx` for the agent pattern

All AI functionality is production-ready and can be used throughout the app.

---

## Summary: Available Tools

✅ **Text Generation** - `generateSimpleText()`, `generateTextFromConversation()`
✅ **Structured Data** - `generateStructuredData()`, `generateStructuredDataFromConversation()`
✅ **Image Analysis** - `analyzeImage()`, `describeImage()`
✅ **Image Generation** - `generateImage()` (DALL-E 3)
✅ **Image Editing** - `editImage()` (Gemini 2.5 Flash Image)
✅ **Speech-to-Text** - `transcribeAudio()` (Whisper)
✅ **Chat Agent** - `useRorkAgent()` with tool calling

🚫 **Not Available** - Grok API (use built-in models instead)

---

Happy building! 🚀
