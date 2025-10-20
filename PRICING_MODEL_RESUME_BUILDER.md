# Pricing Model: Resume Builder with AI Generation

## Pricing Philosophy

**Goal:** Transparent, value-based pricing that covers costs while remaining competitive and fair.

**Key Principles:**
1. ✅ Users understand what they're paying for
2. ✅ Limits encourage thoughtful usage (not wasteful regeneration)
3. ✅ Premium tiers offer real value for power users
4. ✅ Sustainable margins that support quality infrastructure

---

## Proposed Tiered Model

### **Free Tier: "Try It"**
**Price:** $0/month

**Includes:**
- 2 full resume generations per month
- 5 AI section regenerations per month
- Basic Career Vault (20 items max)
- Standard templates (2 formats)
- Email support (48hr response)

**AI Costs (per user/month):**
- 2 resumes × $0.27 = $0.54
- 5 regenerations × $0.045 = $0.23
- **Total cost: ~$0.77/month**

**Goal:** Let users experience quality, convert to paid

---

### **Pro Tier: "Serious Job Seeker"**
**Price:** $19.99/month

**Includes:**
- **10 full resume generations per month**
- **30 AI section regenerations per month**
- Unlimited Career Vault storage
- All templates (4 premium formats)
- Priority email support (24hr response)
- Export to PDF/DOCX/ATS-optimized
- Cover letter generator (5/month)
- LinkedIn profile optimizer (2/month)

**AI Costs (per user/month):**
- 10 resumes × $0.27 = $2.70
- 30 regenerations × $0.045 = $1.35
- 5 cover letters × $0.20 = $1.00
- 2 LinkedIn profiles × $0.15 = $0.30
- **Total cost: ~$5.35/month**

**Margin:** $19.99 - $5.35 = **$14.64 profit (73% margin)**

**Target User:** Active job seeker, 3-6 month search

---

### **Premium Tier: "Career Professional"**
**Price:** $49.99/month

**Includes:**
- **50 full resume generations per month**
- **Unlimited AI section regenerations**
- Everything in Pro, plus:
- Interview prep scenarios (10/month)
- Salary negotiation scripts (5/month)
- Executive bio writer (3/month)
- Personal brand statement (2/month)
- 1-on-1 AI coaching session (30 min/month)
- White-glove support (same-day response)

**AI Costs (per user/month):**
- 50 resumes × $0.27 = $13.50
- Unlimited regenerations (cap estimate: 100) × $0.045 = $4.50
- 10 interview preps × $0.15 = $1.50
- 5 salary scripts × $0.10 = $0.50
- 3 executive bios × $0.30 = $0.90
- 2 brand statements × $0.20 = $0.40
- **Total cost: ~$21.30/month**

**Margin:** $49.99 - $21.30 = **$28.69 profit (57% margin)**

**Target User:** Executives, career changers, consultants, freelancers

---

### **Enterprise Tier: "Recruiting Firm / Career Coach"**
**Price:** $299/month (up to 5 seats) + $49/additional seat

**Includes:**
- **500 full resume generations per month** (shared across team)
- **Unlimited regenerations**
- Everything in Premium, plus:
- White-label option (your branding)
- API access for integrations
- Bulk processing tools
- Client management dashboard
- Dedicated account manager
- Custom templates and workflows
- SLA guarantee (99.5% uptime)

**AI Costs (per account/month):**
- 500 resumes × $0.27 = $135.00
- Unlimited regenerations (cap: 1000) × $0.045 = $45.00
- **Total cost: ~$180/month**

**Margin:** $299 - $180 = **$119 profit (40% margin)**

**Target User:** Recruiting agencies, career coaches, outplacement firms

---

## Alternative: Pay-As-You-Go Add-On

For users who exceed their tier limits:

### **Token Packs** (One-Time Purchase)

| Pack Size | Price | Includes | Cost | Margin |
|-----------|-------|----------|------|--------|
| **Starter** | $4.99 | 5 resume generations | $1.35 | $3.64 (73%) |
| **Standard** | $9.99 | 12 resume generations | $3.24 | $6.75 (68%) |
| **Power** | $19.99 | 30 resume generations | $8.10 | $11.89 (59%) |

**Or:** À la carte pricing
- Resume generation: $1.99 each
- Section regeneration: $0.49 each
- Cover letter: $2.99 each
- LinkedIn optimization: $1.99 each

**User Flow:**
```
User hits limit → "You've used 10/10 resumes this month"
Options:
1. Upgrade to Premium ($49.99/month) → 50/month
2. Buy Token Pack → $9.99 for 12 more
3. Wait until next month (resets)
```

---

## Competitive Analysis

| Competitor | Price | Resumes/Month | AI Quality | Our Advantage |
|------------|-------|---------------|------------|---------------|
| **Resume.io** | $24.95/month | Unlimited | Basic templates | ⚠️ No AI research |
| **Kickresume** | $19/month | Unlimited | Template-based | ⚠️ No job analysis |
| **Rezi** | $29/month | Unlimited | ATS scoring | ⚠️ Generic AI |
| **Teal** | $29/month | Unlimited | Basic AI | ⚠️ No dual-generation |
| **TopResume** | $149-$349 | 1 resume | Human writer | ⚠️ Expensive, slow |
| **ZipJob** | $139-$299 | 1 resume | Human writer | ⚠️ One-time only |

