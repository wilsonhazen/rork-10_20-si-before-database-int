# Stripe Verification Workflow Documentation

## Overview

This document outlines the Stripe verification workflow that ensures users complete account verification before applying for deals. This is a critical security and compliance feature that enables secure payment processing.

## Purpose

The Stripe verification workflow serves several key purposes:

1. **Payment Security** - Ensures users can receive payments securely
2. **Identity Verification** - Validates user identity through Stripe's KYC process
3. **Compliance** - Meets regulatory requirements for payment processing
4. **Fraud Prevention** - Reduces fraudulent applications and payment disputes
5. **Trust Building** - Increases confidence between sponsors and influencers

## User Flow

### For Influencers

```
1. Sign Up → 2. Complete Profile → 3. Stripe Verification Required → 4. Apply for Deals
                                           ↓
                                    Stripe Onboarding
                                    - Identity Verification
                                    - Bank Account Setup
                                    - Tax Information
```

### Verification States

The system tracks four verification states:

- **not_started** - User has not initiated verification
- **pending** - Verification in progress with Stripe
- **verified** - Successfully verified and ready to receive payments
- **failed** - Verification failed, user needs to retry

## Implementation Details

### 1. User Type Extensions

Added Stripe-related fields to the User interface:

```typescript
interface User {
  // ... existing fields
  stripeConnectedAccountId?: string;
  stripeOnboardingComplete?: boolean;
  stripeVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'failed';
  stripeVerifiedAt?: string;
}
```

### 2. Verification Screen

**Location:** `app/stripe-verification.tsx`

**Features:**
- Status card showing current verification state
- Information about required documents
- Start verification button
- Check status functionality
- Retry verification for failed attempts
- Security information

**Key Functions:**

```typescript
handleStartVerification()
  - Creates Stripe Connected Account
  - Generates onboarding URL
  - Updates user profile with account ID
  - Opens Stripe onboarding in browser

handleCheckStatus()
  - Checks verification status with Stripe
  - Updates user profile
  - Shows success/pending message

handleRetryVerification()
  - Reopens Stripe onboarding
  - Resets status to pending
```

### 3. Application Gate

**Location:** `app/gig-details.tsx`

Before allowing an influencer to apply for a deal, the system checks:

```typescript
if (user.stripeVerificationStatus !== 'verified') {
  Alert.alert(
    'Stripe Verification Required',
    'You need to verify your Stripe account before applying for deals...',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify Now', onPress: () => router.push('/stripe-verification') }
    ]
  );
  return;
}
```

This ensures:
- Only verified users can apply
- Clear messaging about why verification is needed
- Easy path to complete verification

### 4. Profile Integration

**Location:** `app/(tabs)/profile.tsx`

The profile screen shows verification status:

```typescript
// Status badge colors
not_started: Colors.textMuted
pending: Colors.warning
verified: Colors.success
failed: Colors.danger
```

Menu item displays:
- "Stripe Verification" option for influencers
- Status badge showing current state
- Quick access to verification screen

## Stripe Integration

### Connected Accounts

The system uses Stripe Connect to create connected accounts for influencers:

```typescript
const { accountId, onboardingUrl } = await StripeEscrowIntegration.createConnectedAccount(
  userId,
  userEmail,
  'individual' // or 'company' for sponsors
);
```

### Onboarding Process

1. **Account Creation**
   - System creates Stripe Connected Account
   - Generates unique account ID
   - Creates onboarding link

2. **User Onboarding**
   - User redirected to Stripe
   - Completes identity verification
   - Provides bank account details
   - Submits tax information

3. **Verification**
   - Stripe processes verification
   - System receives webhook notifications
   - User status updated to 'verified'

4. **Ready for Payments**
   - User can now apply for deals
   - Can receive payments via Stripe
   - Funds transferred to connected account

## Security Considerations

### Data Protection

- **No Sensitive Data Storage** - System only stores Stripe account IDs
- **Secure Communication** - All Stripe communication over HTTPS
- **Webhook Verification** - Webhook signatures verified
- **User Privacy** - Identity documents handled by Stripe only

### Verification Requirements

Users must provide:
- Full legal name
- Date of birth
- Address
- Government-issued ID
- Bank account details
- Tax information (SSN/EIN)

### Compliance

- **KYC (Know Your Customer)** - Identity verification required
- **AML (Anti-Money Laundering)** - Stripe handles compliance
- **PCI DSS** - Payment card data security
- **GDPR** - User data protection

## User Experience

### Clear Messaging

The system provides clear information at every step:

1. **Why Verification is Needed**
   - "To apply for deals and receive payments"
   - "Secure payment processing powered by Stripe"

2. **What's Required**
   - Personal information
   - Identity verification
   - Bank account

3. **Status Updates**
   - Real-time status checking
   - Clear success/pending/failed states
   - Next steps guidance

### Error Handling

If verification fails:
- Clear error message
- Retry button
- Support contact information
- Guidance on common issues

## Testing

### Test Scenarios

1. **New User Flow**
   - Sign up as influencer
   - Attempt to apply for deal
   - Redirected to verification
   - Complete verification
   - Successfully apply

2. **Pending State**
   - Start verification
   - Close browser mid-process
   - Return to app
   - Check status
   - Resume verification

3. **Failed Verification**
   - Submit invalid information
   - Receive failed status
   - Retry with correct information
   - Successfully verify

4. **Already Verified**
   - Verified user
   - Apply for deal
   - No verification prompt
   - Application submitted

### Test Data

Use Stripe test mode:
- Test account IDs
- Mock verification responses
- Simulated webhook events

## Monitoring

### Key Metrics

Track these metrics:
- Verification start rate
- Verification completion rate
- Time to complete verification
- Verification failure rate
- Retry success rate

### Logging

Log important events:
```
[Stripe Verification] Starting verification for user: {userId}
[Stripe Verification] Connected account created: {accountId}
[Stripe Verification] Onboarding URL: {url}
[Stripe Verification] Checking status for account: {accountId}
[Stripe Verification] Status updated to: {status}
```

## Future Enhancements

### Planned Features

1. **In-App Verification**
   - Complete verification without leaving app
   - Use Stripe Identity SDK
   - Better mobile experience

2. **Verification Reminders**
   - Email reminders for pending verifications
   - Push notifications
   - In-app prompts

3. **Sponsor Verification**
   - Require sponsors to verify before posting gigs
   - Company verification for business accounts
   - Enhanced trust indicators

4. **Verification Levels**
   - Basic verification for small deals
   - Enhanced verification for large deals
   - Premium verification for top users

5. **Status Dashboard**
   - Detailed verification progress
   - Document upload status
   - Estimated completion time

## Support

### Common Issues

**Issue:** Verification stuck in pending
- **Solution:** Check status after 24 hours, contact Stripe support

**Issue:** Bank account not accepted
- **Solution:** Verify account details, try different account

**Issue:** Identity verification failed
- **Solution:** Ensure clear document photos, retry with different ID

**Issue:** Can't access onboarding URL
- **Solution:** Check browser settings, try different browser

### Contact

- **Stripe Support:** https://support.stripe.com
- **App Support:** help@sourceimpact.com
- **Documentation:** https://stripe.com/docs/connect

## Conclusion

The Stripe verification workflow is a critical component that ensures:
- Secure payment processing
- Regulatory compliance
- User trust and safety
- Fraud prevention

By requiring verification before deal applications, the platform maintains high standards for all participants and creates a trustworthy marketplace for influencer collaborations.

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
**Maintained By:** SourceImpact Development Team
