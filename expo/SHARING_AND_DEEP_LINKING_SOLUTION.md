# Sharing & Deep Linking Solution

## Problem
The app currently shares links to non-existent websites (`famematch.app`, `sourceimpact.app`) for tracking referrals, profiles, and gigs. These links don't work because:
1. No website exists to receive these links
2. No backend tracking is set up
3. Deep links don't redirect properly

## Solution Architecture

### Option 1: Landing Page + Deep Links (Recommended for MVP)
**Best for**: Quick launch without complex backend

#### What You Need:
1. **Simple Landing Page** (Static hosting - Vercel/Netlify - FREE)
   - Domain: `yourdomain.com`
   - Pages needed:
     - `/ref/[code]` - Referral landing page
     - `/profile/[userId]` - Profile preview page
     - `/gig/[gigId]` - Gig preview page
   
2. **Deep Link Configuration** (Already in app.json)
   - Universal Links (iOS): Automatically opens app if installed
   - App Links (Android): Automatically opens app if installed
   - Falls back to website if app not installed

#### How It Works:
```
User shares link → https://yourdomain.com/ref/ABC123
                 ↓
User clicks link → Is app installed?
                 ↓                    ↓
               Yes                   No
                 ↓                    ↓
         Open app directly    Show landing page with:
         with referral code    - App Store/Play Store links
                              - Preview of what they'll get
                              - "Open in app" button
```

#### Implementation Steps:

**1. Register Your Domain**
- Buy domain: Namecheap, Google Domains ($10-15/year)
- Recommended: Keep it short and memorable

**2. Create Landing Pages** (Next.js/simple HTML)

```typescript
// Example: pages/ref/[code].tsx
export default function ReferralPage({ code, referralData }) {
  useEffect(() => {
    // Try to open app with deep link
    const appUrl = `sourceimpact://signup?ref=${code}`;
    window.location.href = appUrl;
    
    // After 1.5s, if still on page (app not installed), show landing page
    setTimeout(() => {
      setShowLanding(true);
    }, 1500);
  }, []);

  return (
    <div>
      <h1>Join SourceImpact</h1>
      <p>You've been invited by {referralData.agentName}</p>
      <button onClick={() => window.location.href = 'https://apps.apple.com/...'}>
        Download on App Store
      </button>
      <button onClick={() => window.location.href = 'https://play.google.com/...'}>
        Get it on Google Play
      </button>
    </div>
  );
}

// Fetch referral data from your backend
export async function getServerSideProps({ params }) {
  const referralData = await fetchReferralData(params.code);
  return { props: { code: params.code, referralData } };
}
```

**3. Configure Universal Links**

Add to your `app.json`:
```json
{
  "expo": {
    "scheme": "sourceimpact",
    "ios": {
      "associatedDomains": ["applinks:yourdomain.com"]
    },
    "android": {
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

**4. Host Apple App Site Association File**
```
yourdomain.com/.well-known/apple-app-site-association
```
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.app.rork.your-bundle-id",
        "paths": ["*"]
      }
    ]
  }
}
```

**5. Host Android Asset Links**
```
yourdomain.com/.well-known/assetlinks.json
```
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.rork.your_package_name",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

**6. Update App Code to Handle Deep Links**

Create `app/+linking.ts`:
```typescript
import * as Linking from 'expo-linking';

export default {
  prefixes: [
    'sourceimpact://',
    'https://yourdomain.com',
  ],
  config: {
    screens: {
      onboarding: {
        path: 'signup',
        parse: {
          ref: (ref: string) => ref,
        },
      },
      'view-profile': {
        path: 'profile/:userId',
      },
      'gig-details': {
        path: 'gig/:id',
      },
    },
  },
};
```

**7. Track Referrals in App**

Update `app/onboarding.tsx`:
```typescript
import { useLocalSearchParams } from 'expo-router';

export default function Onboarding() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  
  useEffect(() => {
    if (ref) {
      // Store referral code
      AsyncStorage.setItem('referral_code', ref);
      console.log('User came from referral:', ref);
      
      // Send tracking event to your analytics
      trackReferralClick(ref);
    }
  }, [ref]);
  
  // Rest of onboarding...
}
```

---

### Option 2: Backend API + Link Shortener (Production Ready)
**Best for**: Detailed analytics and tracking

#### Architecture:
```
Share link → api.yourdomain.com/r/ABC123
           ↓
API logs visit → Redirects to app/website based on device
           ↓
Tracks: clicks, installs, conversions
```

#### What You Need:
1. Backend service (Node.js/Express, Python/Flask)
2. Database (PostgreSQL/MongoDB) to track:
   - Link clicks
   - User agent (iOS/Android/Web)
   - Install conversions
   - Referral completion
3. Redis for fast redirects

#### Backend API Endpoints Needed:
```typescript
// Create trackable link
POST /api/links/create
{
  type: 'referral' | 'profile' | 'gig',
  targetId: string,
  creatorId: string
}
Response: { shortUrl: 'https://api.yourdomain.com/r/ABC123' }

// Track link click and redirect
GET /r/{code}
- Log visit (IP, user agent, timestamp)
- Detect device (iOS/Android/Web)
- Redirect to appropriate destination

