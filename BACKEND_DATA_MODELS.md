# Backend Data Models & Database Schema

## Overview
This document defines all database schemas, relationships, and data models for the Source Impact platform. The recommended database is PostgreSQL with support for real-time subscriptions.

---

## Table of Contents
1. [Users & Authentication](#users--authentication)
2. [Gigs & Deals](#gigs--deals)
3. [Messaging](#messaging)
4. [Payments & Transactions](#payments--transactions)
5. [Agent System](#agent-system)
6. [Rewards & Gamification](#rewards--gamification)
7. [Wallet & Crypto](#wallet--crypto)
8. [Analytics & Tracking](#analytics--tracking)
9. [Relationships](#relationships)
10. [Indexes](#indexes)

---

## Users & Authentication

### Table: `users`
Primary table for all user accounts.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('influencer', 'sponsor', 'agent', 'admin')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  stripe_connected_account_id VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  stripe_verification_status VARCHAR(20) DEFAULT 'not_started',
  stripe_verified_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

---

### Table: `influencer_profiles`
Extended profile data for influencers.

```sql
CREATE TABLE influencer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  influencer_type VARCHAR(100),
  sports TEXT[], -- Array of sports for athletes
  categories TEXT[] NOT NULL,
  location VARCHAR(255),
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  platforms JSONB, -- {instagram: "@user", tiktok: "@user", ...}
  portfolio JSONB, -- Array of portfolio items
  rate_per_post DECIMAL(10,2),
  payment_preferences TEXT[] DEFAULT ARRAY['fiat'], -- ['fiat', 'crypto']
  accepted_cryptos TEXT[], -- ['BTC', 'ETH', 'USDT', 'USDC']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_influencer_profiles_categories ON influencer_profiles USING GIN(categories);
CREATE INDEX idx_influencer_profiles_location ON influencer_profiles(location);
CREATE INDEX idx_influencer_profiles_followers ON influencer_profiles(followers DESC);
CREATE INDEX idx_influencer_profiles_rate ON influencer_profiles(rate_per_post);
```

---

### Table: `social_accounts`
Verified social media accounts for influencers.

```sql
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'facebook')),
  username VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_verified ON social_accounts(is_verified) WHERE is_verified = true;
```

---

### Table: `sponsor_profiles`
Extended profile data for sponsors (brands).

```sql
CREATE TABLE sponsor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(255),
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sponsor_profiles_industry ON sponsor_profiles(industry);
CREATE INDEX idx_sponsor_profiles_location ON sponsor_profiles(location);
```

---

### Table: `agent_profiles`
Extended profile data for agents.

```sql
CREATE TABLE agent_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[],
  is_subscribed BOOLEAN DEFAULT false,
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  auto_payout_threshold DECIMAL(10,2),
  next_payout_date TIMESTAMP WITH TIME ZONE,
  verification_level VARCHAR(30) DEFAULT 'unverified',
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  id_verified BOOLEAN DEFAULT false,
  recruit_satisfaction_score DECIMAL(2,1),
  recruit_satisfaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_profiles_tier ON agent_profiles(tier);
CREATE INDEX idx_agent_profiles_subscribed ON agent_profiles(is_subscribed) WHERE is_subscribed = true;
CREATE INDEX idx_agent_profiles_total_earnings ON agent_profiles(total_earnings DESC);
```

---

### Table: `agent_performance_metrics`
Performance tracking for agents.

```sql
CREATE TABLE agent_performance_metrics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_deals INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  verified_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  average_conversion_time DECIMAL(10,2), -- Days
  response_time DECIMAL(10,2), -- Hours
  satisfaction_score DECIMAL(2,1),
  performance_score DECIMAL(10,2),
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table: `admin_profiles`
Extended profile data for admins.

```sql
CREATE TABLE admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL, -- Array of permission strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table: `refresh_tokens`
JWT refresh tokens for session management.

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

---

## Gigs & Deals

### Table: `gigs`
Job postings created by sponsors.

```sql
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2),
  budget_min DECIMAL(10,2) NOT NULL,
  budget_max DECIMAL(10,2) NOT NULL,
  categories TEXT[] NOT NULL,
  influencer_types TEXT[] NOT NULL,
  athlete_sports TEXT[],
  location VARCHAR(255),
  requirements TEXT[],
  deliverables TEXT[],
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_budget CHECK (budget_max >= budget_min)
);

CREATE INDEX idx_gigs_sponsor_id ON gigs(sponsor_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_categories ON gigs USING GIN(categories);
CREATE INDEX idx_gigs_influencer_types ON gigs USING GIN(influencer_types);
CREATE INDEX idx_gigs_location ON gigs(location);
CREATE INDEX idx_gigs_created_at ON gigs(created_at DESC);
CREATE INDEX idx_gigs_budget ON gigs(budget_min, budget_max);
```

---

### Table: `gig_applications`
Applications submitted by influencers for gigs.

```sql
CREATE TABLE gig_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  UNIQUE(gig_id, influencer_id)
);

CREATE INDEX idx_gig_applications_gig_id ON gig_applications(gig_id);
CREATE INDEX idx_gig_applications_influencer_id ON gig_applications(influencer_id);
CREATE INDEX idx_gig_applications_status ON gig_applications(status);
CREATE INDEX idx_gig_applications_applied_at ON gig_applications(applied_at DESC);
```

---

### Table: `deals`
Confirmed collaborations between sponsors and influencers.

```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id),
  influencer_id UUID NOT NULL REFERENCES users(id),
  sponsor_id UUID NOT NULL REFERENCES users(id),
  agent_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  agent_commission DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(20) CHECK (payment_method IN ('stripe', 'coinbase')),
  contract_hash TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deals_gig_id ON deals(gig_id);
CREATE INDEX idx_deals_influencer_id ON deals(influencer_id);
CREATE INDEX idx_deals_sponsor_id ON deals(sponsor_id);
CREATE INDEX idx_deals_agent_id ON deals(agent_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
```

---

### Table: `saved_gigs`
Gigs saved by users (sponsors or influencers).

```sql
CREATE TABLE saved_gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, gig_id)
);

CREATE INDEX idx_saved_gigs_user_id ON saved_gigs(user_id);
CREATE INDEX idx_saved_gigs_gig_id ON saved_gigs(gig_id);
```

---

### Table: `gig_comparisons`
Collections of gigs for comparison.

```sql
CREATE TABLE gig_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  gig_ids UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gig_comparisons_user_id ON gig_comparisons(user_id);
```

---

### Table: `brand_reputations`
Reputation scores for sponsors.

```sql
CREATE TABLE brand_reputations (
  sponsor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  overall_rating DECIMAL(2,1) DEFAULT 0,
  payment_speed_rating DECIMAL(2,1) DEFAULT 0,
  communication_rating DECIMAL(2,1) DEFAULT 0,
  professionalism_rating DECIMAL(2,1) DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  average_payment_time DECIMAL(10,2), -- Days
  review_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table: `negotiations`
Price negotiations between sponsors and influencers.

```sql
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES users(id),
  sponsor_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_negotiations_gig_id ON negotiations(gig_id);
CREATE INDEX idx_negotiations_influencer_id ON negotiations(influencer_id);
CREATE INDEX idx_negotiations_sponsor_id ON negotiations(sponsor_id);
CREATE INDEX idx_negotiations_status ON negotiations(status);
```

---

### Table: `negotiation_offers`
Individual offers within a negotiation.

```sql
CREATE TABLE negotiation_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  deliverables TEXT[],
  timeline VARCHAR(255),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_negotiation_offers_negotiation_id ON negotiation_offers(negotiation_id);
CREATE INDEX idx_negotiation_offers_from_user_id ON negotiation_offers(from_user_id);
```

---

## Messaging

### Table: `conversations`
Message threads between users.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants UUID[] NOT NULL, -- Array of user IDs
  deal_id UUID REFERENCES deals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_deal_id ON conversations(deal_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

---

### Table: `messages`
Individual messages within conversations.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by UUID[] DEFAULT ARRAY[]::UUID[], -- Array of user IDs who read the message
  attachments JSONB
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read_by ON messages USING GIN(read_by);
```

---

## Payments & Transactions

### Table: `user_balances`
User account balances for different currencies.

```sql
CREATE TABLE user_balances (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd' CHECK (currency IN ('usd', 'btc', 'eth')),
  available_balance DECIMAL(15,2) DEFAULT 0,
  escrow_balance DECIMAL(15,2) DEFAULT 0,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  total_withdrawals DECIMAL(15,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, currency)
);

CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);
```

---

### Table: `transactions`
All financial transactions on the platform.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(30) NOT NULL CHECK (type IN ('payment_in', 'escrow_lock', 'release', 'commission_deduct', 'agent_commission', 'withdrawal', 'refund')),
  job_id UUID,
  gig_id UUID REFERENCES gigs(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  fee DECIMAL(15,2) DEFAULT 0,
  attributed_agent_id UUID REFERENCES users(id),
  recruited_type VARCHAR(20) CHECK (recruited_type IN ('sponsor', 'influencer', 'both')),
  split_percentage INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_id TEXT,
  description TEXT
);

CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_attributed_agent ON transactions(attributed_agent_id);
```

---

### Table: `escrow_jobs`
Escrow management for deals.

```sql
CREATE TABLE escrow_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id),
  application_id UUID NOT NULL REFERENCES gig_applications(id),
  sponsor_id UUID NOT NULL REFERENCES users(id),
  influencer_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(30) DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'payment_processing', 'locked', 'work_in_progress', 'work_submitted', 'under_review', 'approved', 'releasing', 'released', 'refunding', 'refunded', 'disputed')),
  locked_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  sponsor_agent_id UUID REFERENCES users(id),
  influencer_agent_id UUID REFERENCES users(id),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  work_submitted_at TIMESTAMP WITH TIME ZONE,
  review_started_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  disputed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escrow_jobs_gig_id ON escrow_jobs(gig_id);
CREATE INDEX idx_escrow_jobs_application_id ON escrow_jobs(application_id);
CREATE INDEX idx_escrow_jobs_sponsor_id ON escrow_jobs(sponsor_id);
CREATE INDEX idx_escrow_jobs_influencer_id ON escrow_jobs(influencer_id);
CREATE INDEX idx_escrow_jobs_status ON escrow_jobs(status);
CREATE INDEX idx_escrow_jobs_sponsor_agent ON escrow_jobs(sponsor_agent_id);
CREATE INDEX idx_escrow_jobs_influencer_agent ON escrow_jobs(influencer_agent_id);
```

---

### Table: `withdrawals`
Withdrawal requests from users.

```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  method VARCHAR(20) NOT NULL CHECK (method IN ('stripe', 'coinbase')),
  destination TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  failure_reason TEXT
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);
```

---

## Agent System

### Table: `referrals`
Agent referrals tracking.

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recruited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recruited_user_type VARCHAR(20) NOT NULL CHECK (recruited_user_type IN ('sponsor', 'influencer')),
  recruited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_commissions_earned DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(agent_id, recruited_user_id)
);

CREATE INDEX idx_referrals_agent_id ON referrals(agent_id);
CREATE INDEX idx_referrals_recruited_user_id ON referrals(recruited_user_id);
CREATE INDEX idx_referrals_is_active ON referrals(is_active) WHERE is_active = true;
```

---

### Table: `contacts`
Agent's imported contacts.

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'imported', 'linkedin')),
  segment VARCHAR(20) CHECK (segment IN ('hot', 'warm', 'cold', 'converted', 'unresponsive')),
  tags TEXT[],
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_date DATE
);

CREATE INDEX idx_contacts_agent_id ON contacts(agent_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_segment ON contacts(segment);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
```

---

### Table: `contact_engagement`
Engagement metrics for contacts.

```sql
CREATE TABLE contact_engagement (
  contact_id UUID PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
  total_invites_sent INTEGER DEFAULT 0,
  last_invite_sent_at TIMESTAMP WITH TIME ZONE,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  response_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table: `invites`
Invitations sent by agents.

```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL CHECK (method IN ('sms', 'email', 'both')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired')),
  referral_code VARCHAR(20) NOT NULL,
  template_id UUID,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  second_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  converted_user_id UUID REFERENCES users(id),
  location VARCHAR(255),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  accepted_within_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invites_agent_id ON invites(agent_id);
CREATE INDEX idx_invites_contact_id ON invites(contact_id);
CREATE INDEX idx_invites_referral_code ON invites(referral_code);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_sent_at ON invites(sent_at DESC);
```

---

### Table: `invite_templates`
Templates for invitation messages.

```sql
CREATE TABLE invite_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  ab_test_variant VARCHAR(1) CHECK (ab_test_variant IN ('A', 'B')),
  times_used INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invite_templates_agent_id ON invite_templates(agent_id);
CREATE INDEX idx_invite_templates_is_default ON invite_templates(is_default) WHERE is_default = true;
```

---

### Table: `contact_reminders`
Scheduled reminders for follow-ups.

```sql
CREATE TABLE contact_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_contact_reminders_contact_id ON contact_reminders(contact_id);
CREATE INDEX idx_contact_reminders_scheduled_for ON contact_reminders(scheduled_for);
CREATE INDEX idx_contact_reminders_status ON contact_reminders(status);
```

---

### Table: `agent_bonuses`
Performance bonuses for agents.

```sql
CREATE TABLE agent_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  bonus_type VARCHAR(30) NOT NULL CHECK (bonus_type IN ('performance', 'milestone', 'tier_upgrade')),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  criteria JSONB
);

CREATE INDEX idx_agent_bonuses_agent_id ON agent_bonuses(agent_id);
CREATE INDEX idx_agent_bonuses_period ON agent_bonuses(period_start, period_end);
CREATE INDEX idx_agent_bonuses_status ON agent_bonuses(status);
```

---

### Table: `auto_payouts`
Automatic payout configurations for agents.

```sql
CREATE TABLE auto_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  threshold DECIMAL(10,2) NOT NULL,
  next_scheduled_date TIMESTAMP WITH TIME ZONE,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  last_payout_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auto_payouts_agent_id ON auto_payouts(agent_id);
CREATE INDEX idx_auto_payouts_is_active ON auto_payouts(is_active) WHERE is_active = true;
```

---

## Rewards & Gamification

### Table: `reward_triggers`
Definitions of events that trigger rewards.

```sql
CREATE TABLE reward_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reward_triggers_type ON reward_triggers(type);
CREATE INDEX idx_reward_triggers_is_active ON reward_triggers(is_active) WHERE is_active = true;
```

---

### Table: `reward_definitions`
Specific rewards tied to triggers.

```sql
CREATE TABLE reward_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_id UUID NOT NULL REFERENCES reward_triggers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('points', 'cash', 'crypto', 'badge')),
  amount DECIMAL(15,2),
  currency VARCHAR(10),
  badge_icon TEXT,
  badge_color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reward_definitions_trigger_id ON reward_definitions(trigger_id);
CREATE INDEX idx_reward_definitions_reward_type ON reward_definitions(reward_type);
CREATE INDEX idx_reward_definitions_is_active ON reward_definitions(is_active) WHERE is_active = true;
```

---

### Table: `user_rewards`
Rewards earned by users.

```sql
CREATE TABLE user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_definition_id UUID NOT NULL REFERENCES reward_definitions(id),
  reward_name VARCHAR(255) NOT NULL,
  reward_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2),
  currency VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT,
  metadata JSONB
);

CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status);
CREATE INDEX idx_user_rewards_reward_type ON user_rewards(reward_type);
CREATE INDEX idx_user_rewards_earned_at ON user_rewards(earned_at DESC);
```

---

### Table: `achievements`
Gamification achievements.

```sql
CREATE TABLE achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon TEXT,
  requirement INTEGER NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('earnings', 'recruits', 'conversion', 'milestone')),
  tier VARCHAR(20) CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- Pre-populate with achievement definitions
```

---

### Table: `user_achievements`
Achievements unlocked by users.

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
```

---

## Wallet & Crypto

### Table: `connected_wallets`
Crypto wallets connected by users.

```sql
CREATE TABLE connected_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(255) NOT NULL,
  network VARCHAR(20) NOT NULL CHECK (network IN ('ethereum', 'polygon', 'solana', 'bitcoin')),
  provider VARCHAR(20) CHECK (provider IN ('metamask', 'walletconnect', 'coinbase', 'trust', 'manual')),
  is_connected BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, address)
);

CREATE INDEX idx_connected_wallets_user_id ON connected_wallets(user_id);
CREATE INDEX idx_connected_wallets_address ON connected_wallets(address);
CREATE INDEX idx_connected_wallets_network ON connected_wallets(network);
```

---

### Table: `impact_token_balances`
ImPAct token balances for connected wallets.

```sql
CREATE TABLE impact_token_balances (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  balance DECIMAL(18,8) DEFAULT 0,
  locked_balance DECIMAL(18,8) DEFAULT 0,
  total_earned DECIMAL(18,8) DEFAULT 0,
  total_withdrawn DECIMAL(18,8) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, wallet_address)
);

CREATE INDEX idx_impact_balances_user_id ON impact_token_balances(user_id);
CREATE INDEX idx_impact_balances_wallet ON impact_token_balances(wallet_address);
```

---

### Table: `token_withdrawal_requests`
Withdrawal requests for ImPAct tokens.

```sql
CREATE TABLE token_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT,
  failure_reason TEXT
);

CREATE INDEX idx_token_withdrawals_user_id ON token_withdrawal_requests(user_id);
CREATE INDEX idx_token_withdrawals_status ON token_withdrawal_requests(status);
CREATE INDEX idx_token_withdrawals_requested_at ON token_withdrawal_requests(requested_at DESC);
```

---

## Analytics & Tracking

### Table: `feed_activities`
Platform-wide activity feed.

```sql
CREATE TABLE feed_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  gig_id UUID REFERENCES gigs(id),
  deal_id UUID REFERENCES deals(id),
  amount DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feed_activities_type ON feed_activities(type);
CREATE INDEX idx_feed_activities_user_id ON feed_activities(user_id);
CREATE INDEX idx_feed_activities_created_at ON feed_activities(created_at DESC);
```

---

### Table: `notifications`
User notifications.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_id UUID,
  action_url TEXT,
  action_label VARCHAR(100),
  image_url TEXT,
  metadata JSONB
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

### Table: `matches`
Swipe-based matches between users.

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gig_id UUID REFERENCES gigs(id),
  match_score INTEGER,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_id, gig_id)
);

CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_target_id ON matches(target_id);
CREATE INDEX idx_matches_gig_id ON matches(gig_id);
```

---

## Relationships

### One-to-One Relationships:
- `users` ↔ `influencer_profiles`
- `users` ↔ `sponsor_profiles`
- `users` ↔ `agent_profiles`
- `users` ↔ `admin_profiles`
- `users` ↔ `agent_performance_metrics`
- `users` ↔ `auto_payouts`
- `contacts` ↔ `contact_engagement`

### One-to-Many Relationships:
- `users` → `gigs` (sponsor creates many gigs)
- `users` → `gig_applications` (influencer applies to many gigs)
- `users` → `deals` (user has many deals)
- `users` → `messages` (user sends many messages)
- `users` → `transactions` (user has many transactions)
- `users` → `referrals` (agent has many referrals)
- `users` → `contacts` (agent has many contacts)
- `users` → `invites` (agent sends many invites)
- `users` → `user_rewards` (user earns many rewards)
- `users` → `connected_wallets` (user has many wallets)
- `gigs` → `gig_applications` (gig has many applications)
- `conversations` → `messages` (conversation has many messages)
- `reward_triggers` → `reward_definitions` (trigger has many definitions)

### Many-to-Many Relationships:
- `users` ↔ `gigs` (through `saved_gigs`)
- `users` ↔ `conversations` (through participants array)

---

## Indexes

All primary indexes are listed in table definitions above. Additional composite indexes for common queries:

```sql
-- Performance optimization indexes
CREATE INDEX idx_deals_influencer_status ON deals(influencer_id, status);
CREATE INDEX idx_deals_sponsor_status ON deals(sponsor_id, status);
CREATE INDEX idx_gig_applications_gig_status ON gig_applications(gig_id, status);
CREATE INDEX idx_transactions_user_type ON transactions(to_user_id, type);
CREATE INDEX idx_escrow_jobs_influencer_status ON escrow_jobs(influencer_id, status);
CREATE INDEX idx_invites_agent_status ON invites(agent_id, status);
CREATE INDEX idx_referrals_agent_active ON referrals(agent_id, is_active);
```

---

## Triggers

### Update `updated_at` timestamps:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all relevant tables)
```

---

## Views

### Active Gigs View:
```sql
CREATE VIEW active_gigs AS
SELECT g.*, u.name as sponsor_name, u.avatar as sponsor_avatar,
       COUNT(DISTINCT ga.id) as application_count
FROM gigs g
JOIN users u ON g.sponsor_id = u.id
LEFT JOIN gig_applications ga ON g.id = ga.gig_id
WHERE g.status = 'open'
GROUP BY g.id, u.name, u.avatar;
```

### User Statistics View:
```sql
CREATE VIEW user_statistics AS
SELECT 
  u.id,
  u.role,
  COUNT(DISTINCT d.id) as total_deals,
  COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as completed_deals,
  COALESCE(SUM(CASE WHEN d.status = 'completed' AND d.influencer_id = u.id THEN d.amount END), 0) as total_earnings,
  COALESCE(AVG(CASE WHEN r.id IS NOT NULL THEN r.rating END), 0) as average_rating
FROM users u
LEFT JOIN deals d ON (u.id = d.influencer_id OR u.id = d.sponsor_id)
LEFT JOIN (SELECT * FROM user_reviews) r ON u.id = r.reviewed_user_id
GROUP BY u.id, u.role;
```

---

## Materialized Views

For expensive queries, use materialized views refreshed periodically:

```sql
CREATE MATERIALIZED VIEW agent_leaderboard AS
SELECT 
  u.id as agent_id,
  u.name as agent_name,
  u.avatar,
  ap.tier,
  COUNT(DISTINCT r.recruited_user_id) as total_referrals,
  COUNT(DISTINCT d.id) as total_deals,
  COALESCE(SUM(t.amount), 0) as total_earnings,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.amount), 0) DESC) as rank
FROM users u
JOIN agent_profiles ap ON u.id = ap.user_id
LEFT JOIN referrals r ON u.id = r.agent_id AND r.is_active = true
LEFT JOIN deals d ON (d.influencer_id = r.recruited_user_id OR d.sponsor_id = r.recruited_user_id)
LEFT JOIN transactions t ON t.to_user_id = u.id AND t.type = 'agent_commission'
GROUP BY u.id, u.name, u.avatar, ap.tier;

-- Refresh daily
CREATE INDEX ON agent_leaderboard(rank);
```

---

This schema provides a complete foundation for the Source Impact platform backend. All relationships are properly defined with foreign keys, indexes are optimized for common queries, and constraints ensure data integrity.
