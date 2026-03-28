# Commission Routing Logic

## Overview
The platform uses a **10% commission** on all deals. This commission is **added on top** of the influencer payment, not deducted from it. The commission is intelligently routed based on whether agents recruited the sponsor or influencer.

## Fee Structure Example
- Influencer receives: $100
- Platform fee (10%): $10
- **Total sponsor pays: $110**

The influencer always receives the full agreed amount. The 10% fee is charged to the sponsor as an additional service fee.

## Commission Distribution Rules

### Rule 1: No Agent Involved
**When**: Neither the sponsor nor the influencer was recruited by an agent.
**Commission Goes To**: Platform (100% of 10%)
**Example**: 
- Influencer receives: $1,000
- Platform fee: $100 (10% added on)
- Total sponsor pays: $1,100
- Commission: $100 → Platform

### Rule 2: Agent Recruited Sponsor Only
**When**: An agent recruited the sponsor, but not the influencer.
**Commission Goes To**: Agent who recruited the sponsor (100% of 10%)
**Example**:
- Influencer receives: $1,000
- Platform fee: $100 (10% added on)
- Total sponsor pays: $1,100
- Commission: $100 → Agent A (who recruited sponsor)

### Rule 3: Agent Recruited Influencer Only
**When**: An agent recruited the influencer, but not the sponsor.
**Commission Goes To**: Agent who recruited the influencer (100% of 10%)
**Example**:
- Influencer receives: $1,000
- Platform fee: $100 (10% added on)
- Total sponsor pays: $1,100
- Commission: $100 → Agent B (who recruited influencer)

### Rule 4: Same Agent Recruited Both
**When**: The same agent recruited both the sponsor AND the influencer.
**Commission Goes To**: That agent (100% of 10%)
**Example**:
- Influencer receives: $1,000
- Platform fee: $100 (10% added on)
- Total sponsor pays: $1,100
- Commission: $100 → Agent C (who recruited both parties)

### Rule 5: Different Agents Recruited Each Party
**When**: Agent A recruited the sponsor, and Agent B recruited the influencer.
**Commission Goes To**: Split 50/50 between both agents
**Example**:
- Influencer receives: $1,000
- Platform fee: $100 (10% added on)
- Total sponsor pays: $1,100
- Commission: $100 total
  - $50 → Agent A (recruited sponsor)
  - $50 → Agent B (recruited influencer)

## Implementation Details

### Code Location
File: `contexts/PaymentContext.tsx`

### Key Functions

#### `getAttributingAgent(sponsorId, influencerId)`
Lines 106-151
- Checks if agents recruited the sponsor or influencer
- Returns attribution information including:
  - `agentId`: The agent(s) to receive commission
  - `recruitedType`: 'sponsor' | 'influencer' | 'both'
  - `splitPercentage`: 100 (full commission) or 50 (split)

#### `releaseFunds(escrowJobId)`
Lines 304-498
- Releases funds from escrow when work is completed
- Transfers full agreed amount to influencer (no deduction)
- Calculates 10% commission from escrow (added on top during funding)
- Routes commission to agent(s) or platform based on attribution
- Creates transactions for commission payments
- Updates agent earnings

### Logging
All commission routing decisions are logged with prefix `[Commission Routing]` for debugging:
- `✅` = Commission successfully routed
- `ℹ️` = No agent attribution, commission goes to platform

### Example Console Output

```
[Commission Attribution] Checking for agents...
[Commission Attribution] Sponsor agent: agent_123
[Commission Attribution] Influencer agent: None
[Commission Attribution] Sponsor recruited by agent agent_123 - 100% commission to agent
[Commission Routing] Total commission to distribute: $100.00 (10% of $1000.00)
[Commission Routing] ✅ Agent(s) found - routing commission to agent(s)
[Commission Routing] ✅ Agent commission: $100.00 routed to agent agent_123
```

## Key Takeaway

**The platform ONLY receives commission when NO agent is involved in recruiting either party. If any agent recruited the sponsor or influencer, they receive the commission instead.**

This incentivizes agents to recruit both sponsors and influencers to maximize their earnings.
