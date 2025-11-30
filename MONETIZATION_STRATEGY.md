# Monetization Strategy & Implementation Guide

## Overview
Source Impact uses a multi-revenue stream approach to maximize profitability while providing value at every tier. The monetization system is built on three core pillars:

1. **Subscription Tiers** - Recurring revenue through premium features
2. **Transaction Fees** - Commission on platform deals
3. **One-Time Purchases** - Boosts and premium features

---

## Revenue Streams

### 1. Subscription Revenue

#### Tier Structure

| Tier | Monthly Price | Yearly Price | Target Users | Key Features |
|------|--------------|--------------|--------------|--------------|
| **Free** | $0 | $0 | New users, casual influencers | 5 applications/month, basic profile, discovery feed |
| **Basic** | $19 | $190 (save $38) | Active influencers, small sponsors | Unlimited applications, enhanced profile, priority discovery, 100 AI credits/month |
| **Pro** | $49 | $490 (save $98) | Professional influencers, agencies, growing brands | All Basic + featured placement, AI matching, 500 AI credits, unlimited campaigns |
| **Enterprise** | $199 | $1,990 (save $398) | Large brands, agencies, high-volume users | White-label, dedicated manager, API access, custom integrations |

#### Annual Billing Incentive
- Yearly subscriptions save 16-20% compared to monthly
- Increases customer lifetime value (LTV)
- Improves cash flow with upfront payments
- Reduces churn through longer commitments

#### Projected Subscriber Distribution (Year 1)
- Free: 70% (customer acquisition)
- Basic: 20% (primary revenue driver)
- Pro: 8% (high-value users)
- Enterprise: 2% (highest LTV)

#### Monthly Recurring Revenue (MRR) Projections

**Conservative (1,000 users)**
- 700 Free: $0
- 200 Basic: 200 × $19 = $3,800
- 80 Pro: 80 × $49 = $3,920
- 20 Enterprise: 20 × $199 = $3,980
- **Total MRR: $11,700**
- **Annual Run Rate (ARR): $140,400**

**Moderate (5,000 users)**
- 3,500 Free: $0
- 1,000 Basic: 1,000 × $19 = $19,000
- 400 Pro: 400 × $49 = $19,600
- 100 Enterprise: 100 × $199 = $19,900
- **Total MRR: $58,500**
- **ARR: $702,000**

**Aggressive (20,000 users)**
- 14,000 Free: $0
- 4,000 Basic: 4,000 × $19 = $76,000
- 1,600 Pro: 1,600 × $49 = $78,400
- 400 Enterprise: 400 × $199 = $79,600
- **Total MRR: $234,000**
- **ARR: $2,808,000**

---

### 2. Transaction Fees

#### Fee Structure
- **Platform Fee: 10% of deal value** (added on top, not deducted)
- Influencer receives full agreed amount
- Sponsor pays deal amount + 10% fee

#### Commission Routing Logic

| Scenario | Agent Involvement | Commission Distribution |
|----------|-------------------|------------------------|
| No agents | Neither party recruited by agent | 100% to platform |
| Sponsor recruited | Agent recruited sponsor only | 100% to that agent |
| Influencer recruited | Agent recruited influencer only | 100% to that agent |
| Same agent | Same agent recruited both | 100% to that agent |
| Different agents | Agent A recruited sponsor, Agent B recruited influencer | 50% to Agent A, 50% to Agent B |

#### Transaction Fee Projections

**Deal Volume Scenarios (Monthly)**

**Conservative:** 100 deals/month, avg $500
- Total deal value: $50,000
- Platform fees (10%): $5,000/month = **$60,000/year**

**Moderate:** 500 deals/month, avg $1,000
- Total deal value: $500,000
- Platform fees (10%): $50,000/month = **$600,000/year**

**Aggressive:** 2,000 deals/month, avg $1,500
- Total deal value: $3,000,000
- Platform fees (10%): $300,000/month = **$3,600,000/year**

**Note:** Transaction fees are the largest revenue driver as the platform scales.

---

### 3. One-Time Purchases

#### Premium Features

| Feature | Price | Target Users | Expected Monthly Purchases |
|---------|-------|--------------|---------------------------|
| Profile Boost (7 days) | $29 | Influencers seeking visibility | 50-200 |
| Gig Boost (7 days) | $19 | Sponsors with urgent needs | 100-300 |
| AI Profile Optimizer | $9 | All users | 200-500 |

#### One-Time Revenue Projections (Monthly)

**Conservative:**
- 50 Profile Boosts × $29 = $1,450
- 100 Gig Boosts × $19 = $1,900
- 200 AI Optimizers × $9 = $1,800
- **Total: $5,150/month = $61,800/year**

**Moderate:**
- 125 Profile Boosts × $29 = $3,625
- 200 Gig Boosts × $19 = $3,800
- 350 AI Optimizers × $9 = $3,150
- **Total: $10,575/month = $126,900/year**

**Aggressive:**
- 200 Profile Boosts × $29 = $5,800
- 300 Gig Boosts × $19 = $5,700
- 500 AI Optimizers × $9 = $4,500
- **Total: $16,000/month = $192,000/year**

