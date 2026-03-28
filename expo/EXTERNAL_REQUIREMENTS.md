# External Requirements & Backend Implementation

This document outlines all the external systems, backend services, and infrastructure that need to be implemented outside of the React Native app codebase.

## 1. Deep Linking & Universal Links

### iOS Universal Links
- **Domain Setup**: Configure associated domains in Apple Developer account
- **AASA File**: Host `apple-app-site-association` file at `https://yourdomain.com/.well-known/apple-app-site-association`
- **Content**:
  ```json
  {
    "applinks": {
      "apps": [],
      "details": [{
        "appID": "TEAM_ID.BUNDLE_ID",
        "paths": ["/invite/*", "/deal/*", "/profile/*"]
      }]
    }
  }
  ```

### Android App Links
- **Domain Setup**: Configure intent filters in app
- **Asset Links File**: Host `assetlinks.json` at `https://yourdomain.com/.well-known/assetlinks.json`
- **Content**:
  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourapp.package",
      "sha256_cert_fingerprints": ["CERT_FINGERPRINT"]
    }
  }]
  ```

### Dynamic Link Service
- **Purpose**: Convert app deep links to web URLs for sharing
- **Endpoints Needed**:
  - `POST /api/links/create` - Generate short link
  - `GET /invite/:code` - Redirect to app or app store
  - `GET /deal/:id` - Redirect to app or app store
  - `GET /profile/:id` - Redirect to app or app store
- **Logic**: Detect user agent, redirect to app store if app not installed, otherwise open app

## 2. Authentication & User Management

### OAuth Providers
- **Google OAuth**:
  - Client ID and Secret
  - Redirect URIs configured
  - API Console project setup
  
- **Apple Sign In**:
  - Service ID configured
  - Return URLs configured
  - Private key for token verification

### Backend Auth Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user

### Session Management
- JWT token generation and validation
- Refresh token rotation
- Session storage (Redis recommended)

## 3. Real-Time Messaging Infrastructure

### WebSocket Server
- **Technology**: Socket.io, Pusher, or AWS AppSync
- **Events**:
  - `message:new` - New message received
  - `message:read` - Message read receipt
  - `message:typing` - Typing indicator
  - `conversation:updated` - Conversation metadata changed
  - `user:online` - User online status

### Message Storage
- **Database**: PostgreSQL or MongoDB
- **Tables/Collections**:
  - `conversations` - Conversation metadata
  - `messages` - Individual messages
  - `participants` - Conversation participants
  - `read_receipts` - Message read status

### Push Notifications
- **APNs** (Apple Push Notification service):
  - Certificate or token-based auth
  - Production and development certificates
  
- **FCM** (Firebase Cloud Messaging):
  - Server key
  - Sender ID
  
- **Endpoints**:
  - `POST /api/notifications/register` - Register device token
  - `POST /api/notifications/send` - Send notification

## 4. File Storage & CDN

### Media Upload Service
- **Storage**: AWS S3, Google Cloud Storage, or Cloudinary
- **Endpoints**:
  - `POST /api/upload/image` - Upload image
  - `POST /api/upload/video` - Upload video
  - `POST /api/upload/document` - Upload document
  - `GET /api/upload/signed-url` - Get signed upload URL

### CDN Configuration
- CloudFront, Cloudflare, or similar
- Image optimization and resizing
- Video transcoding for different qualities

## 5. Payment Processing

### Payment Gateway Integration
- **Stripe**:
  - Account setup
  - API keys (publishable and secret)
  - Webhook endpoint: `POST /api/webhooks/stripe`
  - Connected accounts for marketplace
  
- **PayPal** (optional):
  - Business account
  - API credentials
  - Webhook endpoint: `POST /api/webhooks/paypal`

### Payment Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/refund` - Process refund
- `POST /api/payouts/create` - Create payout to influencer
- `GET /api/payouts/status/:id` - Check payout status

### Escrow System
- Hold funds until deal completion
- Automatic release logic
- Dispute resolution workflow

## 6. Email Service