// Get link analytics
GET /api/links/{code}/analytics
Response: {
  clicks: 145,
  uniqueClicks: 89,
  installs: 23,
  conversions: 12,
  devices: { ios: 60, android: 40, web: 0 },
  timeline: [...]
}
```

#### Implementation:
```javascript
// Example backend route
app.get('/r/:code', async (req, res) => {
  const { code } = req.params;
  
  // Log the click
  await db.linkClicks.create({
    code,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });
  
  // Get link data
  const link = await db.links.findOne({ code });
  
  // Detect device
  const userAgent = req.headers['user-agent'];
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  // Build redirect URL
  let redirectUrl;
  if (isIOS || isAndroid) {
    // Try to open app
    redirectUrl = `sourceimpact://${link.path}?code=${code}`;
  } else {
    // Redirect to landing page
    redirectUrl = `https://yourdomain.com/${link.path}?code=${code}`;
  }
  
  res.redirect(redirectUrl);
});
```

---

### Option 3: Third-Party Services (Fastest Setup)
**Best for**: Quick launch with analytics

Use services like:
1. **Branch.io** (Free tier available)
   - Deep linking
   - Attribution tracking
   - Analytics dashboard
   
2. **Firebase Dynamic Links** (Free)
   - Simple setup
   - Good analytics
   - Google integration

#### Branch.io Setup:
```typescript
import branch from 'react-native-branch';

// Create shareable link
async function createShareLink(type: 'referral' | 'profile' | 'gig', id: string) {
  const branchUniversalObject = await branch.createBranchUniversalObject(
    `${type}/${id}`,
    {
      title: 'Join SourceImpact',
      contentDescription: 'Connect with brands and influencers',
      contentImageUrl: 'https://yourcdn.com/image.jpg',
    }
  );

  const linkProperties = {
    feature: type,
    channel: 'sharing',
  };

  const { url } = await branchUniversalObject.generateShortUrl(
    linkProperties,
    { $desktop_url: `https://yourdomain.com/${type}/${id}` }
  );

  return url; // Returns: https://yourapp.app.link/ABC123
}

// Handle incoming links
useEffect(() => {
  branch.subscribe(({ error, params }) => {
    if (error) {
      console.error('Branch error:', error);
      return;
    }

    if (params['+clicked_branch_link']) {
      // User clicked a Branch link
      const referralCode = params.referralCode;
      const type = params.feature;
      
      // Navigate appropriately
      if (type === 'referral') {
        router.push(`/onboarding?ref=${referralCode}`);
      }
    }
  });
}, []);
```

---

## Recommended Approach

For your first version, I recommend **Option 1** (Landing Page + Deep Links) because:

1. ✅ **Low Cost**: Static hosting is free (Vercel/Netlify)
2. ✅ **Quick Setup**: Can be done in 1-2 days
3. ✅ **Good UX**: Works seamlessly for users
4. ✅ **Tracking**: Can add basic analytics (Google Analytics, Plausible)
5. ✅ **Scalable**: Easy to upgrade to Option 2 later

### Quick Start Checklist:

- [ ] Register domain ($10-15/year)
- [ ] Create Next.js app with 3 pages:
  - `/ref/[code]` - Referral landing
  - `/profile/[userId]` - Profile preview
  - `/gig/[gigId]` - Gig preview
- [ ] Deploy to Vercel (free)
- [ ] Configure Universal Links (iOS) and App Links (Android)
- [ ] Update app.json with domain
- [ ] Update sharing.ts to use real domain
- [ ] Test deep links on iOS and Android
- [ ] Add basic tracking (Google Analytics)

---

## What to Build in Backend (When Ready)

When you're ready to add full tracking, create these endpoints:

```typescript
// 1. Log referral clicks
POST /api/tracking/referral-click
{ referralCode: string, source: string }

// 2. Log app installs from referral
POST /api/tracking/referral-install
{ referralCode: string, deviceId: string }

// 3. Log referral conversion (user signed up)
POST /api/tracking/referral-conversion
{ referralCode: string, newUserId: string }

// 4. Get referral analytics for agent
GET /api/agents/{agentId}/referral-stats
Response: {
  totalShares: 120,
  clicks: 456,
  installs: 89,
  signups: 45,
  conversions: 23,
  conversionRate: 5.0
}
```

---

## Cost Breakdown

### Option 1 (Recommended):
- Domain: $10-15/year
- Hosting: FREE (Vercel/Netlify)
- **Total: ~$15/year**

### Option 2:
- Domain: $10-15/year
- Backend hosting: $5-25/month (Railway, Render, Digital Ocean)
- Database: $5-10/month or FREE tier
- **Total: ~$15 + $120-420/year**

### Option 3:
- Branch.io: FREE up to 10K MAU, then $199+/month
- Firebase: FREE up to 10K clicks/day
- **Total: FREE to start**

---

## Next Steps

1. **Choose your domain name** (make it short and memorable)
2. **Set up the landing pages** (I can help build these)
3. **Update app configuration** for deep linking
4. **Test the flow** on real devices
5. **Add analytics** to track performance

Would you like me to:
1. Update the sharing.ts file with a configurable domain?
2. Create the landing page templates?
3. Set up the deep link handling in the app?
4. Create the backend API specification?