---

## Total Revenue Projections

### Year 1 Revenue Forecasts

| Scenario | Subscription | Transaction Fees | One-Time | **Total Annual Revenue** |
|----------|-------------|------------------|----------|-------------------------|
| **Conservative** | $140,400 | $60,000 | $61,800 | **$262,200** |
| **Moderate** | $702,000 | $600,000 | $126,900 | **$1,428,900** |
| **Aggressive** | $2,808,000 | $3,600,000 | $192,000 | **$6,600,000** |

### Revenue Mix at Scale

At moderate scale, expected revenue distribution:
- **Subscriptions:** 40-50% (stable, predictable)
- **Transaction Fees:** 40-50% (scales with deal volume)
- **One-Time Purchases:** 5-10% (supplemental)

---

## Monetization Features Implementation

### Core Components

#### 1. MonetizationContext (`contexts/MonetizationContext.tsx`)
Manages all monetization logic:
- Subscription management (create, upgrade, cancel)
- Transaction fee recording
- Usage limit tracking
- Feature access control
- Revenue analytics

#### 2. Subscription Management Screen (`app/subscription-management.tsx`)
User-facing subscription portal:
- Visual comparison of all tiers
- Monthly/yearly billing toggle
- Upgrade/downgrade flows
- Subscription management (cancel, update payment)
- Current usage and limits

#### 3. Paywall Components (`components/PaywallComponents.tsx`)
Enforce premium features:
- **Paywall**: Modal for upgrade prompts
- **FeatureLock**: Wrap premium features
- **UsageLimit**: Block actions when limits reached

### Integration Points

#### In Gig Application Flow
```typescript
import { UsageLimit } from '@/components/PaywallComponents';

// Check application limit before allowing submission
<UsageLimit limitType="monthlyApplications" currentUsage={applicationsThisMonth}>
  <Button onPress={submitApplication}>Apply to Gig</Button>
</UsageLimit>
```

#### In AI Features
```typescript
import { FeatureLock } from '@/components/PaywallComponents';

// Lock advanced AI features for Pro+ users
<FeatureLock featureId="ai_contract_generator">
  <ContractGeneratorScreen />
</FeatureLock>
```

#### In Campaign Management
```typescript
import { useMonetization } from '@/contexts/MonetizationContext';

const { checkLimit } = useMonetization();
const limitCheck = checkLimit(userId, 'campaignsCount', currentCampaigns.length);

if (!limitCheck.allowed) {
  // Show upgrade prompt
}
```

#### In Deal Completion
```typescript
import { useMonetization } from '@/contexts/MonetizationContext';

const { recordTransactionFee } = useMonetization();

// When deal is completed
await recordTransactionFee(
  dealId,
  dealAmount,
  agentId ? 'agent' : 'platform',
  agentId
);
```

---

## User Acquisition & Conversion Funnel

### Conversion Strategy

#### Free → Basic (Target: 25% conversion rate)
**Triggers:**
- Hit application limit (5/month)
- Want verified badge
- Need advanced analytics
- Require more AI credits

**Tactics:**
- Show "2 applications remaining" warnings
- Display upgrade CTA on profile page
- Highlight Pro features in discovery feed
- Email campaigns after hitting limits

#### Basic → Pro (Target: 35% conversion rate)
**Triggers:**
- Need unlimited gig posts
- Want featured placement
- Require AI matching
- Managing multiple campaigns

**Tactics:**
- Show "Featured" badge on Pro profiles
- Demonstrate AI matching success rates
- Offer 14-day Pro trial
- Highlight campaign management tools

#### Pro → Enterprise (Target: 10% conversion rate)
**Triggers:**
- High deal volume (50+ deals/month)
- Need API access
- Want white-label solution
- Require dedicated support

**Tactics:**
- Dedicated sales outreach
- Custom pricing for volume
- Enterprise feature demos
- Integration consultations

---

## Growth & Scaling Metrics

### Key Performance Indicators (KPIs)

1. **Monthly Recurring Revenue (MRR)**: Track subscription revenue
2. **Customer Acquisition Cost (CAC)**: Marketing spend ÷ new subscribers
3. **Customer Lifetime Value (LTV)**: Avg subscription duration × monthly price
4. **LTV:CAC Ratio**: Target >3:1 for sustainable growth
5. **Churn Rate**: Monthly cancellations ÷ active subscribers (Target <5%)
6. **Conversion Rate**: Free→Paid conversions (Target >25%)
7. **Average Revenue Per User (ARPU)**: Total revenue ÷ total users
8. **Transaction Volume**: Number and value of deals
9. **Take Rate**: Platform fee revenue ÷ total deal volume

### Revenue Milestones

| Milestone | MRR Target | User Count | Timeline |
|-----------|------------|------------|----------|
| Initial Launch | $5,000 | 500 | Month 1-3 |
| Product-Market Fit | $20,000 | 2,000 | Month 6 |
| Growth Phase | $50,000 | 5,000 | Month 12 |
| Scale Phase | $100,000 | 10,000 | Month 18 |
| Market Leader | $250,000+ | 25,000+ | Month 24+ |