### Email Provider
- **Options**: SendGrid, AWS SES, Mailgun, Postmark
- **Templates Needed**:
  - Welcome email
  - Email verification
  - Password reset
  - Deal invitation
  - Deal accepted/rejected
  - Payment received
  - Weekly digest
  - Referral invitation

### Email Endpoints
- `POST /api/email/send` - Send transactional email
- `POST /api/email/verify` - Verify email address
- `GET /api/email/unsubscribe/:token` - Unsubscribe from emails

## 7. SMS Service (Optional)

### SMS Provider
- **Options**: Twilio, AWS SNS, MessageBird
- **Use Cases**:
  - Phone verification
  - Two-factor authentication
  - Important notifications

### SMS Endpoints
- `POST /api/sms/send` - Send SMS
- `POST /api/sms/verify` - Verify phone number

## 8. Social Media Integration

### Instagram API
- **Requirements**:
  - Facebook Developer account
  - Instagram Business account
  - App review for permissions
- **Endpoints**:
  - Get user profile
  - Get follower count
  - Get engagement metrics
  - Verify account ownership

### TikTok API
- **Requirements**:
  - TikTok Developer account
  - App registration
- **Endpoints**:
  - Get user profile
  - Get follower count
  - Get video metrics

### YouTube API
- **Requirements**:
  - Google Cloud project
  - YouTube Data API enabled
- **Endpoints**:
  - Get channel info
  - Get subscriber count
  - Get video metrics

### Twitter/X API
- **Requirements**:
  - Developer account
  - API keys
- **Endpoints**:
  - Get user profile
  - Get follower count

## 9. Analytics & Monitoring

### Analytics Service
- **Options**: Mixpanel, Amplitude, Google Analytics
- **Events to Track**:
  - User registration
  - Profile completion
  - Deal creation
  - Deal application
  - Message sent
  - Payment completed
  - Referral sent

### Error Tracking
- **Options**: Sentry, Bugsnag, Rollbar
- **Setup**: SDK integration and error reporting

### Performance Monitoring
- **Options**: New Relic, Datadog, AppDynamics
- **Metrics**: API response times, database queries, error rates

## 10. Search & Discovery

### Search Service
- **Options**: Elasticsearch, Algolia, Typesense
- **Indexed Data**:
  - User profiles
  - Deals/gigs
  - Locations
  - Skills/categories

### Search Endpoints
- `GET /api/search/users` - Search users
- `GET /api/search/deals` - Search deals
- `GET /api/search/suggest` - Autocomplete suggestions

## 11. Geolocation Services

### Location API
- **Options**: Google Maps API, Mapbox
- **Features**:
  - Geocoding (address to coordinates)
  - Reverse geocoding (coordinates to address)
  - Distance calculation
  - Location-based search

### Endpoints
- `GET /api/location/geocode` - Convert address to coordinates
- `GET /api/location/reverse` - Convert coordinates to address
- `GET /api/location/nearby` - Find nearby users/deals

## 12. Content Moderation

### Moderation Service
- **Options**: AWS Rekognition, Google Cloud Vision, Sightengine
- **Features**:
  - Image content moderation
  - Text profanity filtering
  - User-generated content review

### Endpoints
- `POST /api/moderation/image` - Moderate image
- `POST /api/moderation/text` - Moderate text

## 13. Referral & Invite System

### Referral Tracking
- **Database Tables**:
  - `referral_codes` - Unique codes per user
  - `referrals` - Track who referred whom
  - `referral_rewards` - Track rewards earned

### Endpoints
- `GET /api/referrals/code` - Get user's referral code
- `POST /api/referrals/validate` - Validate referral code
- `GET /api/referrals/stats` - Get referral statistics
- `POST /api/referrals/reward` - Process referral reward

## 14. CSV Import/Export

### Import Service
- **Endpoints**:
  - `POST /api/import/contacts` - Upload CSV file
  - `GET /api/import/template` - Download CSV template
  - `GET /api/import/status/:id` - Check import status

### CSV Template Structure
```csv
name,email,phone,instagram,tiktok,youtube,twitter,notes
John Doe,john@example.com,+1234567890,@johndoe,@johndoe,@johndoe,@johndoe,VIP contact
```

