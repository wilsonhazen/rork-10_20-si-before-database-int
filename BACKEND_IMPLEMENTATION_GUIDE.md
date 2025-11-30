# Backend Implementation Guide - Source Impact

## Overview

This document provides a roadmap for implementing the complete backend for the Source Impact influencer marketing platform. The platform connects influencers, brands (sponsors), and agents in a marketplace with secure payments, escrow management, and commission tracking.

---

## Documentation Structure

This implementation guide consists of four main documents:

### 1. **BACKEND_API_SPEC.md**
Complete API specification including:
- All REST API endpoints with request/response formats
- Authentication & authorization flows
- WebSocket real-time events
- Error handling & rate limiting
- Pagination standards
- Webhook integrations

### 2. **BACKEND_DATA_MODELS.md**
Database schema and data models including:
- Complete PostgreSQL schema for all tables
- Relationships and foreign keys
- Indexes for query optimization
- Triggers and stored functions
- Views and materialized views
- Data integrity constraints

### 3. **BACKEND_BUSINESS_LOGIC.md**
Business rules and workflows including:
- Commission calculation and distribution logic
- Escrow payment workflows
- Agent attribution system
- Rewards trigger evaluation
- Matching algorithm implementation
- Tier and ranking calculations
- Notification rules
- Validation requirements

### 4. **BACKEND_IMPLEMENTATION_GUIDE.md** (this document)
Implementation roadmap and priorities

---

## Tech Stack Recommendations

### Core Backend
- **Language**: Node.js with TypeScript (or Python with FastAPI)
- **Framework**: Express.js or NestJS (Node) / FastAPI (Python)
- **Database**: PostgreSQL 14+ with pg_trgm and uuid-ossp extensions
- **Cache**: Redis for session management and real-time features
- **Search**: Elasticsearch or PostgreSQL Full-Text Search
- **Queue**: Bull (Redis-based) or AWS SQS for async jobs

### Infrastructure
- **Hosting**: AWS, Google Cloud, or Azure
- **Container**: Docker + Kubernetes (or AWS ECS)
- **CI/CD**: GitHub Actions, GitLab CI, or CircleCI
- **Monitoring**: Datadog, New Relic, or Prometheus + Grafana
- **Logging**: Winston/Pino + CloudWatch/ELK Stack

### Third-Party Services
- **Authentication**: Auth0 or implement JWT with Passport.js
- **Payments**: Stripe Connect (primary), Coinbase Commerce (crypto)
- **Email**: SendGrid or AWS SES
- **SMS**: Twilio
- **Push Notifications**: FCM (Firebase Cloud Messaging)
- **File Storage**: AWS S3 or Cloudinary
- **CDN**: CloudFront or Cloudflare

### Real-Time
- **WebSocket**: Socket.io or native WebSocket with Redis adapter
- **Pub/Sub**: Redis Pub/Sub or AWS SNS/SQS

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Set up core infrastructure and authentication

#### Week 1: Project Setup
- [ ] Initialize project repository
- [ ] Set up development environment
- [ ] Configure Docker containers
- [ ] Set up PostgreSQL database
- [ ] Configure Redis
- [ ] Set up ESLint, Prettier, TypeScript configs
- [ ] Create basic project structure

#### Week 2: Authentication & Users
- [ ] Implement user registration endpoint
- [ ] Implement login with JWT
- [ ] Set up refresh token rotation
- [ ] Create user profile CRUD endpoints
- [ ] Implement role-based access control (RBAC)
- [ ] Set up password hashing (bcrypt)
- [ ] Create middleware for auth verification

#### Week 3: Database & Models
- [ ] Create all database tables (from BACKEND_DATA_MODELS.md)
- [ ] Set up Prisma or TypeORM for ORM
- [ ] Create database migrations
- [ ] Implement database seeding
- [ ] Set up indexes
- [ ] Create database triggers
- [ ] Test database connections and queries

**Deliverables:**
- Working authentication system
- Complete database schema
- User registration and login
- Profile management

---

### Phase 2: Core Features (Weeks 4-7)
**Goal**: Implement gigs, deals, and applications

#### Week 4: Gigs Management
- [ ] POST /gigs - Create gig
- [ ] GET /gigs - List gigs with filters
- [ ] GET /gigs/{id} - Get gig details
- [ ] PUT /gigs/{id} - Update gig
- [ ] DELETE /gigs/{id} - Delete gig
- [ ] Implement search and filtering
- [ ] Add pagination
- [ ] Create gig validation logic

#### Week 5: Applications & Deals
- [ ] POST /applications - Apply to gig
- [ ] GET /applications - Get user applications
- [ ] PUT /applications/{id} - Update application status
- [ ] GET /gigs/{id}/applicants - Get applicants
- [ ] Implement deal creation on approval
- [ ] Add notification triggers
- [ ] Create deal endpoints

