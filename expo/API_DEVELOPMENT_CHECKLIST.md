# API Development Checklist - Source Impact

This document provides a complete, organized list of all APIs that need to be created by the developer for the Source Impact platform.

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [User & Profile APIs](#user--profile-apis)
3. [Gigs Management APIs](#gigs-management-apis)
4. [Applications & Deals APIs](#applications--deals-apis)
5. [Messaging APIs](#messaging-apis)
6. [Payments & Escrow APIs](#payments--escrow-apis)
7. [Agent System APIs](#agent-system-apis)
8. [Rewards System APIs](#rewards-system-apis)
9. [Wallet & Crypto APIs](#wallet--crypto-apis)
10. [Matching Algorithm APIs](#matching-algorithm-apis)
11. [Analytics APIs](#analytics-apis)
12. [Notifications APIs](#notifications-apis)
13. [Admin APIs](#admin-apis)
14. [WebSocket Events](#websocket-events)
15. [Webhook APIs](#webhook-apis)

---

## Authentication APIs

### POST /auth/register
**Purpose**: Register a new user account  
**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (min 8 chars, required)",
  "name": "string (required)",
  "role": "influencer | sponsor | agent | admin",
  "referralCode": "string (optional)"
}
```
**Returns**: User object + access/refresh tokens

---

### POST /auth/login
**Purpose**: Authenticate existing user  
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Returns**: User object + access/refresh tokens

---

### POST /auth/refresh
**Purpose**: Refresh access token  
**Request Body**:
```json
{
  "refreshToken": "string"
}
```
**Returns**: New access/refresh tokens

---

### POST /auth/logout
**Purpose**: Invalidate tokens  
**Headers**: `Authorization: Bearer {token}`  
**Returns**: Success message

---

## User & Profile APIs

### GET /users/{userId}
**Purpose**: Get user profile by ID  
**Returns**: Complete user profile with role-specific fields

---

### PUT /users/{userId}
**Purpose**: Update user profile  
**Request Body**: Partial user object (any updateable fields)  
**Returns**: Updated user object

---

### POST /users/{userId}/verify-social
**Purpose**: Initiate social media account verification  
**Request Body**:
```json
{
  "platform": "instagram | tiktok | youtube | twitter",
  "username": "string",
  "url": "string"
}
```
**Returns**: Verification ID and instructions

---

### POST /users/{userId}/confirm-social-verification
**Purpose**: Confirm social media verification  
**Request Body**:
```json
{
  "verificationId": "string"
}
```
**Returns**: Verified social account object

---

## Gigs Management APIs

### POST /gigs
**Purpose**: Create a new gig (Sponsor only)  
**Request Body**:
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
**Returns**: Created gig object

---

### GET /gigs
**Purpose**: Get list of gigs with filtering  
**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string: open | in_progress | completed | cancelled)
- `categories` (comma-separated strings)
- `influencerTypes` (comma-separated strings)
- `minBudget` (number)
- `maxBudget` (number)
- `location` (string)
- `sponsorId` (string)
- `search` (string)

**Returns**: Array of gigs + pagination info

---

### GET /gigs/{gigId}
**Purpose**: Get single gig details  
**Returns**: Gig object with applicant count

---

### PUT /gigs/{gigId}
**Purpose**: Update gig (Sponsor only, own gig)  
**Request Body**: Partial gig object  
**Returns**: Updated gig object

---

### DELETE /gigs/{gigId}
**Purpose**: Delete gig (Sponsor only, own gig)  
**Returns**: 204 No Content

---

### GET /gigs/{gigId}/applicants
**Purpose**: Get list of applicants for a gig (Sponsor only)  
**Query Parameters**:
- `status` (string: pending | approved | rejected)
- `page` (number)
- `limit` (number)

**Returns**: Array of applications with influencer details + pagination

---

## Applications & Deals APIs

### POST /applications
**Purpose**: Apply to a gig (Influencer only)  
**Request Body**:
```json
{
  "gigId": "string (required)",
  "message": "string (optional)"
}
```
**Returns**: Created application object

---

### GET /applications
**Purpose**: Get user's applications  
**Query Parameters**:
- `status` (string: pending | approved | rejected)
- `page` (number)
- `limit` (number)

**Returns**: Array of applications with gig details + pagination

---

### PUT /applications/{applicationId}
**Purpose**: Update application status (Sponsor only)  
**Request Body**:
```json
{
  "status": "approved | rejected"
}
```
**Returns**: Updated application object  
**Side Effects**: Creates Deal if approved, triggers notifications

---

### GET /deals
**Purpose**: Get user's deals  
**Query Parameters**:
- `status` (string: pending | active | completed | cancelled)
- `page` (number)
- `limit` (number)

**Returns**: Array of deals with full details + pagination

---

### GET /deals/{dealId}
**Purpose**: Get single deal details  
**Returns**: Deal object with full gig and user details

---

### PUT /deals/{dealId}
**Purpose**: Update deal status  
**Request Body**:
```json
{
  "status": "active | completed | cancelled"
}
```
**Returns**: Updated deal object

---

## Messaging APIs

### GET /conversations
**Purpose**: Get user's conversations  
**Query Parameters**:
- `page` (number)
- `limit` (number)

**Returns**: Array of conversations with last message + unread count

---

### POST /conversations
**Purpose**: Create a new conversation  
**Request Body**:
```json
{
  "participantIds": ["userId"],
  "dealId": "string (optional)"
}
```
**Returns**: Created conversation object

---

### GET /conversations/{conversationId}/messages
**Purpose**: Get messages in a conversation  
**Query Parameters**:
- `before` (ISO 8601, get messages before this timestamp)
- `limit` (number, default: 50)

**Returns**: Array of messages + hasMore flag

---

### POST /conversations/{conversationId}/messages
**Purpose**: Send a message  
**Request Body**:
```json
{
  "content": "string (required)"
}
```
**Returns**: Created message object  
**Side Effects**: Increments unread count, triggers notifications & WebSocket

---

### PUT /conversations/{conversationId}/read
**Purpose**: Mark conversation as read  
**Returns**: Updated conversation with unreadCount: 0

---

## Payments & Escrow APIs

### POST /payments/escrow/lock
**Purpose**: Lock funds in escrow for a deal (Sponsor only)  
**Request Body**:
```json
{
  "gigId": "string (required)",
  "applicationId": "string (required)",
  "amount": "number (required)",
  "currency": "usd | btc | eth (default: usd)",
  "paymentMethodId": "string (Stripe payment method ID)"
}
```
**Returns**: Escrow job object  
**Business Logic**: 
- Charges sponsor: amount + (amount * 0.10) [10% platform fee]
- Creates escrow job with status "locked"
- Updates deal status to "active"
- Sends notifications

---

### POST /payments/escrow/{escrowJobId}/release
**Purpose**: Release funds from escrow (Sponsor only)  
**Returns**: Transaction details with commission distribution  
**Business Logic**:
1. Transfers funds to influencer via Stripe Connect
2. Calculates and distributes agent commissions
3. Updates escrow status to "released"
4. Updates deal status to "completed"
5. Sends notifications to all parties

**Commission Distribution**:
- Both recruited by same agent: Agent gets 100% of platform fee
- Recruited by different agents: Each gets 50% of platform fee
- Only one recruited: That agent gets 100% of platform fee
- Neither recruited: Platform keeps 100% of platform fee

---

### POST /payments/escrow/{escrowJobId}/refund
**Purpose**: Refund escrow (Sponsor only, before work submitted)  
**Returns**: Refund details  
**Business Logic**:
- Refunds full amount to sponsor
- Updates escrow status to "refunded"
- Updates deal status to "cancelled"

---

### GET /payments/balance
**Purpose**: Get user's balance  
**Returns**:
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
**Purpose**: Get user's transaction history  
**Query Parameters**:
- `type` (string: payment_in | escrow_lock | release | commission_deduct | agent_commission | withdrawal | refund)
- `page` (number)
- `limit` (number)

**Returns**: Array of transactions + pagination

---

### POST /payments/withdraw
**Purpose**: Request a withdrawal (Influencer or Agent)  
**Request Body**:
```json
{
  "amount": "number (required)",
  "currency": "usd | btc | eth",
  "paymentMethod": "stripe | coinbase",
  "destination": "string (Stripe account ID or wallet address)"
}
```
**Returns**: Created withdrawal request object

---

### POST /payments/stripe/connect
**Purpose**: Initiate Stripe Connect onboarding  
**Returns**: 
```json
{
  "accountId": "string",
  "onboardingUrl": "string"
}
```

---

### POST /payments/stripe/webhook
**Purpose**: Stripe webhook endpoint (public, validate with signature)  
**Headers**: `Stripe-Signature`  
**Handles events**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `payout.paid`
- `payout.failed`

---

## Agent System APIs

### POST /agents/referrals
**Purpose**: Record a referral (system internal, called during registration)  
**Request Body**:
```json
{
  "agentId": "string (required)",
  "recruitedUserId": "string (required)",
  "recruitedUserType": "sponsor | influencer"
}
```
**Returns**: Created referral object

---

### GET /agents/{agentId}/referrals
**Purpose**: Get agent's referrals  
**Returns**: Array of referrals with recruited user details

---

### GET /agents/{agentId}/commissions
**Purpose**: Get agent's commission history  
**Query Parameters**:
- `status` (pending | paid)
- `page` (number)
- `limit` (number)

**Returns**: Array of commissions + totals + pagination

---

### POST /agents/contacts/import
**Purpose**: Import contacts (phone, CSV, Gmail)  
**Request Body (Phone)**:
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
**Request Body (CSV)**:
```json
{
  "source": "csv",
  "csvContent": "string (CSV format)"
}
```
**Returns**: Import statistics (imported, duplicates, errors)

---

### POST /agents/invites
**Purpose**: Send invite to contact  
**Request Body**:
```json
{
  "contactIds": ["string"],
  "method": "sms | email | both",
  "templateId": "string",
  "message": "string (optional, overrides template)"
}
```
**Returns**: Array of created invite objects

---

### GET /agents/{agentId}/invites
**Purpose**: Get agent's invites  
**Query Parameters**:
- `status` (pending | sent | accepted | expired)
- `page` (number)
- `limit` (number)

**Returns**: Array of invites + stats + pagination

---

### GET /agents/leaderboard
**Purpose**: Get agent leaderboard  
**Query Parameters**:
- `metric` (earnings | recruits | conversion | growth)
- `period` (week | month | quarter | allTime)
- `limit` (number, default: 50)

**Returns**: Ranked list of agents with metrics

---

## Rewards System APIs

### GET /rewards
**Purpose**: Get user's rewards  
**Query Parameters**:
- `status` (pending | processing | completed | failed)
- `page` (number)
- `limit` (number)

**Returns**: Array of rewards + stats

---

### POST /rewards/{rewardId}/claim
**Purpose**: Claim a reward  
**Returns**: Updated reward object  
**Business Logic**:
- For crypto: Transfers IMPACT tokens to wallet
- For cash: Adds to user's balance
- For badges: Adds badge to user profile

---

### GET /rewards/triggers (Admin only)
**Purpose**: Get all reward triggers  
**Returns**: Array of reward trigger definitions

---

### POST /rewards/triggers (Admin only)
**Purpose**: Create reward trigger  
**Request Body**:
```json
{
  "type": "deals_milestone | earnings_milestone | ...",
  "name": "string",
  "description": "string",
  "conditions": {
    "dealsCount": "number",
    "earningsAmount": "number"
  },
  "isActive": "boolean"
}
```
**Returns**: Created reward trigger object

---

## Wallet & Crypto APIs

### POST /wallet/connect
**Purpose**: Connect crypto wallet  
**Request Body**:
```json
{
  "address": "string (required)",
  "network": "ethereum | polygon | solana | bitcoin",
  "provider": "metamask | walletconnect | coinbase | trust | manual",
  "signature": "string (wallet signature for verification)"
}
```
**Returns**: Connected wallet object + balance info

---

### GET /wallet/balance
**Purpose**: Get ImPAct token balance  
**Returns**:
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
**Purpose**: Request ImPAct token withdrawal  
**Request Body**:
```json
{
  "amount": "number (required)",
  "walletAddress": "string (required)"
}
```
**Returns**: Created withdrawal request object

---

### GET /wallet/withdrawals (Admin only)
**Purpose**: Get pending withdrawal requests  
**Returns**: Array of withdrawal requests

---

### POST /wallet/withdrawals/{withdrawalId}/process (Admin only)
**Purpose**: Process a withdrawal request  
**Request Body**:
```json
{
  "transactionHash": "string (required)"
}
```
**Returns**: Updated withdrawal object

---

## Matching Algorithm APIs

### GET /matching/gigs
**Purpose**: Get matched gigs for influencer  
**Query Parameters**:
- `limit` (number, default: 10)

**Returns**: Array of gigs with match scores and reasons  
**Matching Criteria**:
- Category alignment (40%)
- Budget vs rate match (25%)
- Location match (15%)
- Engagement rate vs requirements (10%)
- Follower count vs requirements (10%)

---

### GET /matching/influencers
**Purpose**: Get matched influencers for sponsor or gig  
**Query Parameters**:
- `gigId` (string, optional)
- `limit` (number, default: 20)

**Returns**: Array of influencer profiles with match scores and reasons

---

## Analytics APIs

### GET /analytics/dashboard
**Purpose**: Get user's analytics dashboard  
**Query Parameters**:
- `period` (7d | 30d | 90d | 1y | all)

**Returns**: Role-specific analytics:
- **Influencer**: Total earnings, active deals, engagement trends, top categories
- **Sponsor**: Total spent, active gigs, ROI, application rates, top influencers
- **Agent**: Total earnings, referrals, conversion rate, earnings trends, tier info

---

### GET /analytics/feed
**Purpose**: Get platform activity feed  
**Query Parameters**:
- `types` (comma-separated: deal_booked | gig_posted | ...)
- `page` (number)
- `limit` (number)

**Returns**: Array of activity feed items + pagination

---

## Notifications APIs

### GET /notifications
**Purpose**: Get user's notifications  
**Query Parameters**:
- `read` (boolean)
- `type` (string: application | approval | deal | ...)
- `page` (number)
- `limit` (number)

**Returns**: Array of notifications + unread count + pagination

---

### PUT /notifications/{notificationId}/read
**Purpose**: Mark notification as read  
**Returns**: Updated notification object

---

### PUT /notifications/read-all
**Purpose**: Mark all notifications as read  
**Returns**: Success message with count

---

## Admin APIs

### GET /admin/users
**Purpose**: Get all users with filtering  
**Query Parameters**:
- `role` (influencer | sponsor | agent)
- `status` (active | inactive)
- `page` (number)
- `limit` (number)

**Returns**: Array of users + pagination

---

### PUT /admin/users/{userId}
**Purpose**: Update user (admin privileges)  
**Request Body**: Any user fields  
**Returns**: Updated user object

---

### DELETE /admin/users/{userId}
**Purpose**: Delete/deactivate user  
**Returns**: Success message

---

### GET /admin/gigs
**Purpose**: Get all gigs (admin view)  
**Returns**: Array of all gigs with extended info

---

### GET /admin/deals
**Purpose**: Get all deals (admin view)  
**Returns**: Array of all deals with extended info

---

### GET /admin/escrow-jobs
**Purpose**: Get all escrow jobs  
**Query Parameters**:
- `status` (any escrow status)

**Returns**: Array of escrow jobs

---

### PUT /admin/escrow-jobs/{escrowJobId}
**Purpose**: Manually update escrow job (for dispute resolution)  
**Request Body**:
```json
{
  "status": "string",
  "resolution": "full_refund | full_release | partial_split"
}
```
**Returns**: Updated escrow job

---

### GET /admin/rewards/triggers
**Purpose**: Manage reward triggers  
**Returns**: Array of reward triggers

---

### POST /admin/rewards/grant
**Purpose**: Manually grant reward to user  
**Request Body**:
```json
{
  "userId": "string",
  "rewardType": "points | cash | crypto | badge",
  "amount": "number",
  "reason": "string"
}
```
**Returns**: Created reward object

---

### GET /admin/analytics
**Purpose**: Get platform-wide analytics  
**Returns**: 
- Total users by role
- Total deals and volume
- Revenue metrics
- Agent performance overview
- Growth metrics

---

### GET /admin/transactions
**Purpose**: Get all transactions  
**Query Parameters**:
- `type` (transaction type)
- `status` (transaction status)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Returns**: Array of transactions + pagination

---

## WebSocket Events

### Connection
**URL**: `wss://api.sourceimpact.app/v1/ws?token={accessToken}`

### Events Received (Server → Client):

#### message.new
```json
{
  "type": "message.new",
  "data": {
    "conversationId": "string",
    "message": { /* message object */ }
  }
}
```

#### notification.new
```json
{
  "type": "notification.new",
  "data": {
    "notification": { /* notification object */ }
  }
}
```

#### deal.updated
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

#### escrow.status_changed
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

#### typing
```json
{
  "type": "typing",
  "conversationId": "string"
}
```

---

## Webhook APIs

### POST /webhooks/register
**Purpose**: Register a webhook endpoint  
**Request Body**:
```json
{
  "url": "string (HTTPS required)",
  "events": ["deal.completed", "payment.received", ...],
  "secret": "string (for signature verification)"
}
```
**Returns**: Created webhook object

### Available Webhook Events:
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

## Summary Statistics

### Total API Endpoints: **90+**

**Breakdown by Category**:
- Authentication: 4 endpoints
- User & Profile: 4 endpoints
- Gigs Management: 6 endpoints
- Applications & Deals: 6 endpoints
- Messaging: 5 endpoints
- Payments & Escrow: 7 endpoints
- Agent System: 6 endpoints
- Rewards System: 4 endpoints
- Wallet & Crypto: 5 endpoints
- Matching Algorithm: 2 endpoints
- Analytics: 2 endpoints
- Notifications: 3 endpoints
- Admin: 11+ endpoints
- WebSocket: 4 events (bidirectional)
- Webhooks: 1 endpoint + 10 event types

---

## Development Priority Order

### Phase 1 (Critical - Build First)
1. Authentication APIs
2. User & Profile APIs
3. Gigs Management APIs
4. Applications & Deals APIs

### Phase 2 (Core Features)
5. Messaging APIs
6. Payments & Escrow APIs
7. Agent System APIs

### Phase 3 (Enhanced Features)
8. Rewards System APIs
9. Matching Algorithm APIs
10. Analytics APIs
11. Notifications APIs

### Phase 4 (Advanced Features)
12. Wallet & Crypto APIs
13. Admin APIs
14. WebSocket Events
15. Webhook APIs

---

## Key Implementation Notes

### Commission Logic (CRITICAL)
The 10% platform fee distribution based on agent attribution is the **most critical business logic**:
- Both recruited by same agent: Agent gets 100%
- Recruited by different agents: 50/50 split
- Only one recruited: That agent gets 100%
- Neither recruited: Platform keeps 100%

### Escrow State Machine (CRITICAL)
Proper state transitions must be enforced:
```
pending_payment → payment_processing → locked → work_in_progress → 
work_submitted → under_review → approved → releasing → released
```

### Security Requirements
- All endpoints require JWT authentication (except public webhooks)
- Role-based access control on all endpoints
- Validate webhook signatures (Stripe)
- Rate limiting on all endpoints
- Input validation and sanitization

### Performance Considerations
- Implement pagination on all list endpoints
- Use database indexes for common queries
- Cache frequently accessed data (Redis)
- Use materialized views for complex analytics
- Implement request throttling

---

## Testing Requirements

Each API endpoint should have:
1. **Unit tests** for business logic
2. **Integration tests** for end-to-end flows
3. **Security tests** for authentication/authorization
4. **Load tests** for performance validation

---

## Documentation Requirements

For each API, document:
1. Purpose and use case
2. Request/response formats
3. Authentication requirements
4. Business logic and side effects
5. Error responses and codes
6. Example requests

---

**For complete implementation details, refer to:**
- `BACKEND_API_SPEC.md` - Full API specifications
- `BACKEND_DATA_MODELS.md` - Database schemas
- `BACKEND_BUSINESS_LOGIC.md` - Business rules
- `BACKEND_IMPLEMENTATION_GUIDE.md` - Development roadmap