**Our Positioning:**
- ✅ **Better than template tools:** Real AI research + job analysis
- ✅ **Better than generic AI:** CPRW framework + problem-solution approach
- ✅ **Better than human writers:** Faster, cheaper, unlimited revisions
- ✅ **Transparent limits:** Users know what they get

**Pricing Sweet Spot:**
- Pro ($19.99) undercuts Rezi/Teal but offers superior AI
- Premium ($49.99) is 3x cheaper than one-time human services, unlimited use
- Free tier is truly functional (not crippled trial)

---

## Usage Tracking & Limits System

### Database Schema:

```sql
-- Add to user profiles table
CREATE TABLE user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL, -- 'free', 'pro', 'premium', 'enterprise'
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,

  -- Usage counters (reset monthly)
  resumes_generated INTEGER DEFAULT 0,
  sections_regenerated INTEGER DEFAULT 0,
  cover_letters_generated INTEGER DEFAULT 0,
  linkedin_optimizations INTEGER DEFAULT 0,

  -- Limits (based on tier)
  resumes_limit INTEGER NOT NULL,
  sections_limit INTEGER NOT NULL,
  cover_letters_limit INTEGER NOT NULL,
  linkedin_limit INTEGER NOT NULL,

  -- Cost tracking (for analytics)
  total_api_cost DECIMAL(10,4) DEFAULT 0.00,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX idx_usage_user_period ON user_usage_tracking(user_id, billing_period_start);
CREATE INDEX idx_usage_tier ON user_usage_tracking(subscription_tier);
```

### Limit Configuration:

```typescript
const TIER_LIMITS = {
  free: {
    resumes: 2,
    sections: 5,
    coverLetters: 0,
    linkedinOptimizations: 0,
    price: 0
  },
  pro: {
    resumes: 10,
    sections: 30,
    coverLetters: 5,
    linkedinOptimizations: 2,
    price: 19.99
  },
  premium: {
    resumes: 50,
    sections: -1, // -1 = unlimited
    coverLetters: -1,
    linkedinOptimizations: -1,
    price: 49.99
  },
  enterprise: {
    resumes: 500,
    sections: -1,
    coverLetters: -1,
    linkedinOptimizations: -1,
    price: 299.00 // base price for 5 seats
  }
};
```

### Usage Check Middleware:

```typescript
const checkUsageLimit = async (
  userId: string,
  actionType: 'resume' | 'section' | 'coverLetter' | 'linkedin'
): Promise<{ allowed: boolean; remaining: number; limit: number }> => {

  // Get current usage period
  const usage = await supabase
    .from('user_usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('billing_period_end', new Date())
    .single();

  if (!usage) {
    // Create new usage period (shouldn't happen, but safety)
    const newUsage = await createUsagePeriod(userId);
    return checkLimit(newUsage, actionType);
  }

  const limitField = `${actionType}s_limit`;
  const usageField = `${actionType}s_generated`;

  const limit = usage[limitField];
  const used = usage[usageField];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  return { allowed, remaining, limit };
};
```

### Frontend Usage Display:

```tsx
<Card className="p-4 bg-primary/5 border-primary/20">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold">Your Usage This Month</h4>
      <p className="text-sm text-muted-foreground">
        Resets on {formatDate(usage.billing_period_end)}
      </p>
    </div>
    <Badge variant={usage.tier === 'free' ? 'outline' : 'default'}>
      {usage.tier.toUpperCase()}
    </Badge>
  </div>

  <div className="mt-4 space-y-3">
    {/* Resume Generations */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Resume Generations</span>
        <span className="text-sm font-medium">
          {usage.resumes_generated} / {usage.resumes_limit === -1 ? '∞' : usage.resumes_limit}
        </span>
      </div>
      <Progress
        value={(usage.resumes_generated / usage.resumes_limit) * 100}
        className="h-2"
      />
    </div>

    {/* Section Regenerations */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Section Regenerations</span>
        <span className="text-sm font-medium">
          {usage.sections_regenerated} / {usage.sections_limit === -1 ? '∞' : usage.sections_limit}
        </span>
      </div>
      <Progress
        value={(usage.sections_regenerated / usage.sections_limit) * 100}
        className="h-2"
      />
    </div>

    {/* Upgrade CTA if nearing limit */}
    {usage.resumes_generated >= usage.resumes_limit * 0.8 && usage.tier === 'free' && (
      <Alert className="mt-3">
        <Zap className="h-4 w-4" />
        <AlertTitle>Almost at your limit!</AlertTitle>
        <AlertDescription>
          You've used {usage.resumes_generated} of {usage.resumes_limit} resumes.
          <Button variant="link" className="p-0 h-auto ml-1">
            Upgrade to Pro
          </Button>
          {' '}for 10 resumes/month.
        </AlertDescription>
      </Alert>
    )}
  </div>
</Card>
```

---

## Revenue Projections

### Scenario: 1,000 Active Users