#### Week 6: Messaging System
- [ ] Create conversations table
- [ ] POST /conversations - Create conversation
- [ ] GET /conversations - List conversations
- [ ] POST /conversations/{id}/messages - Send message
- [ ] GET /conversations/{id}/messages - Get messages
- [ ] Implement unread count logic
- [ ] Set up WebSocket for real-time messages

#### Week 7: Matching Algorithm
- [ ] Implement matching score calculation
- [ ] GET /matching/gigs - Get matched gigs
- [ ] GET /matching/influencers - Get matched influencers
- [ ] Create matching filters
- [ ] Optimize matching queries
- [ ] Test matching accuracy

**Deliverables:**
- Complete gig lifecycle
- Application and deal management
- Real-time messaging
- Working matching algorithm

---

### Phase 3: Payments & Escrow (Weeks 8-10)
**Goal**: Implement secure payment processing

#### Week 8: Stripe Integration
- [ ] Set up Stripe account and API keys
- [ ] Implement Stripe Connect onboarding
- [ ] Create payment intent endpoint
- [ ] Implement payment confirmation
- [ ] Set up webhook handling
- [ ] Create connected account management
- [ ] Test payment flows in sandbox

#### Week 9: Escrow System
- [ ] POST /payments/escrow/lock - Lock funds
- [ ] POST /payments/escrow/{id}/release - Release funds
- [ ] POST /payments/escrow/{id}/refund - Refund
- [ ] Implement escrow state machine
- [ ] Create balance tracking
- [ ] Implement transaction logging
- [ ] Test escrow workflows

#### Week 10: Withdrawals & Balances
- [ ] GET /payments/balance - Get user balance
- [ ] POST /payments/withdraw - Request withdrawal
- [ ] GET /payments/transactions - Transaction history
- [ ] Implement withdrawal processing
- [ ] Create payout scheduling
- [ ] Add withdrawal limits and validation

**Deliverables:**
- Complete payment processing
- Secure escrow management
- Balance tracking
- Withdrawal system

---

### Phase 4: Agent System (Weeks 11-13)
**Goal**: Implement agent referrals and commissions

#### Week 11: Referral System
- [ ] POST /agents/referrals - Track referral
- [ ] GET /agents/{id}/referrals - Get referrals
- [ ] Implement referral code generation
- [ ] Create referral attribution logic
- [ ] Track referral status
- [ ] Implement deep link handling

#### Week 12: Contact Management
- [ ] POST /agents/contacts/import - Import contacts
- [ ] GET /agents/contacts - List contacts
- [ ] POST /agents/invites - Send invites
- [ ] GET /agents/{id}/invites - Get invite status
- [ ] Implement email/SMS sending
- [ ] Track invite engagement

#### Week 13: Commission Tracking
- [ ] Implement commission calculation logic
- [ ] Create commission distribution on deal completion
- [ ] GET /agents/{id}/commissions - Commission history
- [ ] Implement tier calculation
- [ ] Create performance metrics
- [ ] Build leaderboard queries

**Deliverables:**
- Complete referral system
- Contact management
- Commission tracking
- Agent leaderboard

---

### Phase 5: Rewards & Gamification (Weeks 14-15)
**Goal**: Implement rewards and achievements

#### Week 14: Rewards System
- [ ] Create reward triggers (from BACKEND_BUSINESS_LOGIC.md)
- [ ] GET /rewards - Get user rewards
- [ ] POST /rewards/{id}/claim - Claim reward
- [ ] Implement trigger evaluation logic
- [ ] Create reward processing
- [ ] Set up crypto reward distribution

#### Week 15: Achievements
- [ ] Create achievement definitions
- [ ] Implement achievement unlock logic
- [ ] GET /achievements - Get user achievements
- [ ] Create achievement badges
- [ ] Build achievement tracking

**Deliverables:**
- Complete rewards system
- Achievement tracking
- Gamification features

---

### Phase 6: Wallet & Crypto (Weeks 16-17)
**Goal**: Implement crypto wallet integration

#### Week 16: Wallet Connection
- [ ] POST /wallet/connect - Connect wallet
- [ ] GET /wallet/balance - Get ImPAct balance
- [ ] Implement wallet verification
- [ ] Create token balance tracking
- [ ] Set up blockchain interactions

#### Week 17: Token Management
- [ ] POST /wallet/withdraw - Request token withdrawal
- [ ] GET /wallet/withdrawals - Get withdrawal requests (admin)
- [ ] POST /wallet/withdrawals/{id}/process - Process withdrawal (admin)
- [ ] Implement token transfer logic
- [ ] Create withdrawal queue processing