### Processing
- Validate CSV format
- Parse and validate data
- Queue for background processing
- Send email when complete

## 15. Gmail Contacts Import

### Google Contacts API
- **Requirements**:
  - Google Cloud project
  - People API enabled
  - OAuth 2.0 credentials
  - Scopes: `https://www.googleapis.com/auth/contacts.readonly`

### Implementation
- OAuth flow to get user consent
- Fetch contacts from Google People API
- Parse and format contact data
- Allow user to select contacts to import

### Endpoints
- `GET /api/contacts/google/auth` - Initiate OAuth
- `GET /api/contacts/google/callback` - OAuth callback
- `GET /api/contacts/google/list` - Fetch contacts
- `POST /api/contacts/google/import` - Import selected contacts

## 16. Admin Dashboard (Web)

### Admin Portal
- **Technology**: Next.js, React Admin, or similar
- **Features**:
  - User management
  - Deal moderation
  - Payment oversight
  - Rewards management
  - Analytics dashboard
  - Content moderation queue

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/suspend` - Suspend user
- `GET /api/admin/deals` - List all deals
- `PUT /api/admin/deals/:id/moderate` - Moderate deal
- `GET /api/admin/analytics` - Get analytics data

## 17. Cron Jobs & Background Tasks

### Scheduled Tasks
- **Daily**:
  - Send digest emails
  - Calculate rewards
  - Clean up expired deals
  - Generate analytics reports
  
- **Hourly**:
  - Sync social media metrics
  - Process pending payments
  
- **Weekly**:
  - Generate weekly summaries
  - Clean up old data

### Task Queue
- **Options**: Bull (Redis), AWS SQS, RabbitMQ
- **Tasks**:
  - Email sending
  - Push notifications
  - CSV processing
  - Image processing
  - Social media sync

## 18. Database Schema

### Core Tables
- `users` - User accounts
- `profiles` - User profiles (influencer/brand/agent)
- `deals` - Deal/gig listings
- `applications` - Deal applications
- `conversations` - Message threads
- `messages` - Individual messages
- `payments` - Payment records
- `rewards` - Rewards and points
- `referrals` - Referral tracking
- `notifications` - Notification history
- `social_accounts` - Linked social media accounts
- `verification_requests` - Social media verification
- `contacts` - Imported contacts

## 19. API Rate Limiting

### Rate Limiter
- **Implementation**: Redis-based rate limiting
- **Limits**:
  - Authentication: 5 requests/minute
  - API calls: 100 requests/minute
  - File uploads: 10 requests/minute
  - Search: 30 requests/minute

## 20. Backup & Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups
- **File Storage**: Versioning enabled
- **Retention**: 30 days minimum

### Disaster Recovery
- Multi-region deployment
- Failover procedures
- Data restoration process

## 21. Cryptocurrency & Token System

### Blockchain Integration
- **Purpose**: Allow users to withdraw reward tokens to crypto wallets
- **Requirements**:
  - Choose blockchain network (Ethereum, Polygon, BSC, Solana, etc.)
  - Smart contract development for token
  - Token contract deployment
  - Wallet integration for withdrawals

### Token Management
- **Token Standard**: ERC-20 (Ethereum), SPL (Solana), or similar
- **Features**:
  - Token minting (for rewards)
  - Token burning (if needed)
  - Transfer functionality
  - Balance checking

### Crypto Wallet Integration
- **Web3 Provider**: Web3.js, Ethers.js, or similar
- **Wallet Support**:
  - MetaMask
  - WalletConnect
  - Coinbase Wallet
  - Trust Wallet

### Endpoints
- `POST /api/crypto/link-wallet` - Link crypto wallet to account
- `GET /api/crypto/balance` - Get token balance
- `POST /api/crypto/withdraw` - Initiate token withdrawal to wallet
- `GET /api/crypto/transactions` - Get token transaction history
- `GET /api/crypto/wallet/:address/verify` - Verify wallet ownership

### Security Considerations
- **Hot Wallet**: For automated transactions (with limited funds)
- **Cold Wallet**: For token reserves
- **Multi-sig**: For large transactions
- **Gas Fee Management**: Cover gas fees or require users to pay
- **Transaction Monitoring**: Monitor for suspicious activity

### Compliance
- **KYC/AML**: May be required for token withdrawals above certain thresholds
- **Securities Laws**: Ensure token doesn't qualify as security
- **Tax Reporting**: Provide transaction history for tax purposes

### Third-Party Services
- **Blockchain Node Provider**: Infura, Alchemy, or QuickNode
- **Token Contract**: Custom development or fork existing
- **Wallet-as-a-Service**: Consider Torus, Magic, or similar for easier UX
- **Exchange Listings**: If tokens will be tradeable

### Cost Estimates
- **Smart Contract Development**: $5,000-20,000 (one-time)
- **Smart Contract Audit**: $10,000-50,000 (one-time, highly recommended)
- **Node Provider**: $50-500/month
- **Gas Fees**: Variable, depends on network and volume
- **Legal Review**: $5,000-15,000 (one-time)

## 22. Native Contact Access

### iOS Contacts
- **Requirements**:
  - `NSContactsUsageDescription` in Info.plist
  - Contacts framework permission
- **Implementation**:
  - Request contacts permission
  - Access iOS Contacts framework via Expo Contacts API
  - Parse contact data (name, phone, email)
  - Filter and deduplicate contacts

### Android Contacts
- **Requirements**:
  - `READ_CONTACTS` permission in AndroidManifest.xml
  - Runtime permission request
- **Implementation**:
  - Request contacts permission
  - Access Android Contacts Provider
  - Parse contact data
  - Handle different contact formats

### Contact Sync Backend
- **Endpoints**:
  - `POST /api/contacts/sync` - Sync imported contacts
  - `POST /api/contacts/match` - Match contacts with existing users
  - `GET /api/contacts/suggestions` - Get suggestions based on contacts

### Privacy Considerations
- **Hashing**: Hash phone numbers/emails before sending to server
- **Consent**: Clear user consent for contact access
- **Storage**: Minimal storage of contact data
- **Deletion**: Allow users to remove synced contacts

### Data Processing
- **Deduplication**: Remove duplicate contacts
- **Normalization**: Standardize phone numbers (E.164 format)
- **Matching Algorithm**: Match contacts with existing users
- **Batch Processing**: Handle large contact lists efficiently

## 23. Compliance & Legal

### GDPR Compliance
- Data export functionality
- Data deletion functionality
- Cookie consent (web)
- Privacy policy endpoint

### Terms of Service
- User agreement acceptance tracking
- Version control for terms updates

### Endpoints
- `GET /api/user/data-export` - Export user data
- `DELETE /api/user/account` - Delete account and data
- `POST /api/legal/accept-terms` - Accept terms

## 24. Testing Infrastructure

### Testing Environments
- **Development**: Local development
- **Staging**: Pre-production testing
- **Production**: Live environment

### Test Data
- Seed data for testing
- Mock payment processing
- Test user accounts

## Summary: Third-Party Services & Integrations Needed

This is a comprehensive checklist of all external services, APIs, and infrastructure required for the app to function as designed.

### Authentication & Social Login
- [ ] Google OAuth (Client ID, Secret, Redirect URIs)
- [ ] Apple Sign In (Service ID, Return URLs, Private Key)
- [ ] JWT token management system

### Payment Processing
- [ ] Stripe Account (API keys, Connected Accounts setup)
- [ ] Stripe Webhook endpoint configuration
- [ ] PayPal Business Account (optional)

### Cryptocurrency/Tokens
- [ ] Blockchain Network selection and setup
- [ ] Smart Contract development & deployment
- [ ] Smart Contract security audit (required for production)
- [ ] Blockchain node provider (Infura/Alchemy/QuickNode)
- [ ] Hot/Cold wallet setup
- [ ] KYC/AML provider (if needed)
- [ ] Legal review for token compliance

### Social Media APIs
- [ ] Instagram Business API (Facebook Developer account, App Review)
- [ ] TikTok Developer Account & API access
- [ ] YouTube Data API (Google Cloud project)
- [ ] Twitter/X API (Developer account, API keys)

### Communication Services
- [ ] Email Provider (SendGrid/AWS SES/Mailgun)
  - [ ] Domain verification
  - [ ] Email templates setup
- [ ] SMS Provider (Twilio/AWS SNS) - optional
- [ ] Push Notifications (APNs certificates, FCM server key)

### Real-Time Messaging
- [ ] WebSocket server (Socket.io/Pusher/AWS AppSync)
- [ ] Message storage database
- [ ] Redis for real-time state management

### Storage & CDN
- [ ] File Storage (AWS S3/Google Cloud Storage/Cloudinary)
- [ ] CDN setup (CloudFront/Cloudflare)
- [ ] Image optimization service
- [ ] Video transcoding service

### Contact Import
- [ ] Google People API setup (OAuth credentials, People API enabled)
- [ ] iOS Contacts permission configuration
- [ ] Android Contacts permission configuration
- [ ] Contact matching algorithm backend

### Deep Linking
- [ ] Domain registration and DNS setup
- [ ] iOS Universal Links (AASA file hosting)
- [ ] Android App Links (assetlinks.json hosting)
- [ ] Dynamic link service backend

### Search & Discovery
- [ ] Search service (Elasticsearch/Algolia/Typesense)
- [ ] Location API (Google Maps/Mapbox)

### Monitoring & Analytics
- [ ] Analytics platform (Mixpanel/Amplitude/Google Analytics)
- [ ] Error tracking (Sentry/Bugsnag/Rollbar)
- [ ] Performance monitoring (New Relic/Datadog)
- [ ] Application Performance Monitoring (APM)

### Content Moderation
- [ ] Image moderation (AWS Rekognition/Google Cloud Vision/Sightengine)
- [ ] Text profanity filtering

### Database & Infrastructure
- [ ] Primary Database (PostgreSQL recommended)
- [ ] Cache Layer (Redis)
- [ ] Cloud hosting provider (AWS/Google Cloud/Azure)
- [ ] Backup & disaster recovery setup
- [ ] Environment setup (Dev/Staging/Production)

### Backend APIs (All require custom development)
- [ ] Authentication endpoints
- [ ] User management endpoints
- [ ] Messaging endpoints
- [ ] Payment processing endpoints
- [ ] Deal/gig management endpoints
- [ ] Rewards system endpoints
- [ ] Referral system endpoints
- [ ] Admin dashboard endpoints
- [ ] Webhook handlers (Stripe, social media, etc.)

### Background Jobs
- [ ] Task queue system (Bull/AWS SQS/RabbitMQ)
- [ ] Cron job scheduler
- [ ] Email sending queue
- [ ] Social media sync jobs
- [ ] Reward calculation jobs

### Security & Compliance
- [ ] SSL/TLS certificates
- [ ] API rate limiting system
- [ ] GDPR compliance features (data export/deletion)
- [ ] Terms of Service acceptance tracking
- [ ] Privacy Policy hosting
- [ ] Cookie consent (for web)

### Admin Tools
- [ ] Admin Dashboard (web portal)
- [ ] User management interface
- [ ] Content moderation queue
- [ ] Analytics dashboard
- [ ] Payment oversight tools

### Testing
- [ ] Staging environment setup
- [ ] Test data seeding
- [ ] Mock payment processing for testing
- [ ] CI/CD pipeline

## Implementation Priority

### Phase 1 (MVP - Critical)
1. Authentication & User Management
2. Database Schema
3. Real-Time Messaging (basic)
4. File Storage & CDN
5. Deep Linking (basic)

### Phase 2 (Core Features)
6. Payment Processing (Stripe)
7. Email Service
8. Push Notifications
9. Social Media Integration
10. Search & Discovery

### Phase 3 (Enhanced Features)
11. Native Contacts Import
12. CSV Import/Export
13. Gmail Contacts Import
14. Analytics & Monitoring
15. Content Moderation
16. Referral System (backend)

### Phase 4 (Advanced)
17. Cryptocurrency/Token System
18. Admin Dashboard
19. Cron Jobs & Background Tasks
20. SMS Service
21. Advanced Analytics
22. Compliance Features

## Estimated Development Time

- **Phase 1**: 4-6 weeks
- **Phase 2**: 6-8 weeks
- **Phase 3**: 6-8 weeks
- **Phase 4**: 8-12 weeks (includes crypto/token system)

**Total**: 24-34 weeks (6-8.5 months) for full implementation

**Note**: Cryptocurrency integration adds significant complexity and requires:
- Smart contract development: 2-4 weeks
- Security audit: 2-4 weeks
- Legal review: 1-2 weeks
- Integration & testing: 2-3 weeks

## Technology Stack Recommendations

### Backend Framework
- **Node.js**: Express.js or NestJS
- **Python**: Django or FastAPI
- **Go**: Gin or Echo
- **Ruby**: Rails

### Database
- **Primary**: PostgreSQL (relational data)
- **Cache**: Redis (sessions, rate limiting)
- **Search**: Elasticsearch or Algolia
- **Real-time**: Firebase or Supabase (alternative)

### Infrastructure
- **Cloud**: AWS, Google Cloud, or Azure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (for scale)
- **CI/CD**: GitHub Actions, GitLab CI, or CircleCI

### Third-Party Services
- **Auth**: Auth0 or Firebase Auth (alternative to custom)
- **Payments**: Stripe
- **Crypto**: Infura/Alchemy (blockchain node provider)
- **Email**: SendGrid
- **SMS**: Twilio
- **Storage**: AWS S3
- **CDN**: CloudFront or Cloudflare
- **Monitoring**: Sentry + Datadog
- **Analytics**: Mixpanel or Amplitude
- **Contacts**: Google People API (for Gmail contacts)

## Cost Estimates (Monthly)

### Minimal MVP
- **Hosting**: $50-200
- **Database**: $50-100
- **Storage**: $20-50
- **Email**: $10-30
- **Total**: ~$130-380/month

### Production Scale (1000+ users)
- **Hosting**: $200-500
- **Database**: $100-300
- **Storage**: $50-200
- **Email**: $50-100
- **SMS**: $50-200
- **Payment Processing**: 2.9% + $0.30 per transaction
- **Blockchain Node**: $50-200
- **Gas Fees**: $100-500 (for token withdrawals)
- **CDN**: $50-150
- **Monitoring**: $50-100
- **Total**: ~$700-2,250/month + transaction fees

### Enterprise Scale (10,000+ users)
- **Hosting**: $500-2,000
- **Database**: $300-1,000
- **Storage**: $200-500
- **Email**: $100-300
- **SMS**: $200-500
- **Blockchain Node**: $200-500
- **Gas Fees**: $500-2,000
- **CDN**: $150-500
- **Monitoring**: $100-300
- **Total**: ~$2,250-7,600/month + transaction fees

### One-Time Costs (If implementing crypto)
- **Smart Contract Development**: $5,000-20,000
- **Security Audit**: $10,000-50,000 (highly recommended)
- **Legal Review**: $5,000-15,000
- **Total One-Time**: $20,000-85,000

## Next Steps

1. **Choose Technology Stack**: Decide on backend framework and infrastructure
2. **Set Up Development Environment**: Configure dev, staging, and production
3. **Implement Phase 1**: Focus on MVP features
4. **Deploy Staging**: Test with real devices
5. **Iterate**: Add features based on user feedback
6. **Scale**: Optimize and scale infrastructure as needed

## Notes

- All endpoints listed are examples and should follow RESTful conventions
- Authentication should use JWT tokens with refresh token rotation
- All sensitive data should be encrypted at rest and in transit
- Implement proper logging and monitoring from day one
- Use environment variables for all configuration
- Follow security best practices (OWASP guidelines)
- Implement proper error handling and user-friendly error messages
- Use API versioning (e.g., `/api/v1/...`) for future compatibility
