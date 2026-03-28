# Stripe Escrow Payment Integration Guide

## Overview

This document outlines the complete Stripe integration for the escrow payment workflow in the SourceImpact platform. The system handles secure payment processing between sponsors and influencers with automatic commission routing to agents.

## Architecture

### Payment Flow

```
1. Application Approved → 2. Sponsor Locks Funds → 3. Work Completed → 4. Sponsor Releases Payment
   ↓                         ↓                        ↓                  ↓
   Notification Sent         Stripe Payment Intent    Work Submitted     Stripe Transfer
                             Funds in Escrow          Review Process     Commission Routing
                             Notification Sent        Notification Sent  Notification Sent
```

### Escrow Status States

The system tracks detailed escrow states throughout the workflow:

- `pending_payment` - Application approved, awaiting payment
- `payment_processing` - Stripe payment being processed
- `locked` - Funds successfully locked in escrow
- `work_in_progress` - Influencer working on deliverables
- `work_submitted` - Influencer submitted work for review
- `under_review` - Sponsor reviewing submitted work
- `approved` - Work approved, ready for release
- `releasing` - Payment being released via Stripe
- `released` - Payment successfully released to influencer
- `refunding` - Refund being processed
- `refunded` - Funds refunded to sponsor
- `disputed` - Payment dispute initiated

## Stripe Setup Requirements

### 1. Stripe Account Configuration

#### Create Stripe Connect Platform Account

```bash
# Sign up at https://dashboard.stripe.com/register
# Enable Stripe Connect in Dashboard → Settings → Connect
```

#### Required Stripe Products

- **Stripe Connect** - For marketplace payments
- **Payment Intents API** - For secure payment processing
- **Transfers** - For releasing funds to influencers
- **Webhooks** - For payment event notifications

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Stripe API Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Connect
STRIPE_CONNECT_ACCOUNT_ID=acct_...

# Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...

# Coinbase (Optional - for crypto payments)
EXPO_PUBLIC_COINBASE_API_KEY=...
EXPO_PUBLIC_COINBASE_WEBHOOK_SECRET=...
```

### 3. Stripe Connect Onboarding

#### For Influencers (Connected Accounts)

Influencers must complete Stripe Connect onboarding to receive payments:

```typescript
import { StripeEscrowIntegration } from '@/utils/payment-integration';

// Create connected account for influencer
const { accountId, onboardingUrl } = await StripeEscrowIntegration.createConnectedAccount(
  influencerId,
  influencerEmail,
  'individual' // or 'company'
);

// Redirect influencer to onboarding URL
// They'll complete identity verification and bank account setup
```

#### Store Connected Account ID

```typescript
// Update user profile with Stripe account ID
await updateUser(influencerId, {
  stripeConnectedAccountId: accountId,
  stripeOnboardingComplete: false, // Set to true after webhook confirmation
});
```

## Implementation Details

### 1. Locking Funds in Escrow

When a sponsor approves an application and locks funds:

```typescript
// In app/deal-payment.tsx
await lockFundsInEscrow(
  gig,
  application,
  amount,
  currency,
  async (notification) => {
    await addNotification(notification);
  }
);
```

**What Happens:**

1. **Validate Balance** - Check sponsor has sufficient funds
2. **Create Stripe Payment Intent** - Process payment via Stripe
3. **Create Escrow Job** - Record in database with status `locked`
4. **Update Balances** - Move funds from available to escrow
5. **Log Transaction** - Create transaction record
6. **Send Notifications** - Notify both parties and agents

**Stripe API Call:**

```typescript
// In utils/payment-integration.ts
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // Convert to cents
  currency: currency,
  payment_method_types: ['card'],
  capture_method: 'manual', // Hold funds, don't capture yet
  metadata: {
    gigId: gig.id,
    applicationId: application.id,
    sponsorId: gig.sponsorId,
    influencerId: application.influencerId,
  },
});
```

### 2. Releasing Funds to Influencer

When work is completed and sponsor releases payment:

```typescript
// In app/deal-management.tsx
await releaseFunds(
  escrowJobId,
  (agentId, commission) => {
    console.log(`Commission routed to agent ${agentId}`);
  },
  async (notification) => {
    await addNotification(notification);
  }
);
```

**What Happens:**

1. **Update Status** - Set to `releasing`
2. **Calculate Amounts** - Platform fee (10%) and net amount (90%)
3. **Create Stripe Transfer** - Transfer to influencer's connected account
4. **Update Balances** - Remove from escrow, add to influencer balance
5. **Route Commissions** - Pay agents if applicable
6. **Update Status** - Set to `released`
7. **Send Notifications** - Notify all parties

**Stripe API Call:**

```typescript
// Transfer to influencer's connected account
const transfer = await stripe.transfers.create({
  amount: netAmount * 100, // 90% of total
  currency: currency,
  destination: influencerStripeAccountId,
  transfer_group: escrowJob.id,
  metadata: {
    escrowJobId: escrowJob.id,
    gigId: escrowJob.gigId,
  },
});