**Deliverables:**
- Wallet connection
- Token balance management
- Withdrawal processing

---

### Phase 7: Advanced Features (Weeks 18-20)
**Goal**: Implement analytics, social verification, and admin features

#### Week 18: Analytics
- [ ] GET /analytics/dashboard - Get analytics
- [ ] Implement analytics calculations
- [ ] Create feed activity tracking
- [ ] Build report generation
- [ ] Set up data aggregation jobs

#### Week 19: Social Verification
- [ ] POST /users/{id}/verify-social - Initiate verification
- [ ] POST /users/{id}/confirm-social-verification - Confirm
- [ ] Integrate Instagram API
- [ ] Integrate TikTok API
- [ ] Integrate YouTube API
- [ ] Implement follower sync

#### Week 20: Admin Features
- [ ] Create admin dashboard endpoints
- [ ] Implement user management
- [ ] Create reward trigger management
- [ ] Build moderation tools
- [ ] Implement dispute resolution

**Deliverables:**
- Complete analytics system
- Social media verification
- Admin control panel APIs

---

### Phase 8: Optimization & Testing (Weeks 21-22)
**Goal**: Optimize performance and ensure quality

#### Week 21: Performance Optimization
- [ ] Add database query optimization
- [ ] Implement caching strategies
- [ ] Set up database connection pooling
- [ ] Create materialized views
- [ ] Optimize slow queries
- [ ] Add rate limiting
- [ ] Implement request throttling

#### Week 22: Testing & Security
- [ ] Write unit tests (target: 70%+ coverage)
- [ ] Create integration tests
- [ ] Perform security audit
- [ ] Add input validation
- [ ] Implement SQL injection prevention
- [ ] Set up CORS properly
- [ ] Add request validation middleware

**Deliverables:**
- Optimized performance
- Comprehensive test suite
- Security hardening

---

### Phase 9: Deployment & DevOps (Week 23)
**Goal**: Deploy to production

- [ ] Set up production database
- [ ] Configure production Redis
- [ ] Set up production environment variables
- [ ] Configure SSL certificates
- [ ] Set up load balancer
- [ ] Configure auto-scaling
- [ ] Set up monitoring and alerts
- [ ] Create backup strategy
- [ ] Deploy to production
- [ ] Perform smoke tests

**Deliverables:**
- Production-ready deployment
- Monitoring and alerting
- Backup and disaster recovery

---

## Critical Business Logic Implementation

### 1. Commission Distribution Algorithm

```typescript
async function distributeCommissions(escrowJobId: string) {
  const escrow = await getEscrowJob(escrowJobId);
  const platformFee = escrow.amount * (0.10 / 1.10); // Extract 10% from total
  
  // Check agent attribution
  const sponsorReferral = await getReferral(escrow.sponsorId);
  const influencerReferral = await getReferral(escrow.influencerId);
  
  if (sponsorReferral && influencerReferral) {
    if (sponsorReferral.agentId === influencerReferral.agentId) {
      // Same agent gets 100%
      await creditAgent(sponsorReferral.agentId, platformFee);
    } else {
      // Split 50/50
      await creditAgent(sponsorReferral.agentId, platformFee * 0.5);
      await creditAgent(influencerReferral.agentId, platformFee * 0.5);
    }
  } else if (sponsorReferral) {
    await creditAgent(sponsorReferral.agentId, platformFee);
  } else if (influencerReferral) {
    await creditAgent(influencerReferral.agentId, platformFee);
  } else {
    // Platform keeps commission
    await creditPlatform(platformFee);
  }
}
```

### 2. Escrow State Machine

```typescript
const escrowStates = {
  pending_payment: ['payment_processing', 'cancelled'],
  payment_processing: ['locked', 'failed'],
  locked: ['work_in_progress'],
  work_in_progress: ['work_submitted', 'disputed', 'refunding'],
  work_submitted: ['under_review'],
  under_review: ['approved', 'rejected', 'disputed'],
  approved: ['releasing'],
  releasing: ['released'],
  released: [],
  refunding: ['refunded'],
  refunded: [],
  disputed: ['releasing', 'refunding']
};

function validateStateTransition(currentState: string, newState: string) {
  const allowedStates = escrowStates[currentState];
  if (!allowedStates.includes(newState)) {
    throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
  }
}
```

### 3. Matching Score Implementation

See BACKEND_BUSINESS_LOGIC.md section on "Matching Algorithm" for complete implementation.

---

## API Authentication Flow

### JWT Token Structure