---

## Pricing Psychology & Optimization

### Anchor Pricing
- Enterprise tier at $199/month makes Pro at $49 seem affordable
- Yearly discounts (16-20% savings) encourage longer commitments
- "Most Popular" badge on Pro drives conversions

### Feature Gating Strategy
- **Free Tier**: Enough to experience value, limited to drive upgrades
- **Basic Tier**: Removes friction for active users ($19 = ~1 coffee/week)
- **Pro Tier**: Power users who make money on platform ($49 < typical deal commission)
- **Enterprise**: Custom value for high-volume users

### Price Testing Strategy
1. A/B test Basic tier pricing: $19 vs $29 vs $39
2. Test yearly discount: 16% vs 20% vs 25%
3. Experiment with free trial lengths: 7 vs 14 vs 30 days
4. Test boost pricing elasticity

---

## Risk Mitigation

### Churn Prevention
- Monthly check-ins with Pro+ users
- Automated win-back campaigns for churned users
- Exit surveys to understand cancellation reasons
- Usage analytics to identify at-risk accounts

### Competitive Pricing
- Monitor competitor pricing (Upfluence, AspireIQ, Grin)
- Position 20-30% below enterprise alternatives
- Emphasize unique features (rewards, AI matching, crypto)

### Revenue Diversification
- No single revenue stream >60% of total
- Multiple pricing tiers reduce dependency
- Both B2C (influencers) and B2B (brands) customers

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [x] Create MonetizationContext with subscription logic
- [x] Build Subscription Management screen
- [x] Implement Paywall components
- [ ] Integrate Stripe payment processing
- [ ] Add subscription webhooks
- [ ] Test upgrade/downgrade flows

### Phase 2: Feature Gating (Week 3-4)
- [ ] Add usage tracking to all limited features
- [ ] Implement limit checks before actions
- [ ] Show paywall at limit boundaries
- [ ] Add upgrade CTAs throughout app
- [ ] Track conversion funnel analytics

### Phase 3: Transaction Fees (Week 5-6)
- [ ] Integrate fee collection into deal flow
- [ ] Implement commission routing logic
- [ ] Build admin dashboard for fee tracking
- [ ] Create payout system for agents
- [ ] Add transaction reporting

### Phase 4: Optimization (Week 7-8)
- [ ] A/B test pricing tiers
- [ ] Implement usage analytics
- [ ] Build churn prediction model
- [ ] Create automated marketing campaigns
- [ ] Add revenue dashboards

---

## Backend Integration Requirements

### Database Schema

#### subscriptions table
- id, user_id, tier, billing_period, price
- start_date, end_date, status, auto_renew
- stripe_subscription_id, payment_method_id
- created_at, updated_at, cancelled_at

#### transaction_fees table
- id, deal_id, deal_amount, fee_percentage, fee_amount
- recipient_type (platform | agent), recipient_id
- status (pending | collected | refunded)
- collected_at, refunded_at, created_at

#### usage_tracking table
- id, user_id, metric_type, count, period_start, period_end
- updated_at

### API Endpoints

**Subscriptions**
- `POST /api/subscriptions/create` - Create new subscription
- `PUT /api/subscriptions/:id/upgrade` - Upgrade subscription
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription
- `GET /api/subscriptions/:userId` - Get user subscription
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

**Transaction Fees**
- `POST /api/fees/record` - Record transaction fee
- `GET /api/fees/user/:userId` - Get user fee history
- `GET /api/fees/admin` - Admin fee dashboard

**Usage Tracking**
- `POST /api/usage/track` - Track feature usage
- `GET /api/usage/:userId` - Get user usage stats
- `POST /api/usage/reset` - Reset monthly usage

---

## Success Metrics & Targets

### Month 3 Targets
- 500 total users
- 50 paid subscribers (10% conversion)
- $2,500 MRR
- 20 deals completed
- $5,000 transaction volume

### Month 6 Targets
- 2,000 total users
- 300 paid subscribers (15% conversion)
- $12,000 MRR
- 150 deals completed
- $75,000 transaction volume

### Month 12 Targets
- 5,000 total users
- 1,000 paid subscribers (20% conversion)
- $40,000 MRR
- 500 deals completed
- $500,000 transaction volume

### Month 24 Targets
- 20,000 total users
- 5,000 paid subscribers (25% conversion)
- $200,000 MRR
- 2,000 deals completed
- $3,000,000 transaction volume

---

## Conclusion

This monetization strategy provides multiple revenue streams while delivering value at every tier. Key success factors:

1. **Freemium Model**: Low barrier to entry, clear upgrade path
2. **Transaction Fees**: Aligns incentives (we win when users win)
3. **Tiered Pricing**: Captures value from different user segments
4. **Retention Focus**: Long-term relationships > one-time sales
5. **Data-Driven**: Continuous optimization based on metrics

Expected outcome: **$1M+ ARR within 18-24 months** with healthy unit economics and sustainable growth.
