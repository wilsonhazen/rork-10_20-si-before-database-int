# AI API Quick Reference

Quick reference for developers integrating AI features.

## Import Statement
```typescript
import { 
  generateSimpleText,
  generateStructuredData,
  analyzeImage,
  generateImage,
  editImage,
  transcribeAudio,
  useRorkAgent,
  createRorkTool,
  // Specialized helpers
  analyzeGig,
  analyzeInfluencerProfile,
  generateContractTerms,
  generateContentIdeas,
  predictDealSuccess,
  generateMarketInsights
} from '@/utils/ai-helpers';

import { z } from 'zod';
```

---

## API Models Used

| Feature | Model | Provider |
|---------|-------|----------|
| Text Generation | GPT-4 class | Rork Toolkit |
| Structured Data | GPT-4 class | Rork Toolkit |
| Image Generation | DALL-E 3 | OpenAI |
| Image Editing | Gemini 2.5 Flash Image | Google |
| Speech-to-Text | Whisper | OpenAI |
| Chat Agent | GPT-4 class | Rork Toolkit |

**Note:** Grok is **NOT** available. Use the models above.

---

## Quick Examples

### 1. Simple Text
```typescript
const text = await generateSimpleText("Write an Instagram caption");
```

### 2. Structured Response
```typescript
const result = await generateStructuredData({
  prompt: "Analyze this profile...",
  schema: z.object({
    score: z.number(),
    feedback: z.array(z.string())
  })
});
```

### 3. Analyze Image
```typescript
const analysis = await analyzeImage({
  imageUri: 'data:image/jpeg;base64,...',
  prompt: "What's in this image?",
  schema: z.object({
    subject: z.string(),
    quality: z.number()
  })
});
```

### 4. Generate Image
```typescript
const img = await generateImage({
  prompt: "A fitness Instagram post",
  size: "1024x1024"
});

<Image source={{ uri: `data:${img.mimeType};base64,${img.base64Data}` }} />
```

### 5. Edit Image
```typescript
const edited = await editImage({
  prompt: "Make brighter",
  images: [{ type: 'image', image: base64Image }],
  aspectRatio: "16:9"
});
```

### 6. Speech-to-Text
```typescript
const formData = new FormData();
formData.append('audio', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);
const result = await transcribeAudio(formData);
console.log(result.text);
```

### 7. Chat Agent
```typescript
const { messages, sendMessage } = useRorkAgent({
  tools: {
    myTool: createRorkTool({
      description: "Does something",
      zodSchema: z.object({ name: z.string() }),
      execute: (input) => {
        console.log(input.name);
        return "Done!";
      }
    })
  }
});
```

---

## Specialized Helpers

### Analyze Gig
```typescript
const analysis = await analyzeGig({
  title: "Instagram Campaign",
  description: "...",
  budget: 5000,
  category: "Fitness"
});
// Returns: score, strengths, improvements, suggestedBudgetRange, targetInfluencerProfile
```

### Analyze Influencer Profile
```typescript
const analysis = await analyzeInfluencerProfile({
  bio: "...",
  categories: ["Fitness"],
  followers: 50000,
  engagementRate: 5.2,
  ratePerPost: 500
});
// Returns: score, bioSuggestions, categorySuggestions, pricingSuggestion, strengthsToHighlight, areasToImprove
```

### Generate Contract Terms
```typescript
const terms = await generateContractTerms({
  dealType: "Instagram Campaign",
  budget: 5000,
  deliverables: ["3 posts", "2 stories"],
  timeline: "2 weeks"
});
// Returns: paymentTerms, deliverySchedule, contentRights, cancellationPolicy, revisionPolicy, additionalClauses
```

### Generate Content Ideas
```typescript
const ideas = await generateContentIdeas({
  category: "Fitness",
  platform: "Instagram",
  audience: "Young adults",
  brand: "Nike" // optional
});
// Returns: { ideas: [{ title, description, format, estimatedEngagement, difficulty, tips }] }
```

### Predict Deal Success
```typescript
const prediction = await predictDealSuccess({
  gigTitle: "Fitness Campaign",
  budget: 5000,
  influencerFollowers: 50000,
  influencerEngagement: 5.2,
  category: "Fitness",
  historicalData: {
    totalDeals: 10,
    completedDeals: 8,
    cancelledDeals: 1
  }
});
// Returns: successScore, likelihood, strengths, risks, improvements, estimatedTimeline, confidenceLevel
```