```json
{
  "accessToken": {
    "userId": "uuid",
    "email": "string",
    "role": "influencer | sponsor | agent | admin",
    "exp": "timestamp (15 mins from issue)"
  },
  "refreshToken": {
    "userId": "uuid",
    "tokenId": "uuid",
    "exp": "timestamp (7 days from issue)"
  }
}
```

### Authentication Middleware

```typescript
async function authenticateRequest(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUserById(decoded.userId);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Database Migration Strategy

### Migration Tools
- Use **Prisma Migrate** or **TypeORM Migrations**
- Version all schema changes
- Test migrations on staging before production

### Migration Best Practices
1. Always create migrations for schema changes
2. Never modify existing migrations
3. Include rollback logic
4. Test with production-like data volume
5. Run migrations during low-traffic windows

---

## Testing Strategy

### Unit Tests
- Test individual functions and utilities
- Mock external dependencies
- Target: 70%+ code coverage

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Test authentication and authorization
- Test business logic workflows

### Load Testing
- Use tools like k6, JMeter, or Artillery
- Test with realistic traffic patterns
- Identify bottlenecks
- Test auto-scaling

---

## Security Checklist

### Authentication & Authorization
- [ ] Implement JWT with short expiration
- [ ] Rotate refresh tokens
- [ ] Implement rate limiting on login
- [ ] Add account lockout after failed attempts
- [ ] Validate all user inputs
- [ ] Implement RBAC properly

### Data Protection
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS everywhere
- [ ] Hash passwords with bcrypt (min 10 rounds)
- [ ] Never log sensitive information
- [ ] Implement CORS properly
- [ ] Validate all file uploads

### Payment Security
- [ ] Never store credit card numbers
- [ ] Use Stripe's tokenization
- [ ] Verify webhook signatures
- [ ] Implement idempotency
- [ ] Add transaction logging
- [ ] Set up fraud detection

---

## Monitoring & Alerts

### Key Metrics to Monitor
- Request latency (p50, p95, p99)
- Error rate
- Database connection pool usage
- Redis memory usage
- Payment success/failure rate
- Escrow state distribution
- Queue depth

### Alerts to Configure
- API error rate > 5%
- Database CPU > 80%
- Payment failure rate > 10%
- Queue backlog > 1000 items
- Disk space < 20%

---

## Environment Variables

### Required Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.sourceimpact.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/sourceimpact
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Coinbase
COINBASE_API_KEY=...
COINBASE_WEBHOOK_SECRET=...

# Email
SENDGRID_API_KEY=...
FROM_EMAIL=noreply@sourceimpact.app

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Push Notifications
FCM_SERVER_KEY=...

# AWS (if using S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=...
DATADOG_API_KEY=...
```

---

## API Rate Limiting

### Rate Limit Tiers

| Tier | Requests/Hour | Burst |
|------|---------------|-------|
| Anonymous | 100 | 10 |
| Authenticated | 1,000 | 100 |
| Premium | 5,000 | 500 |
| Admin | Unlimited | N/A |

### Implementation

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    if (req.user?.isPremium) return 5000;
    if (req.user) return 1000;
    return 100;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run all tests
- [ ] Check code coverage
- [ ] Review security audit results
- [ ] Update API documentation
- [ ] Create deployment plan
- [ ] Notify team of deployment window

### Deployment Steps
1. Create database backup
2. Run database migrations
3. Deploy new backend code
4. Run smoke tests
5. Monitor error rates
6. Rollback if issues detected

### Post-Deployment
- [ ] Verify all endpoints working
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Verify payments working
- [ ] Test critical user flows
- [ ] Update changelog

---

## Support & Maintenance

### Daily Tasks
- Check error logs
- Monitor performance metrics
- Review payment transactions
- Check escrow job status
- Review support tickets

### Weekly Tasks
- Review database performance
- Check security logs
- Update dependencies
- Review and merge PRs
- Plan feature improvements

### Monthly Tasks
- Security audit
- Performance optimization review
- Database cleanup
- Backup verification
- Infrastructure cost review

---

## Conclusion

This implementation guide provides a complete roadmap for building the Source Impact backend. Follow the phases sequentially, refer to the detailed documentation in the other files, and ensure all business logic is implemented according to specifications.

**Key Success Factors:**
1. Implement commission logic exactly as specified
2. Secure escrow workflow is critical
3. Real-time features enhance UX
4. Proper monitoring prevents issues
5. Security is non-negotiable

**Next Steps:**
1. Set up development environment
2. Create project repository
3. Begin Phase 1 implementation
4. Schedule regular code reviews
5. Deploy staging environment

For questions or clarifications on any aspect of the implementation, refer to:
- **BACKEND_API_SPEC.md** for API details
- **BACKEND_DATA_MODELS.md** for database schema
- **BACKEND_BUSINESS_LOGIC.md** for business rules

Good luck with the implementation!
