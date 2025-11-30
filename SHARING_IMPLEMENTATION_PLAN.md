# Sharing Feature - Implementation Plan

## Current State

✅ **What's Working:**
- Sharing functionality exists in the app
- Users can share referral codes, profiles, and gigs
- Native share dialogs work on iOS/Android

❌ **What's Broken:**
- Links point to non-existent websites:
  - `https://famematch.app/ref/{code}` (agent-dashboard.tsx)
  - `https://sourceimpact.app/profile/{userId}` (utils/sharing.ts)
  - `https://sourceimpact.app/gig/{gigId}` (utils/sharing.ts)
- No tracking of link clicks, installs, or conversions
- No landing page for users who don't have the app installed
- Deep links won't work without proper configuration

## What Was Changed

✅ **Updated Files:**

1. **utils/sharing.ts** - Made domain configurable
   - Now uses `process.env.EXPO_PUBLIC_WEB_URL`
   - Falls back to `https://sourceimpact.app` if not set
   - Consistent URL format across all sharing functions
   - Better logging for debugging

2. **SHARING_AND_DEEP_LINKING_SOLUTION.md** - Complete guide
   - 3 implementation options (Landing Page, Backend API, Third-Party)
   - Step-by-step instructions
   - Cost breakdown
   - Code examples

## To Make It Work - Quick Start (Option 1)

### Step 1: Get a Domain (1 day)
```bash
# Buy a domain from:
- Namecheap.com ($8-15/year)
- Google Domains ($12/year)
- Or use existing domain

# Recommendation: yourbrand.app or yourbrand.co
```

### Step 2: Create Landing Pages (2-3 days)

**Option A: Next.js (Recommended)**
```bash
npx create-next-app@latest landing-pages
cd landing-pages

# Create pages:
# - pages/ref/[code].tsx
# - pages/profile/[userId].tsx  
# - pages/gig/[gigId].tsx

# Deploy to Vercel (free)
vercel deploy
```

**Option B: Simple Static HTML**
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>SourceImpact - Join Now</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    // Try to open app
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      const appUrl = `sourceimpact://signup?ref=${ref}`;
      window.location.href = appUrl;
      
      // Show landing page after 1.5s if app not installed
      setTimeout(() => {
        document.getElementById('landing').style.display = 'block';
      }, 1500);
    }
  </script>
</head>
<body>
  <div id="landing" style="display:none; text-align:center; padding:40px;">
    <h1>Join SourceImpact</h1>
    <p>Connect with brands and influencers</p>
    <a href="https://apps.apple.com/YOUR_APP_ID">
      <button>Download on App Store</button>
    </a>
    <a href="https://play.google.com/store/apps/details?id=YOUR_PACKAGE">
      <button>Get it on Google Play</button>
    </a>
  </div>
</body>
</html>
```

### Step 3: Configure Your Domain

Point your domain to your landing page host:
- Vercel: Add CNAME record → `cname.vercel-dns.com`
- Netlify: Add CNAME record → `your-site.netlify.app`
- GitHub Pages: Add CNAME record → `yourusername.github.io`

### Step 4: Set Environment Variable

Create `.env.local` in your Expo project:
```bash
EXPO_PUBLIC_WEB_URL=https://yourdomain.com
```

### Step 5: Configure Deep Links in app.json

```json
{
  "expo": {
    "scheme": "sourceimpact",
    "ios": {
      "bundleIdentifier": "app.rork.infludeal-influencer-marketplace-bbh7xptw-v77krl3p",
      "associatedDomains": ["applinks:yourdomain.com"]
    },
    "android": {
      "package": "app.rork.infludeal_influencer_marketplace_bbh7xptw_v77krl3p",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "yourdomain.com",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Step 6: Add Universal Link Files

Host these files on your domain:

**/.well-known/apple-app-site-association** (for iOS):
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.app.rork.infludeal-influencer-marketplace-bbh7xptw-v77krl3p",
        "paths": ["*"]
      }
    ]
  }
}
```

**/.well-known/assetlinks.json** (for Android):
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.rork.infludeal_influencer_marketplace_bbh7xptw_v77krl3p",
    "sha256_cert_fingerprints": ["GET_FROM_PLAY_CONSOLE"]
  }
}]
```

### Step 7: Handle Deep Links in App

