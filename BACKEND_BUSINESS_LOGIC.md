# Backend Business Logic & Rules

## Overview
This document details all business logic, workflows, calculations, and rules that must be implemented in the backend for the Source Impact platform.

---

## Table of Contents
1. [Commission System](#commission-system)
2. [Escrow Workflow](#escrow-workflow)
3. [Agent Attribution](#agent-attribution)
4. [Rewards System](#rewards-system)
5. [Matching Algorithm](#matching-algorithm)
6. [Tier & Ranking](#tier--ranking)
7. [Verification Workflows](#verification-workflows)
8. [Notification Rules](#notification-rules)
9. [Payment Processing](#payment-processing)
10. [Validation Rules](#validation-rules)

---

## Commission System

### Platform Fee Structure
- **Base Platform Fee**: 10% of deal amount
- **Applied To**: Every deal between influencer and sponsor
- **Charged From**: Sponsor (on top of agreed amount)
- **Total Sponsor Pays**: `dealAmount + (dealAmount * 0.10)`

### Example:
```
Agreed Deal Amount: $5,000
Platform Fee (10%): $500
Total Sponsor Pays: $5,500
Influencer Receives: $5,000 (full agreed amount)
Platform Fee Distribution: $500
```

### Agent Commission Distribution

The 10% platform fee is distributed based on agent attribution:

#### Case 1: Both Sponsor AND Influencer recruited by same agent
```
Platform Fee: $500
Agent A receives: $500 (100%)
Platform receives: $0
```

#### Case 2: Sponsor recruited by Agent A, Influencer recruited by Agent B
```
Platform Fee: $500
Agent A receives: $250 (50%)
Agent B receives: $250 (50%)
Platform receives: $0
```

#### Case 3: Only Sponsor recruited (by Agent A)
```
Platform Fee: $500
Agent A receives: $500 (100%)
Platform receives: $0
```

#### Case 4: Only Influencer recruited (by Agent B)
```
Platform Fee: $500
Agent B receives: $500 (100%)
Platform receives: $0
```

#### Case 5: Neither party recruited
```
Platform Fee: $500
Platform receives: $500 (100%)
```

### Agent Tier Commission Rates
**Note**: The tier system adds bonus multipliers to agent commissions:

| Tier | Min Deals | Commission Rate | Bonus |
|------|-----------|-----------------|-------|
| Bronze | 0-9 | 10% | Base |
| Silver | 10-24 | 12% | +2% |
| Gold | 25-49 | 15% | +5% |
| Platinum | 50+ | 18% | +8% |

**Implementation**: Apply tier bonus AFTER base commission calculation.

Example:
```
Base Commission: $500
Agent Tier: Gold (+5%)
Final Agent Commission: $500 + ($500 * 0.05) = $525
```

### Commission Lifecycle

1. **Deal Created**: Commission record created with status "pending"
2. **Escrow Locked**: Commission amount calculated and recorded
3. **Deal Completed**: Commission status changes to "approved"
4. **Funds Released**: Commission paid to agent(s)

### Agent Referral Tracking

**Referral Creation:**
- Triggered when user signs up with referral code
- Creates `referral` record linking agent to recruited user
- Marks as `is_active = true`

**Referral Validation:**
- Check referral is still active
- Verify agent account is in good standing
- Confirm no referral conflicts

---

## Escrow Workflow

### Complete Escrow Lifecycle

#### Step 1: Application Approved
```
1. Sponsor approves influencer application
2. System creates Deal record (status: "pending")
3. Notification sent to influencer
4. Notification sent to agent(s) if applicable
```

#### Step 2: Payment Initiation
```
1. Sponsor initiates escrow lock
2. System calculates:
   - Deal amount: $X
   - Platform fee (10%): $X * 0.10
   - Total charge: $X + platform fee
3. Stripe payment intent created
4. Payment processing begins
```

#### Step 3: Escrow Lock
```
1. Payment captured from sponsor
2. Escrow job created (status: "locked")
3. Sponsor balance:
   - available_balance -= total_charge
   - escrow_balance += total_charge
4. Transaction logged (type: "escrow_lock")
5. Notifications sent:
   - To influencer: "Funds locked! Start work"
   - To sponsor: "Payment successful"
   - To agents: "Deal funded, commission pending"
6. Deal status updated to "active"
```

#### Step 4: Work Completion
```
1. Influencer submits deliverables
2. Escrow status updated to "work_submitted"
3. Notification sent to sponsor for review
```

#### Step 5: Review & Approval
```
1. Sponsor reviews work
2. If approved:
   - Escrow status: "approved"
   - Proceed to release
3. If rejected:
   - Request revisions
   - Or initiate dispute
```

#### Step 6: Fund Release
```
1. Release triggered (auto or manual)
2. Escrow status: "releasing"
3. Calculate distributions:
   - Platform fee = total * (0.10 / 1.10)
   - Influencer amount = total - platform fee
4. Process transfers:
   a. Transfer to influencer via Stripe Connect
   b. Calculate agent commissions
   c. Distribute commissions to agent(s)
5. Update balances:
   - Sponsor: escrow_balance -= total
   - Influencer: available_balance += influencer_amount
   - Agent(s): available_balance += commission
6. Create transactions:
   - "release" (escrow → influencer)
   - "commission_deduct" (escrow → platform)
   - "agent_commission" (platform → agent)
7. Update records:
   - Escrow status: "released"
   - Deal status: "completed"
   - Referral: total_commissions_earned updated
8. Send notifications to all parties
```

### Escrow Refund Workflow

**Conditions for Refund:**
- Before work submitted
- Mutual agreement
- Dispute resolution in favor of sponsor

**Refund Process:**
```
1. Refund initiated
2. Escrow status: "refunding"
3. Stripe refund processed
4. Update balances:
   - Sponsor: available_balance += total_charge
   - Sponsor: escrow_balance -= total_charge
5. Transaction logged (type: "refund")
6. Escrow status: "refunded"
7. Deal status: "cancelled"
8. Notifications sent
```

### Escrow Dispute

**Dispute Triggers:**
- Work not delivered
- Quality issues
- Deadline missed
- Scope disagreement

**Dispute Process:**
```
1. Party initiates dispute
2. Escrow status: "disputed"
3. Freeze all actions on escrow
4. Admin/mediator review
5. Resolution options:
   a. Full refund to sponsor
   b. Full release to influencer
   c. Partial split
   d. Revision request
6. Apply resolution
7. Update escrow accordingly
8. Notify parties
```

---

## Agent Attribution

### Attribution Logic

**When Deal is Created:**
```javascript
function getAttributingAgents(sponsorId, influencerId) {
  // Query referrals
  const sponsorReferral = getReferral(sponsorId, isActive: true);
  const influencerReferral = getReferral(influencerId, isActive: true);
  
  if (sponsorReferral && influencerReferral) {
    if (sponsorReferral.agentId === influencerReferral.agentId) {
      // Same agent for both
      return {
        agentId: sponsorReferral.agentId,
        recruitedType: 'both',
        splitPercentage: 100
      };
    } else {
      // Two different agents
      return [
        {
          agentId: sponsorReferral.agentId,
          recruitedType: 'sponsor',
          splitPercentage: 50
        },
        {
          agentId: influencerReferral.agentId,
          recruitedType: 'influencer',
          splitPercentage: 50
        }
      ];
    }
  } else if (sponsorReferral) {
    return {
      agentId: sponsorReferral.agentId,
      recruitedType: 'sponsor',
      splitPercentage: 100
    };
  } else if (influencerReferral) {
    return {
      agentId: influencerReferral.agentId,
      recruitedType: 'influencer',
      splitPercentage: 100
    };
  }
  
  return null; // No attribution
}
```

### Attribution Edge Cases

**Multiple Referrals:**
- User can only have ONE active referral
- If user switches agents, mark old referral inactive
- New referral becomes active

**Retroactive Attribution:**
- Attribution locked at deal creation time
- Cannot be changed after escrow lock

**Expired Referrals:**
- Referrals can be marked inactive by admin
- Inactive referrals don't receive commissions

---

## Rewards System

### Reward Trigger Evaluation

**When to Check:**
- After user action completes
- On milestone reached
- Daily/periodic batch jobs

**Check Process:**
```javascript
function checkAndAwardRewards(userId, triggerType, metadata) {
  const triggers = getActiveTriggers(triggerType);
  
  for (const trigger of triggers) {
    if (evaluateConditions(trigger, metadata)) {
      const rewardDefs = getRewardDefinitions(trigger.id);
      
      for (const def of rewardDefs) {
        // Check if already awarded
        const existing = getUserReward(userId, def.id);
        if (!existing) {
          // Create new reward
          createUserReward({
            userId,
            rewardDefinitionId: def.id,
            rewardType: def.rewardType,
            amount: def.amount,
            status: 'pending'
          });
          
          // Log feed activity
          createFeedActivity({
            type: 'reward_earned',
            userId,
            rewardName: def.name,
            amount: def.amount
          });
        }
      }
    }
  }
}
```

### Reward Types & Processing

#### 1. Points
```
- Add to user's point balance
- Instant processing
- No external dependencies
```

#### 2. Cash (USD)
```
- Add to user's available_balance
- Create transaction record
- Instant processing
```

#### 3. Crypto (ImPAct tokens)
```
1. Check if user has connected wallet
2. If yes:
   - Transfer tokens to wallet
   - Update token balance
   - Status: "completed"
3. If no:
   - Status remains "pending"
   - Notify user to connect wallet
```

#### 4. Badge
```
- Add badge to user profile
- Instant processing
- Display on profile page
```

### Reward Claiming

**Claim Process:**
```
1. User clicks "Claim"
2. Status: "pending" → "processing"
3. Process reward based on type
4. If successful:
   - Status: "completed"
   - Record transaction (for cash/crypto)
   - Update balances
5. If failed:
   - Status: "failed"
   - Log error reason
6. Notify user of result
```

### Common Reward Triggers

| Trigger | Conditions | Reward |
|---------|-----------|---------|
| account_created | User signs up | 100 points or $5 |
| first_deal_completed | Complete 1 deal | 500 points or $10 |
| deals_milestone | 10 deals completed | $50 |
| deals_milestone | 50 deals completed | $200 |
| deals_milestone | 100 deals completed | $500 |
| earnings_milestone | $1,000 earned | $50 bonus |
| earnings_milestone | $10,000 earned | $500 bonus |
| profile_completed | 100% profile filled | 200 points |
| social_verified | All socials verified | 300 points |
| referral_signup | Recruit joins | 100 points |
| verified_referrals | 10 verified recruits | $100 |

---

## Matching Algorithm

### Matching Score Calculation

**For Influencer-Gig Match:**
```javascript
function calculateMatchScore(influencer, gig) {
  let score = 0;
  
  // 1. Category Alignment (40 points)
  const categoryMatch = intersection(
    influencer.categories,
    gig.categories
  ).length / gig.categories.length;
  score += categoryMatch * 40;
  
  // 2. Budget vs Rate Match (25 points)
  if (influencer.ratePerPost >= gig.budget.min && 
      influencer.ratePerPost <= gig.budget.max) {
    score += 25;
  } else if (influencer.ratePerPost < gig.budget.min) {
    const diff = gig.budget.min - influencer.ratePerPost;
    score += Math.max(0, 25 - (diff / gig.budget.min * 25));
  }
  
  // 3. Location Match (15 points)
  if (!gig.location || influencer.location === gig.location) {
    score += 15;
  } else {
    // Partial points for same state/country
    score += getLocationProximityScore(influencer.location, gig.location) * 15;
  }
  
  // 4. Engagement Rate (10 points)
  if (influencer.engagementRate >= 3.0) {
    score += 10;
  } else {
    score += (influencer.engagementRate / 3.0) * 10;
  }
  
  // 5. Follower Count (10 points)
  // Scale based on gig requirements
  const requiredFollowers = getMinFollowersForBudget(gig.budget.max);
  if (influencer.followers >= requiredFollowers) {
    score += 10;
  } else {
    score += (influencer.followers / requiredFollowers) * 10;
  }
  
  return Math.min(100, Math.round(score));
}
```

### Matching Filters

**Pre-filtering before scoring:**
1. Remove gigs where influencer already applied
2. Remove gigs from blocked sponsors
3. Filter by explicit requirements:
   - Follower minimum
   - Engagement minimum
   - Required categories
   - Location restrictions

### Ranking Results

**Sort by:**
1. Match score (descending)
2. Gig created date (descending)
3. Budget amount (descending)

**Limit:**
- Return top 10-20 matches
- Can be paginated

---

## Tier & Ranking

### Agent Tier Calculation

**Tiers based on completed deals:**
```javascript
function calculateAgentTier(completedDeals) {
  if (completedDeals >= 50) return 'platinum';
  if (completedDeals >= 25) return 'gold';
  if (completedDeals >= 10) return 'silver';
  return 'bronze';
}
```

**Tier Benefits:**
| Feature | Bronze | Silver | Gold | Platinum |
|---------|--------|--------|------|----------|
| Commission Rate | 10% | 12% | 15% | 18% |
| Monthly Bonus | - | - | $200 | $500 |
| Priority Support | No | No | Yes | Yes |
| Auto Payout | No | Yes | Yes | Yes |
| Advanced Analytics | No | No | Yes | Yes |

### Performance Score Calculation

**For Agent Leaderboard:**
```javascript
function calculatePerformanceScore(agent) {
  const metrics = getAgentMetrics(agent.id);
  
  // Weighted formula
  const score = 
    (metrics.totalDeals * 10) +
    (metrics.verifiedReferrals * 15) +
    (metrics.totalEarnings / 100) +
    (metrics.satisfactionScore * 20) +
    (100 - metrics.averageConversionTime) + // Lower is better
    (100 - metrics.responseTime); // Lower is better
    
  return score;
}
```

### Leaderboard Rankings

**Categories:**
1. **Top Earners**: Total commission earned
2. **Most Recruits**: Number of verified referrals
3. **Highest Conversion**: Acceptance rate of invites
4. **Fastest Growing**: New recruits in last 30 days

**Update Frequency:**
- Real-time for user's own rank
- Hourly refresh for leaderboard
- Use materialized views for performance

---

## Verification Workflows

### Social Media Verification

**Instagram Verification:**
```
1. User provides username and URL
2. System generates verification code
3. User posts story/bio with code
4. System checks via Instagram API
5. If found, mark as verified
6. Sync follower count
```

**Verification Expiry:**
- Re-verify every 30 days
- If verification fails, mark as "needs_reverification"

### Stripe Verification

**For Influencers & Agents:**
```
1. User clicks "Connect Stripe"
2. System creates Stripe Connected Account
3. Redirect to Stripe onboarding
4. User completes onboarding
5. Webhook received: account.updated
6. Update verification status
7. Allow payouts
```

**Verification Statuses:**
- `not_started`: No verification initiated
- `pending`: Onboarding in progress
- `verified`: Fully verified, can receive payouts
- `failed`: Verification failed, needs attention

### Identity Verification (Agent)

**Levels:**
1. `unverified`: No verification
2. `email_verified`: Email confirmed
3. `phone_verified`: Phone confirmed
4. `id_verified`: ID document verified
5. `fully_verified`: All verified

**Benefits:**
- Higher trust score
- Better visibility
- Access to premium features

---

## Notification Rules

### Notification Priority Levels

| Priority | Response Time | Display |
|----------|--------------|---------|
| low | No urgency | Normal |
| medium | Within 24h | Normal |
| high | Within 1h | Bold + Bell |
| urgent | Immediate | Push + Email + SMS |

### Automatic Notifications

**Deal Events:**
- Application submitted → Sponsor (medium)
- Application approved → Influencer (high)
- Application rejected → Influencer (medium)
- Payment locked → Influencer (high)
- Work submitted → Sponsor (high)
- Payment released → Influencer (high)
- Deal completed → Both parties (medium)

**Agent Events:**
- Recruit signs up → Agent (medium)
- Commission earned → Agent (high)
- Milestone reached → Agent (high)
- Tier upgraded → Agent (high)

**Reward Events:**
- Reward earned → User (medium)
- Reward claimable → User (high)

**Message Events:**
- New message → Recipient (high)
- Mentioned in message → User (high)

### Notification Aggregation

**Rules:**
- Group similar notifications within 1 hour
- "You have 5 new messages" instead of 5 separate
- "3 applications on your gig" instead of 3 separate

### Delivery Channels

**In-App:**
- All notifications
- Real-time via WebSocket

**Push Notification:**
- Priority: high, urgent
- If user has notifications enabled

**Email:**
- Priority: urgent
- Daily digest for low/medium

**SMS:**
- Priority: urgent only
- If user has SMS enabled

---

## Payment Processing

### Stripe Integration

**Payment Flow:**
```
1. Create Payment Intent
   - amount: deal amount + platform fee
   - currency: 'usd'
   - capture_method: 'automatic'
   - metadata: { gigId, dealId, applicationId }

2. Attach Payment Method
   - Use saved payment method or new

3. Confirm Payment
   - 3D Secure if required
   - Wait for confirmation

4. On Success:
   - Webhook: payment_intent.succeeded
   - Lock funds in escrow

5. On Failure:
   - Webhook: payment_intent.payment_failed
   - Notify sponsor
   - Retry or cancel
```

**Transfer to Influencer:**
```
1. Create Transfer
   - amount: influencer amount
   - destination: influencer connected account
   - metadata: { dealId, escrowJobId }

2. Wait for transfer.paid webhook

3. Update escrow status to "released"
```

### Stripe Connect

**Account Types:**
- `express`: For influencers (recommended)
- `custom`: For advanced use cases

**Capabilities Required:**
- `transfers`
- `card_payments` (for agents)

### Webhook Security

**Verify Signatures:**
```javascript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  sig,
  webhookSecret
);
```

**Handle Events Idempotently:**
- Check if event already processed
- Use event ID as idempotency key

---

## Validation Rules

### User Input Validation

**Email:**
- Valid email format
- Max 255 characters
- Unique in system

**Password:**
- Min 8 characters
- At least 1 uppercase
- At least 1 number
- At least 1 special character

**Phone:**
- Valid phone format
- International format preferred

**Referral Code:**
- 6-20 alphanumeric characters
- Unique in system
- Generated automatically

### Gig Validation

**Required Fields:**
- title (3-255 chars)
- description (10-5000 chars)
- budget.min > 0
- budget.max >= budget.min
- At least 1 category
- At least 1 influencer type

**Optional Fields:**
- location
- deadline (must be future date)
- requirements (array)
- deliverables (array)

### Deal Validation

**Amount:**
- Must be within gig budget range
- Min: $10
- Max: $1,000,000

**Status Transitions:**
```
pending → active (on escrow lock)
active → completed (on release)
active → cancelled (on refund)
pending → cancelled (before escrow)
```

### Transaction Validation

**Balance Check:**
```javascript
function canProcessTransaction(userId, amount, type) {
  const balance = getUserBalance(userId);
  
  if (type === 'withdrawal' || type === 'escrow_lock') {
    return balance.available_balance >= amount;
  }
  
  return true;
}
```

**Rate Limiting:**
- Max 10 transactions per minute per user
- Max 100 transactions per hour per user

---

## Security Rules

### Authentication

**JWT Tokens:**
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Rotate refresh token on use

**Session Management:**
- Track active sessions
- Allow multiple sessions per user
- Provide "logout all devices" option

### Authorization

**Role-Based Access:**
```javascript
// Example permissions
const permissions = {
  influencer: ['apply_to_gigs', 'view_own_deals', 'message'],
  sponsor: ['create_gigs', 'view_applicants', 'approve_applications'],
  agent: ['view_referrals', 'send_invites', 'view_commissions'],
  admin: ['*'] // All permissions
};
```

**Resource Ownership:**
- Users can only modify their own resources
- Exceptions: admins, automated processes

### Data Privacy

**PII Protection:**
- Encrypt sensitive data at rest
- Hash passwords with bcrypt (min 10 rounds)
- Never log passwords or tokens

**GDPR Compliance:**
- Provide data export
- Implement right to deletion
- Get consent for marketing

---

## Cron Jobs & Scheduled Tasks

### Daily Tasks

**12:00 AM UTC:**
- Calculate agent performance metrics
- Update agent tiers
- Process monthly bonuses (on 1st of month)

**06:00 AM UTC:**
- Send daily email digests
- Sync social media metrics
- Clean up expired invites

**12:00 PM UTC:**
- Refresh materialized views
- Generate analytics reports

### Hourly Tasks

**Every Hour:**
- Check auto-payout thresholds
- Process pending withdrawals
- Send reminder notifications

### Real-Time Tasks

**On Event:**
- Send immediate notifications
- Update real-time stats
- Trigger webhooks

---

This business logic specification provides complete implementation guidance for all core features. Refer to BACKEND_API_SPEC.md for API endpoints and BACKEND_DATA_MODELS.md for database schemas.
