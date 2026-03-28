# Backend API Specification

## Overview
Source Impact is an influencer marketing platform that connects brands (sponsors), influencers, and agents. This document provides complete API specifications for backend implementation.

**Base URL**: `https://api.sourceimpact.app/v1`  
**Authentication**: JWT Bearer tokens  
**Response Format**: JSON

---

## Table of Contents
1. [Authentication](#authentication)
2. [Users & Profiles](#users--profiles)
3. [Gigs Management](#gigs-management)
4. [Deals & Applications](#deals--applications)
5. [Messaging](#messaging)
6. [Payments & Escrow](#payments--escrow)
7. [Agent System](#agent-system)
8. [Rewards System](#rewards-system)
9. [Wallet & Crypto](#wallet--crypto)
10. [Matching Algorithm](#matching-algorithm)
11. [Analytics](#analytics)
12. [Notifications](#notifications)

---

## Authentication

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (min 8 chars, required)",
  "name": "string (required)",
  "role": "influencer | sponsor | agent | admin",
  "referralCode": "string (optional)"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "createdAt": "ISO 8601"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

---

### POST /auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": { /* user object */ },
  "accessToken": "string",
  "refreshToken": "string"
}
```

---

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

---

### POST /auth/logout
Invalidate tokens.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Users & Profiles

### GET /users/{userId}
Get user profile by ID.

**Response (200):**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "influencer | sponsor | agent | admin",
  "avatar": "string (URL)",
  "createdAt": "ISO 8601",
  "isActive": "boolean",
  "referralCode": "string",
  "rating": "number (0-5)",
  "reviewCount": "number",
  // Role-specific fields below
}
```

**Influencer-specific fields:**
```json
{
  "bio": "string",
  "influencerType": "string",
  "sports": ["string"],
  "categories": ["string"],
  "location": "string",
  "followers": "number",
  "engagementRate": "number",
  "platforms": {
    "instagram": "string",
    "tiktok": "string",
    "youtube": "string",
    "twitter": "string"
  },
  "socialAccounts": [
    {
      "platform": "instagram",
      "username": "string",
      "url": "string",
      "followers": "number",
      "isVerified": "boolean",
      "verifiedAt": "ISO 8601",
      "lastSynced": "ISO 8601"
    }
  ],
  "portfolio": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "imageUrl": "string",
      "metrics": {
        "views": "number",
        "likes": "number",
        "comments": "number"
      }
    }
  ],
  "ratePerPost": "number",
  "paymentPreferences": ["fiat", "crypto"],
  "acceptedCryptos": ["BTC", "ETH", "USDT", "USDC"]
}
```

**Sponsor-specific fields:**
```json
{
  "company": "string",
  "industry": "string",
  "location": "string",
  "website": "string",
  "description": "string"
}
```

**Agent-specific fields:**
```json
{
  "bio": "string",
  "specialties": ["string"],
  "isSubscribed": "boolean",
  "subscriptionExpiry": "ISO 8601",
  "totalEarnings": "number",
  "recruits": ["userId"],
  "tier": "bronze | silver | gold | platinum",
  "performanceMetrics": {
    "totalDeals": "number",
    "totalReferrals": "number",
    "verifiedReferrals": "number",
    "totalEarnings": "number",
    "averageConversionTime": "number (days)",
    "responseTime": "number (hours)",
    "satisfactionScore": "number (0-5)",
    "performanceScore": "number",
    "lastCalculatedAt": "ISO 8601"
  }
}
```

---

### PUT /users/{userId}
Update user profile.

**Request Body:** (partial update allowed)
```json
{
  "name": "string",
  "bio": "string",
  "location": "string",
  // Other profile fields
}
```

**Response (200):** Updated user object

---

### POST /users/{userId}/verify-social
Verify social media account ownership.

**Request Body:**
```json
{
  "platform": "instagram | tiktok | youtube | twitter",
  "username": "string",
  "url": "string"
}
```

**Response (200):**
```json
{
  "verificationId": "string",
  "verificationCode": "string",
  "instructions": "string",
  "expiresAt": "ISO 8601"
}
```

---

### POST /users/{userId}/confirm-social-verification
Confirm social media verification.

**Request Body:**
```json
{
  "verificationId": "string"
}
```

**Response (200):**
```json
{
  "socialAccount": {
    "platform": "string",
    "username": "string",
    "url": "string",
    "followers": "number",
    "isVerified": true,
    "verifiedAt": "ISO 8601"
  }
}
```

---

## Gigs Management

### POST /gigs
Create a new gig (Sponsor only).

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "budget": {
    "min": "number (required)",
    "max": "number (required)"
  },
  "categories": ["string"],
  "influencerTypes": ["string"],
  "athleteSports": ["string"],
  "location": "string",
  "requirements": ["string"],
  "deliverables": ["string"],
  "deadline": "ISO 8601"
}
```

**Response (201):**
```json
{
  "id": "string",
  "sponsorId": "string",
  "sponsorName": "string",
  "sponsorAvatar": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "budget": { "min": "number", "max": "number" },
  "categories": ["string"],
  "influencerTypes": ["string"],
  "athleteSports": ["string"],
  "location": "string",
  "requirements": ["string"],
  "deliverables": ["string"],
  "deadline": "ISO 8601",
  "status": "open",
  "createdAt": "ISO 8601"
}
```

---

### GET /gigs
Get list of gigs.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string: open | in_progress | completed | cancelled)
- `categories` (comma-separated strings)
- `influencerTypes` (comma-separated strings)
- `minBudget` (number)
- `maxBudget` (number)
- `location` (string)
- `sponsorId` (string)
- `search` (string, searches in title & description)

**Response (200):**
```json
{
  "gigs": [/* array of gig objects */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### GET /gigs/{gigId}
Get gig details.

**Response (200):** Single gig object with applicant count

---

### PUT /gigs/{gigId}
Update gig (Sponsor only, own gig).

**Request Body:** (partial update)
```json
{
  "title": "string",
  "description": "string",
  "status": "open | in_progress | completed | cancelled"
}
```

**Response (200):** Updated gig object

---

### DELETE /gigs/{gigId}
Delete gig (Sponsor only, own gig).

**Response (204):** No content

---

### GET /gigs/{gigId}/applicants
Get list of applicants for a gig (Sponsor only).

**Query Parameters:**
- `status` (string: pending | approved | rejected)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "applications": [
    {
      "id": "string",
      "gigId": "string",
      "influencerId": "string",
      "influencerName": "string",
      "influencerAvatar": "string",
      "influencerProfile": { /* full influencer profile */ },
      "status": "pending | approved | rejected",
      "appliedAt": "ISO 8601",
      "reviewedAt": "ISO 8601",
      "message": "string"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

## Deals & Applications

### POST /applications
Apply to a gig (Influencer only).

**Request Body:**
```json
{
  "gigId": "string (required)",
  "message": "string (optional, pitch message)"
}
```

**Response (201):**
```json
{
  "id": "string",
  "gigId": "string",
  "influencerId": "string",
  "influencerName": "string",
  "influencerAvatar": "string",
  "status": "pending",
  "appliedAt": "ISO 8601",
  "message": "string"
}
```

---

### GET /applications
Get user's applications.

**Query Parameters:**
- `status` (string: pending | approved | rejected)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "applications": [/* array of application objects with gig details */],
  "pagination": { /* pagination object */ }
}
```

---

### PUT /applications/{applicationId}
Update application status (Sponsor only).

**Request Body:**
```json
{
  "status": "approved | rejected"
}
```

**Response (200):** Updated application object

**Side Effects:**
- If approved, creates a Deal object
- Sends notification to influencer
- If agent is attributed to either party, creates commission record

---

### GET /deals
Get user's deals.

**Query Parameters:**
- `status` (string: pending | active | completed | cancelled)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "deals": [
    {
      "id": "string",
      "gigId": "string",
      "gigTitle": "string",
      "influencerId": "string",
      "influencerName": "string",
      "influencerAvatar": "string",
      "sponsorId": "string",
      "sponsorName": "string",
      "sponsorAvatar": "string",
      "agentId": "string",
      "agentName": "string",
      "amount": "number",
      "agentCommission": "number",
      "status": "pending | active | completed | cancelled",
      "createdAt": "ISO 8601",
      "completedAt": "ISO 8601",
      "paymentMethod": "stripe | coinbase",
      "contractHash": "string"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### GET /deals/{dealId}
Get deal details.

**Response (200):** Single deal object with full gig and user details

---

### PUT /deals/{dealId}
Update deal status.

**Request Body:**
```json
{
  "status": "active | completed | cancelled"
}
```

**Response (200):** Updated deal object

---

## Messaging

### GET /conversations
Get user's conversations.

**Query Parameters:**
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "string",
      "participants": ["userId"],
      "participantNames": ["string"],
      "participantAvatars": ["string"],
      "lastMessage": {
        "id": "string",
        "conversationId": "string",
        "senderId": "string",
        "senderName": "string",
        "senderAvatar": "string",
        "content": "string",
        "timestamp": "ISO 8601",
        "read": "boolean"
      },
      "unreadCount": "number",
      "dealId": "string"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### POST /conversations
Create a new conversation.

**Request Body:**
```json
{
  "participantIds": ["userId"],
  "dealId": "string (optional)"
}
```

**Response (201):** Conversation object

---

### GET /conversations/{conversationId}/messages
Get messages in a conversation.

**Query Parameters:**
- `before` (ISO 8601, get messages before this timestamp)
- `limit` (number, default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "string",
      "conversationId": "string",
      "senderId": "string",
      "senderName": "string",
      "senderAvatar": "string",
      "content": "string",
      "timestamp": "ISO 8601",
      "read": "boolean"
    }
  ],
  "hasMore": "boolean"
}
```

---

### POST /conversations/{conversationId}/messages
Send a message.

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response (201):** Message object

**Side Effects:**
- Increments unreadCount for other participants
- Triggers push notification to participants
- Triggers WebSocket message to connected participants

---

### PUT /conversations/{conversationId}/read
Mark conversation as read.

**Response (200):**
```json
{
  "conversationId": "string",
  "unreadCount": 0
}
```

---

## Payments & Escrow

### POST /payments/escrow/lock
Lock funds in escrow for a deal (Sponsor only).

**Request Body:**
```json
{
  "gigId": "string (required)",
  "applicationId": "string (required)",
  "amount": "number (required)",
  "currency": "usd | btc | eth (default: usd)",
  "paymentMethodId": "string (Stripe payment method ID)"
}
```

**Response (200):**
```json
{
  "escrowJob": {
    "id": "string",
    "gigId": "string",
    "applicationId": "string",
    "sponsorId": "string",
    "influencerId": "string",
    "amount": "number",
    "currency": "string",
    "status": "locked",
    "lockedAt": "ISO 8601",
    "sponsorAgentId": "string",
    "influencerAgentId": "string",
    "stripePaymentIntentId": "string"
  }
}
```

**Business Logic:**
- Validates sponsor has sufficient balance or payment method
- Charges sponsor: `amount + (amount * 0.10)` (10% platform fee)
- Creates escrow job with status "locked"
- Sends notifications to influencer and agents
- Updates deal status to "active"

---

### POST /payments/escrow/{escrowJobId}/release
Release funds from escrow (Sponsor only).

**Response (200):**
```json
{
  "message": "Funds released successfully",
  "transaction": {
    "id": "string",
    "escrowJobId": "string",
    "influencerAmount": "number",
    "platformFee": "number",
    "agentCommissions": [
      {
        "agentId": "string",
        "amount": "number"
      }
    ]
  }
}
```

**Business Logic:**
1. Updates escrow status to "releasing"
2. Transfers funds to influencer via Stripe Connect
3. Calculates and distributes agent commissions (if applicable)
4. Updates escrow status to "released"
5. Updates deal status to "completed"
6. Sends notifications to all parties

**Commission Distribution:**
- If sponsor recruited by Agent A and influencer recruited by Agent B:
  - Agent A gets 50% of platform fee
  - Agent B gets 50% of platform fee
- If both recruited by same agent:
  - Agent gets 100% of platform fee
- If only one party recruited:
  - Agent gets 100% of platform fee
- If neither recruited:
  - Platform keeps 100% of fee

---

### POST /payments/escrow/{escrowJobId}/refund
Refund escrow (Sponsor only, before work submitted).

**Response (200):**
```json
{
  "message": "Refund processed successfully",
  "refundAmount": "number"
}
```

**Business Logic:**
- Refunds full amount to sponsor
- Updates escrow status to "refunded"
- Updates deal status to "cancelled"
- Sends notifications

---

### GET /payments/balance
Get user's balance.

**Response (200):**
```json
{
  "availableBalance": "number",
  "escrowBalance": "number",
  "totalEarnings": "number",
  "totalWithdrawals": "number",
  "currency": "usd | btc | eth",
  "lastUpdated": "ISO 8601"
}
```

---

### GET /payments/transactions
Get user's transaction history.

**Query Parameters:**
- `type` (string: payment_in | escrow_lock | release | commission_deduct | agent_commission | withdrawal | refund)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "string",
      "type": "string",
      "jobId": "string",
      "gigId": "string",
      "fromUser": "string",
      "toUser": "string",
      "amount": "number",
      "currency": "string",
      "fee": "number",
      "status": "pending | completed | failed",
      "timestamp": "ISO 8601",
      "paymentId": "string",
      "description": "string"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### POST /payments/withdraw
Request a withdrawal (Influencer or Agent).

**Request Body:**
```json
{
  "amount": "number (required)",
  "currency": "usd | btc | eth",
  "paymentMethod": "stripe | coinbase",
  "destination": "string (Stripe account ID or wallet address)"
}
```

**Response (201):**
```json
{
  "withdrawal": {
    "id": "string",
    "userId": "string",
    "amount": "number",
    "method": "string",
    "status": "pending",
    "createdAt": "ISO 8601"
  }
}
```

---

### POST /payments/stripe/connect
Initiate Stripe Connect onboarding.

**Response (200):**
```json
{
  "accountId": "string",
  "onboardingUrl": "string"
}
```

---

### POST /payments/stripe/webhook
Stripe webhook endpoint (public, validate with signature).

**Headers:** `Stripe-Signature`

**Handles events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `payout.paid`
- `payout.failed`

---

## Agent System

### POST /agents/referrals
Record a referral (system internal, called during registration).

**Request Body:**
```json
{
  "agentId": "string (required)",
  "recruitedUserId": "string (required)",
  "recruitedUserType": "sponsor | influencer"
}
```

**Response (201):**
```json
{
  "referral": {
    "id": "string",
    "agentId": "string",
    "recruitedUserId": "string",
    "recruitedUserType": "string",
    "recruitedAt": "ISO 8601",
    "totalCommissionsEarned": 0,
    "isActive": true
  }
}
```

---

### GET /agents/{agentId}/referrals
Get agent's referrals.

**Response (200):**
```json
{
  "referrals": [
    {
      "id": "string",
      "agentId": "string",
      "recruitedUserId": "string",
      "recruitedUserName": "string",
      "recruitedUserType": "sponsor | influencer",
      "recruitedAt": "ISO 8601",
      "totalCommissionsEarned": "number",
      "isActive": "boolean"
    }
  ]
}
```

---

### GET /agents/{agentId}/commissions
Get agent's commission history.

**Query Parameters:**
- `status` (pending | paid)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "commissions": [
    {
      "id": "string",
      "agentId": "string",
      "dealId": "string",
      "amount": "number",
      "status": "pending | paid",
      "createdAt": "ISO 8601",
      "paidAt": "ISO 8601"
    }
  ],
  "totalEarnings": "number",
  "pendingEarnings": "number",
  "pagination": { /* pagination object */ }
}
```

---

### POST /agents/contacts/import
Import contacts (phone, CSV, Gmail).

**Request Body (Phone):**
```json
{
  "source": "phone",
  "contacts": [
    {
      "name": "string",
      "email": "string",
      "phone": "string"
    }
  ]
}
```

**Request Body (CSV):**
```json
{
  "source": "csv",
  "csvContent": "string (CSV format)"
}
```

**Response (200):**
```json
{
  "imported": "number",
  "duplicates": "number",
  "errors": ["string"]
}
```

---

### POST /agents/invites
Send invite to contact.

**Request Body:**
```json
{
  "contactIds": ["string"],
  "method": "sms | email | both",
  "templateId": "string",
  "message": "string (optional, overrides template)"
}
```

**Response (201):**
```json
{
  "invites": [
    {
      "id": "string",
      "agentId": "string",
      "contactId": "string",
      "contactName": "string",
      "method": "string",
      "status": "sent",
      "referralCode": "string",
      "message": "string",
      "sentAt": "ISO 8601"
    }
  ]
}
```

---

### GET /agents/{agentId}/invites
Get agent's invites.

**Query Parameters:**
- `status` (pending | sent | accepted | expired)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "invites": [/* array of invite objects */],
  "stats": {
    "total": "number",
    "sent": "number",
    "accepted": "number",
    "verified": "number",
    "pending": "number",
    "expired": "number",
    "acceptanceRate": "string (percentage)"
  },
  "pagination": { /* pagination object */ }
}
```

---

### GET /agents/leaderboard
Get agent leaderboard.

**Query Parameters:**
- `metric` (earnings | recruits | conversion | growth)
- `period` (week | month | quarter | allTime)
- `limit` (number, default: 50)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": "number",
      "agentId": "string",
      "agentName": "string",
      "agentAvatar": "string",
      "tier": "bronze | silver | gold | platinum",
      "value": "number",
      "change": "number (optional)",
      "badge": "string (optional)"
    }
  ]
}
```

---

## Rewards System

### GET /rewards
Get user's rewards.

**Query Parameters:**
- `status` (pending | processing | completed | failed)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "rewards": [
    {
      "id": "string",
      "userId": "string",
      "rewardDefinitionId": "string",
      "rewardName": "string",
      "rewardType": "points | cash | crypto | badge",
      "amount": "number",
      "currency": "string",
      "status": "pending | processing | completed | failed",
      "earnedAt": "ISO 8601",
      "claimedAt": "ISO 8601",
      "transactionHash": "string"
    }
  ],
  "stats": {
    "totalImpact": "number",
    "totalUsdValue": "number",
    "badgeCount": "number"
  }
}
```

---

### POST /rewards/{rewardId}/claim
Claim a reward.

**Response (200):**
```json
{
  "message": "Reward claimed successfully",
  "reward": {
    /* updated reward object with status "processing" or "completed" */
  }
}
```

**Business Logic:**
- For crypto rewards:
  - Checks if user has connected wallet
  - Transfers IMPACT tokens to wallet
  - Updates reward status to "completed"
  - Provides transaction hash
- For cash rewards:
  - Adds to user's balance
  - Creates transaction record
- For badges:
  - Adds badge to user profile
  - Updates status immediately to "completed"

---

### GET /rewards/triggers (Admin only)
Get all reward triggers.

**Response (200):**
```json
{
  "triggers": [
    {
      "id": "string",
      "type": "string",
      "name": "string",
      "description": "string",
      "conditions": { /* condition object */ },
      "isActive": "boolean",
      "createdAt": "ISO 8601"
    }
  ]
}
```

---

### POST /rewards/triggers (Admin only)
Create reward trigger.

**Request Body:**
```json
{
  "type": "deals_milestone | earnings_milestone | ...",
  "name": "string",
  "description": "string",
  "conditions": {
    "dealsCount": "number",
    "earningsAmount": "number"
    // other conditions
  },
  "isActive": "boolean"
}
```

**Response (201):** Reward trigger object

---

## Wallet & Crypto

### POST /wallet/connect
Connect crypto wallet.

**Request Body:**
```json
{
  "address": "string (required)",
  "network": "ethereum | polygon | solana | bitcoin",
  "provider": "metamask | walletconnect | coinbase | trust | manual",
  "signature": "string (wallet signature for verification)"
}
```

**Response (200):**
```json
{
  "wallet": {
    "id": "string",
    "userId": "string",
    "address": "string",
    "network": "string",
    "provider": "string",
    "isConnected": true,
    "isVerified": true,
    "connectedAt": "ISO 8601"
  },
  "balance": {
    "walletAddress": "string",
    "balance": "number (IMPACT tokens)",
    "lockedBalance": "number",
    "totalEarned": "number",
    "totalWithdrawn": "number"
  }
}
```

---

### GET /wallet/balance
Get ImPAct token balance.

**Response (200):**
```json
{
  "walletAddress": "string",
  "balance": "number",
  "lockedBalance": "number",
  "totalEarned": "number",
  "totalWithdrawn": "number",
  "lastUpdated": "ISO 8601"
}
```

---

### POST /wallet/withdraw
Request ImPAct token withdrawal.

**Request Body:**
```json
{
  "amount": "number (required)",
  "walletAddress": "string (required)"
}
```

**Response (201):**
```json
{
  "withdrawalRequest": {
    "id": "string",
    "userId": "string",
    "walletAddress": "string",
    "amount": "number",
    "status": "pending",
    "requestedAt": "ISO 8601"
  }
}
```

---

### GET /wallet/withdrawals (Admin only)
Get pending withdrawal requests.

**Response (200):**
```json
{
  "withdrawals": [
    {
      "id": "string",
      "userId": "string",
      "userName": "string",
      "walletAddress": "string",
      "amount": "number",
      "status": "pending | processing | completed | failed",
      "requestedAt": "ISO 8601",
      "processedAt": "ISO 8601",
      "transactionHash": "string",
      "failureReason": "string"
    }
  ]
}
```

---

### POST /wallet/withdrawals/{withdrawalId}/process (Admin only)
Process a withdrawal request.

**Request Body:**
```json
{
  "transactionHash": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Withdrawal processed successfully",
  "withdrawal": {
    /* updated withdrawal object */
  }
}
```

---

## Matching Algorithm

### GET /matching/gigs
Get matched gigs for influencer.

**Query Parameters:**
- `limit` (number, default: 10)

**Response (200):**
```json
{
  "matches": [
    {
      "gig": { /* gig object */ },
      "matchScore": "number (0-100)",
      "matchReasons": ["string"]
    }
  ]
}
```

**Matching Criteria:**
- Category alignment (40%)
- Budget vs rate match (25%)
- Location match (15%)
- Engagement rate vs requirements (10%)
- Follower count vs requirements (10%)

---

### GET /matching/influencers
Get matched influencers for sponsor or gig.

**Query Parameters:**
- `gigId` (string, optional)
- `limit` (number, default: 20)

**Response (200):**
```json
{
  "matches": [
    {
      "influencer": { /* influencer profile */ },
      "matchScore": "number (0-100)",
      "matchReasons": ["string"]
    }
  ]
}
```

---

## Analytics

### GET /analytics/dashboard
Get user's analytics dashboard.

**Query Parameters:**
- `period` (7d | 30d | 90d | 1y | all)

**Response varies by role:**

**Influencer:**
```json
{
  "totalEarnings": "number",
  "activeDeals": "number",
  "completedDeals": "number",
  "averageDealValue": "number",
  "engagementTrend": [
    {
      "date": "string",
      "value": "number"
    }
  ],
  "topCategories": ["string"],
  "profileViews": "number"
}
```

**Sponsor:**
```json
{
  "totalSpent": "number",
  "activeGigs": "number",
  "completedCampaigns": "number",
  "averageROI": "number",
  "applicationRate": "number",
  "topInfluencers": [
    {
      "influencerId": "string",
      "name": "string",
      "dealsCount": "number",
      "totalSpent": "number"
    }
  ]
}
```

**Agent:**
```json
{
  "totalEarnings": "number",
  "totalReferrals": "number",
  "verifiedReferrals": "number",
  "conversionRate": "number",
  "earningsTrend": [/* data points */],
  "topRecruits": [/* recruit performance */],
  "tier": "bronze | silver | gold | platinum",
  "performanceScore": "number"
}
```

---

### GET /analytics/feed
Get platform activity feed.

**Query Parameters:**
- `types` (comma-separated: deal_booked | gig_posted | ...)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "activities": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "description": "string",
      "timestamp": "ISO 8601",
      "userId": "string",
      "userName": "string",
      "userAvatar": "string",
      "amount": "number",
      "metadata": { /* type-specific data */ }
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

## Notifications

### GET /notifications
Get user's notifications.

**Query Parameters:**
- `read` (boolean)
- `type` (string: application | approval | deal | ...)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "string",
      "userId": "string",
      "type": "string",
      "priority": "low | medium | high | urgent",
      "title": "string",
      "message": "string",
      "read": "boolean",
      "createdAt": "ISO 8601",
      "relatedId": "string",
      "actionUrl": "string",
      "actionLabel": "string",
      "imageUrl": "string"
    }
  ],
  "unreadCount": "number",
  "pagination": { /* pagination object */ }
}
```

---

### PUT /notifications/{notificationId}/read
Mark notification as read.

**Response (200):**
```json
{
  "notificationId": "string",
  "read": true
}
```

---

### PUT /notifications/read-all
Mark all notifications as read.

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "count": "number"
}
```

---

## WebSocket Events

**Connection:** `wss://api.sourceimpact.app/v1/ws?token={accessToken}`

### Events Received (Server → Client):

**message.new:**
```json
{
  "type": "message.new",
  "data": {
    "conversationId": "string",
    "message": { /* message object */ }
  }
}
```

**notification.new:**
```json
{
  "type": "notification.new",
  "data": {
    "notification": { /* notification object */ }
  }
}
```

**deal.updated:**
```json
{
  "type": "deal.updated",
  "data": {
    "dealId": "string",
    "status": "string",
    "updatedFields": { /* changed fields */ }
  }
}
```

**escrow.status_changed:**
```json
{
  "type": "escrow.status_changed",
  "data": {
    "escrowJobId": "string",
    "oldStatus": "string",
    "newStatus": "string"
  }
}
```

### Events Sent (Client → Server):

**typing:**
```json
{
  "type": "typing",
  "conversationId": "string"
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": { /* optional additional info */ }
  }
}
```

**Common HTTP Status Codes:**
- `400` Bad Request - Invalid input
- `401` Unauthorized - Missing or invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource doesn't exist
- `409` Conflict - Resource already exists
- `422` Unprocessable Entity - Validation errors
- `500` Internal Server Error - Server error
- `503` Service Unavailable - Temporary outage

**Example Error Codes:**
- `INVALID_INPUT`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `ALREADY_EXISTS`
- `INSUFFICIENT_FUNDS`
- `PAYMENT_FAILED`
- `VALIDATION_ERROR`
- `RATE_LIMIT_EXCEEDED`

---

## Rate Limiting

**Headers:**
- `X-RateLimit-Limit`: Total requests allowed in window
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**Limits:**
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Premium accounts: 5000 requests/hour

---

## Pagination

All paginated endpoints return:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

---

## Webhooks

### POST /webhooks/register
Register a webhook endpoint.

**Request Body:**
```json
{
  "url": "string (HTTPS required)",
  "events": ["deal.completed", "payment.received", ...],
  "secret": "string (for signature verification)"
}
```

**Available Events:**
- `deal.created`
- `deal.completed`
- `application.submitted`
- `application.approved`
- `escrow.locked`
- `escrow.released`
- `payment.received`
- `withdrawal.completed`
- `referral.verified`
- `reward.earned`

---

This specification provides a comprehensive foundation for backend implementation. Refer to BACKEND_DATA_MODELS.md for database schemas and BACKEND_BUSINESS_LOGIC.md for detailed business rules.