Create `app/_layout.tsx` deep link handler:
```typescript
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();
  
  useEffect(() => {
    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL changes
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const { hostname, path, queryParams } = Linking.parse(url);
    
    console.log('[Deep Link]', { hostname, path, queryParams });
    
    // Handle referral links
    if (path === 'ref' || queryParams?.ref) {
      const refCode = queryParams.ref;
      AsyncStorage.setItem('referral_code', refCode);
      router.push(`/onboarding?ref=${refCode}`);
    }
    
    // Handle profile links
    if (path?.includes('profile/')) {
      const userId = path.split('/')[1];
      router.push(`/view-profile?userId=${userId}`);
    }
    
    // Handle gig links
    if (path?.includes('gig/')) {
      const gigId = path.split('/')[1];
      router.push(`/gig-details?id=${gigId}`);
    }
  };

  return (
    // Your existing layout
  );
}
```

### Step 8: Track Referrals

Update `app/onboarding.tsx`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

export default function Onboarding() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  
  useEffect(() => {
    // Check for referral code from deep link
    const checkReferral = async () => {
      const refCode = ref || await AsyncStorage.getItem('referral_code');
      
      if (refCode) {
        console.log('[Referral] User came from:', refCode);
        
        // TODO: When you have backend, track this:
        // await trackReferralClick(refCode);
        
        // Store for later when user signs up
        setReferralCode(refCode);
      }
    };
    
    checkReferral();
  }, [ref]);
  
  // Rest of your onboarding...
}
```

## Testing the Flow

### Test 1: Share Link
1. Open app
2. Go to Agent Dashboard
3. Generate referral link
4. Share via WhatsApp/SMS
5. Check link format: `https://yourdomain.com/ref/ABC123` ✅

### Test 2: Click Link (App Installed)
1. Click shared link on device with app installed
2. App should open automatically
3. User lands on onboarding with `?ref=ABC123`
4. Referral code is stored ✅

### Test 3: Click Link (App NOT Installed)
1. Click shared link on device without app
2. Landing page loads in browser
3. Shows "Download App" buttons
4. User clicks download → goes to App Store/Play Store ✅

### Test 4: Deep Link Formats
Test these URLs work:
- `https://yourdomain.com/ref/ABC123`
- `https://yourdomain.com/profile/user-id-123`
- `https://yourdomain.com/gig/gig-id-456`
- `sourceimpact://signup?ref=ABC123` (custom scheme)

## Backend APIs to Build Later

When you're ready for full tracking:

```typescript
// 1. Track link click
POST /api/tracking/click
{
  linkType: 'referral' | 'profile' | 'gig',
  targetId: string,
  referralCode?: string,
  userAgent: string,
  ip: string
}

// 2. Track app install
POST /api/tracking/install
{
  referralCode: string,
  deviceId: string,
  platform: 'ios' | 'android'
}

// 3. Track signup conversion
POST /api/tracking/conversion
{
  referralCode: string,
  newUserId: string
}

// 4. Get analytics
GET /api/agents/{agentId}/referral-analytics
Response: {
  totalShares: 150,
  clicks: 450,
  installs: 120,
  signups: 67,
  conversionRate: 14.9,
  topLinks: [...],
  timeline: [...]
}
```

## Cost Summary

### MVP (Option 1 - Landing Page):
- Domain: **$12/year**
- Hosting: **FREE** (Vercel/Netlify)
- Total: **~$1/month**

### Production (Option 2 - Full Tracking):
- Domain: $12/year
- Backend: $5-25/month (Railway/Render)
- Database: FREE tier or $5/month
- Total: **$10-35/month**

### Third-Party (Option 3 - Branch.io):
- FREE up to 10K monthly active users
- Then $199+/month

## Recommended Path

1. **Week 1:** Get domain + create landing pages → **Cost: $12**
2. **Week 2:** Configure deep links + test
3. **Week 3:** Soft launch + monitor
4. **Month 2:** Add backend tracking when you have users

## Files That Need Updates

When you get your domain:

1. ✅ `utils/sharing.ts` - Already updated to use env var
2. ⏳ `app.json` - Add your domain to `associatedDomains` and `intentFilters`
3. ⏳ `.env.local` - Add `EXPO_PUBLIC_WEB_URL=https://yourdomain.com`
4. ⏳ `app/agent-dashboard.tsx` - Update hardcoded `famematch.app` URLs (lines 59, 66, 76, 98)
5. ⏳ `contexts/InviteContext.tsx` - Update `generateReferralLink` function (line 722)

## Ready to Start?

Pick your domain name and let me know. I can:
1. Create the landing page templates for you
2. Update all the hardcoded URLs in the app
3. Set up the deep link configuration
4. Create the tracking API specs

The fastest path is Option 1 (Landing Page) - can be done in 2-3 days for ~$12.