// Platform automatically keeps the 10% fee
```

### 3. Refunding to Sponsor

If deal is cancelled before completion:

```typescript
// In app/deal-management.tsx
await refundEscrow(escrowJobId, async (notification) => {
  await addNotification(notification);
});
```

**What Happens:**

1. **Update Status** - Set to `refunding`
2. **Process Stripe Refund** - Refund the payment intent
3. **Update Balances** - Return funds to sponsor
4. **Update Status** - Set to `refunded`
5. **Send Notifications** - Notify both parties

**Stripe API Call:**

```typescript
const refund = await stripe.refunds.create({
  payment_intent: escrowJob.stripePaymentIntentId,
  reason: 'requested_by_customer',
  metadata: {
    escrowJobId: escrowJob.id,
  },
});
```

## Webhook Integration

### Required Webhooks

Set up these webhook endpoints in Stripe Dashboard:

```
POST /api/webhooks/stripe
```

### Events to Handle

```typescript
// payment_intent.succeeded
// - Confirm funds locked successfully
// - Update escrow status to 'locked'

// payment_intent.payment_failed
// - Handle payment failure
// - Notify sponsor
// - Update escrow status

// transfer.created
// - Confirm transfer initiated
// - Log transfer ID

// transfer.paid
// - Confirm influencer received funds
// - Update escrow status to 'released'

// charge.refunded
// - Confirm refund processed
// - Update escrow status to 'refunded'

// account.updated
// - Update influencer's connected account status
// - Mark onboarding as complete
```

### Webhook Handler Example

```typescript
import { WebhookHandler } from '@/utils/payment-integration';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await WebhookHandler.handleStripeWebhook(event);

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook failed' }), { status: 400 });
  }
}
```

## Notification System

### Automatic Notifications

The system sends notifications at every stage:

#### 1. Funds Locked

**To Influencer:**
```
Title: "Funds Locked in Escrow! 🎉"
Message: "[Sponsor] has locked $[amount] in escrow for "[Gig Title]". You can now start working on the project!"
```

**To Sponsor:**
```
Title: "Escrow Payment Successful"
Message: "$[amount] has been locked in escrow for "[Gig Title]". [Influencer] will be notified to begin work."
```

**To Agent (if applicable):**
```
Title: "Commission Pending"
Message: "A deal you referred has been funded! Commission will be paid when the work is completed."
```

#### 2. Funds Released

**To Influencer:**
```
Title: "Payment Released! 💰"
Message: "$[net_amount] has been released to your account! Great work on completing the project."
```

**To Sponsor:**
```
Title: "Payment Released"
Message: "$[net_amount] has been released to the influencer. The deal is now complete!"
```

#### 3. Refund Processed

**To Sponsor:**
```
Title: "Refund Processed"
Message: "$[amount] has been refunded to your account."
```

**To Influencer:**
```
Title: "Deal Cancelled"
Message: "The deal has been cancelled and funds have been refunded to the sponsor."
```

### Notification Channels

Each notification is sent through multiple channels:

1. **In-App Notification** - Stored in database, shown in app
2. **Email** - Sent to user's registered email
3. **Push Notification** - Mobile push notification
4. **Console Logs** - Detailed logging for debugging

## Commission Routing

### Agent Commission Logic

When funds are released, the system automatically routes commissions:

```typescript
// 10% platform fee is split:
// - If agent referred both parties: 100% to that agent
// - If different agents referred each party: 50% to each agent
// - If no agent referrals: 100% to platform