| Tier | Users | % | Revenue | AI Cost | Profit |
|------|-------|---|---------|---------|--------|
| Free | 500 | 50% | $0 | $385 | -$385 |
| Pro | 350 | 35% | $6,997 | $1,873 | $5,124 |
| Premium | 130 | 13% | $6,499 | $2,769 | $3,730 |
| Enterprise | 20 | 2% | $5,980 | $3,600 | $2,380 |
| **TOTAL** | **1,000** | **100%** | **$19,476** | **$8,627** | **$10,849** |

**Assumptions:**
- 50% free users (trial/light usage)
- 35% Pro users (active job seekers)
- 13% Premium users (power users)
- 2% Enterprise (10 firms × 2 accounts avg)

**Monthly Profit:** $10,849
**Yearly Profit:** $130,188
**Margin:** 56% (healthy SaaS margin)

---

### Scenario: 10,000 Active Users (Scale)

| Tier | Users | % | Revenue | AI Cost | Profit |
|------|-------|---|---------|---------|--------|
| Free | 5,000 | 50% | $0 | $3,850 | -$3,850 |
| Pro | 3,500 | 35% | $69,965 | $18,725 | $51,240 |
| Premium | 1,300 | 13% | $64,987 | $27,690 | $37,297 |
| Enterprise | 200 | 2% | $59,800 | $36,000 | $23,800 |
| **TOTAL** | **10,000** | **100%** | **$194,752** | **$86,265** | **$108,487** |

**Monthly Profit:** $108,487
**Yearly Profit:** $1,301,844
**Margin:** 56%

**Note:** At scale, caching reduces costs by ~30-40%, improving margins to 65-70%

---

## Implementation: Stripe Integration

### Product Setup in Stripe:

```typescript
const stripeProducts = {
  pro: {
    name: 'Pro - Serious Job Seeker',
    price: 1999, // cents
    interval: 'month',
    features: [
      '10 resume generations/month',
      '30 section regenerations/month',
      'All premium templates',
      '5 cover letters/month',
      'Priority support'
    ]
  },
  premium: {
    name: 'Premium - Career Professional',
    price: 4999,
    interval: 'month',
    features: [
      '50 resume generations/month',
      'Unlimited regenerations',
      'Everything in Pro',
      '10 interview prep scenarios/month',
      'White-glove support'
    ]
  },
  enterprise: {
    name: 'Enterprise - Recruiting Firm',
    price: 29900,
    interval: 'month',
    features: [
      '500 resumes/month (shared)',
      'Up to 5 seats included',
      'White-label option',
      'API access',
      'Dedicated account manager'
    ]
  }
};
```

### Webhook Handler:

```typescript
const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;

      // Update user tier
      await supabase
        .from('user_usage_tracking')
        .update({
          subscription_tier: getTierFromPriceId(subscription.items.data[0].price.id),
          billing_period_start: new Date(subscription.current_period_start * 1000),
          billing_period_end: new Date(subscription.current_period_end * 1000),
          // Update limits based on tier
          ...TIER_LIMITS[getTierFromPriceId(subscription.items.data[0].price.id)]
        })
        .eq('user_id', subscription.metadata.user_id);
      break;

    case 'customer.subscription.deleted':
      // Downgrade to free tier
      await supabase
        .from('user_usage_tracking')
        .update({
          subscription_tier: 'free',
          ...TIER_LIMITS.free
        })
        .eq('user_id', event.data.object.metadata.user_id);
      break;
  }
};
```

---

## Pricing Page Copy

### Hero Section:
```
Build World-Class Resumes with AI
Pay for what you need. Cancel anytime.

[Free] [Pro - Most Popular] [Premium] [Enterprise]
```

### FAQ Section:
```
Q: What counts as a "resume generation"?
A: Creating a full resume from scratch using our AI wizard. Editing an existing resume doesn't count.

Q: What if I exceed my limit?
A: You can upgrade your plan or purchase a one-time token pack ($9.99 for 12 more resumes).

Q: Do limits reset monthly?
A: Yes, on your billing anniversary date. Unused generations don't roll over.

Q: Can I cancel anytime?
A: Absolutely. Cancel before your next billing date and you won't be charged again.

Q: What's the quality difference vs. human writers?
A: Our AI uses CPRW methodology and analyzes 50+ industry examples per job.
   Faster, unlimited revisions, and 80% cheaper than human services.
```

---

## Recommendation

**Start with 3 tiers:**
1. **Free:** 2 resumes/month (acquisition funnel)
2. **Pro ($19.99):** 10 resumes/month (mainstream market)
3. **Premium ($49.99):** 50 resumes/month (power users)

**Add later (6 months):**
4. **Enterprise ($299):** Once we have 50+ Pro users, target recruiting firms

**Why this approach:**
- ✅ Simple to understand
- ✅ Clear value ladder
- ✅ Sustainable margins (55-73%)
- ✅ Competitive pricing
- ✅ Covers AI costs with room to grow

**Next Steps:**
1. Implement usage tracking system
2. Set up Stripe products
3. Build pricing page
4. Add usage dashboard to user profile
5. Create upgrade flows

**Should I start building the usage tracking system?**