### Generate Market Insights
```typescript
const insights = await generateMarketInsights({
  userRole: "influencer",
  dealStats: { total: 10, completed: 8, active: 2 },
  marketData: { totalGigs: 100, avgBudget: 3000 }
});
// Returns: insights[], predictions[], trends[]
```

---

## Error Handling Pattern

```typescript
try {
  const result = await generateSimpleText(prompt);
  // Use result
} catch (error) {
  console.error('AI failed:', error);
  // Show fallback UI
  Alert.alert('Error', 'AI is temporarily unavailable');
}
```

---

## Loading State Pattern

```typescript
const [loading, setLoading] = useState(false);

const handleGenerate = async () => {
  setLoading(true);
  try {
    const result = await generateSimpleText(prompt);
    setContent(result);
  } finally {
    setLoading(false);
  }
};
```

---

## Caching Pattern

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['ai-analysis', profileId],
  queryFn: () => analyzeInfluencerProfile(profile),
  staleTime: 1000 * 60 * 60, // 1 hour
});
```

---

## Debouncing Pattern

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedAnalyze = useMemo(
  () => debounce(async (text) => {
    const result = await generateSimpleText(`Analyze: ${text}`);
    setAnalysis(result);
  }, 500),
  []
);
```

---

## Image Sizes (Generation)
- `1024x1024` - Square
- `1024x1536` - Portrait
- `1536x1024` - Landscape
- `1024x1792` - Tall portrait
- `1792x1024` - Wide landscape

## Aspect Ratios (Editing)
- `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`
- `9:16`, `16:9`, `21:9`

---

## Audio Formats (STT)
Supported: `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm`

### Recording Setup
```typescript
import { Audio } from 'expo-av';

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
```

---

## Zod Schema Examples

### Basic Types
```typescript
z.string()
z.number()
z.boolean()
z.array(z.string())
z.enum(['option1', 'option2'])
```

### Objects
```typescript
z.object({
  name: z.string(),
  age: z.number(),
  tags: z.array(z.string())
})
```

### Validation
```typescript
z.string().min(1).max(100)
z.number().min(0).max(100)
z.array(z.string()).min(1).max(5)
```

### Optional
```typescript
z.string().optional()
z.number().nullable()
```

### Descriptions (helps AI)
```typescript
z.string().describe("User's full name")
z.number().describe("Price in USD")
```

---

## Common Prompts

### Profile Analysis
```
"Analyze this influencer profile and provide optimization suggestions..."
```

### Content Generation
```
"Generate 5 Instagram caption ideas for a fitness post about..."
```

### Deal Prediction
```
"Predict the success of this deal based on: budget, followers, engagement..."
```

### Image Analysis
```
"Analyze this image and tell me: subject, mood, quality (1-10), and suggestions"
```

### Contract Terms
```
"Generate fair contract terms for: deliverables, timeline, budget..."
```

---

## Where to Add AI Features

1. **Search** - Natural language search with `generateStructuredData()`
2. **Profile** - Auto-complete bio with `generateSimpleText()`
3. **Gigs** - Score quality with `analyzeGig()`
4. **Applications** - Predict success with `predictDealSuccess()`
5. **Content** - Generate ideas with `generateContentIdeas()`
6. **Contracts** - Auto-generate with `generateContractTerms()`
7. **Images** - Analyze/edit with `analyzeImage()` / `editImage()`
8. **Voice** - Transcribe with `transcribeAudio()`
9. **Chat** - AI assistant with `useRorkAgent()`

---

## Full Documentation

See `AI_INTEGRATION_GUIDE.md` for complete examples and patterns.

---

## Important Notes

✅ All APIs are production-ready
✅ No Grok - use built-in models
✅ TypeScript types included
✅ Error handling required
✅ Loading states recommended
✅ Caching improves UX
✅ Debounce real-time features

🚫 Don't use Grok API (not available)
🚫 Don't skip error handling
🚫 Don't skip loading states
🚫 Don't make synchronous calls (always async/await)