const platformFee = amount * 0.10; // $100 on $1000 deal

// Scenario 1: Same agent referred both
agentCommission = platformFee * 1.0; // $100

// Scenario 2: Different agents
agent1Commission = platformFee * 0.5; // $50
agent2Commission = platformFee * 0.5; // $50

// Scenario 3: No agents
platformRevenue = platformFee; // $100
```

### Commission Payment

Commissions are paid immediately when funds are released:

```typescript
// Update agent balance
await updateBalance(agentId, {
  availableBalance: agentBalance.availableBalance + commission,
  totalEarnings: agentBalance.totalEarnings + commission,
});

// Log commission transaction
await addTransaction({
  type: 'agent_commission',
  fromUser: 'escrow',
  toUser: agentId,
  amount: commission,
  attribution: { agentId, recruitedType, splitPercentage },
});
```

## Security Considerations

### 1. Payment Intent Security

- Use `capture_method: 'manual'` to hold funds
- Validate amounts on server-side
- Check user permissions before operations
- Log all payment operations

### 2. Webhook Security

- Verify webhook signatures
- Use HTTPS endpoints only
- Implement idempotency keys
- Handle duplicate events

### 3. Data Protection

- Never log full card numbers
- Store only Stripe IDs, not sensitive data
- Encrypt payment metadata
- Implement rate limiting

### 4. Error Handling

```typescript
try {
  await lockFundsInEscrow(...);
} catch (error) {
  // Log error details
  console.error('[Payment Error]', error);
  
  // Show user-friendly message
  Alert.alert('Payment Failed', 'Please try again or contact support.');
  
  // Rollback any partial changes
  await rollbackEscrowJob(escrowJobId);
}
```

## Testing

### Test Mode

Use Stripe test mode for development:

```bash
# Test API keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

### Test Scenarios

1. **Successful Payment Flow**
   - Lock funds → Work completed → Release payment
   - Verify all notifications sent
   - Check commission routing

2. **Refund Flow**
   - Lock funds → Cancel deal → Process refund
   - Verify refund received
   - Check notification delivery

3. **Failed Payment**
   - Attempt payment with declined card
   - Verify error handling
   - Check user notification

4. **Webhook Processing**
   - Trigger webhook events
   - Verify status updates
   - Check idempotency

## Production Checklist

Before going live:

- [ ] Switch to live Stripe API keys
- [ ] Complete Stripe account verification
- [ ] Set up production webhook endpoints
- [ ] Configure webhook signing secrets
- [ ] Test with real bank accounts (small amounts)
- [ ] Implement monitoring and alerting
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Review and test refund policies
- [ ] Verify tax compliance requirements
- [ ] Test commission routing with real agents
- [ ] Document support procedures
- [ ] Train support team on payment issues

## Monitoring and Logging

### Key Metrics to Track

- Payment success rate
- Average escrow duration
- Refund rate
- Commission distribution
- Failed payment reasons
- Webhook processing time

### Logging Best Practices

```typescript
console.log('[Escrow Workflow] Step 1: Initiating payment processing');
console.log('[Stripe Escrow] Payment Intent created:', paymentIntentId);
console.log('[Commission] $X routed to agent Y');
console.log('[Notification] Sent to user:', userId);
```

## Support and Troubleshooting

### Common Issues

**1. Payment Declined**
- Check card details
- Verify sufficient funds
- Contact Stripe support

**2. Webhook Not Received**
- Check endpoint URL
- Verify webhook secret
- Check firewall settings

**3. Transfer Failed**
- Verify connected account status
- Check account capabilities
- Ensure onboarding complete

**4. Commission Not Routed**
- Verify referral records
- Check agent account status
- Review attribution logic

### Contact Information

- Stripe Support: https://support.stripe.com
- Stripe Dashboard: https://dashboard.stripe.com
- API Documentation: https://stripe.com/docs/api

## Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Transfers and Payouts](https://stripe.com/docs/connect/charges-transfers)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Guide](https://stripe.com/docs/testing)

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
**Maintained By:** SourceImpact Development Team
