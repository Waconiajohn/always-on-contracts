# CareerIQ Deployment Checklist

## Critical Pre-Launch Tasks

### 1. Email Configuration (CRITICAL)
- [ ] Set `SENDGRID_SENDER_EMAIL` secret in Supabase
- [ ] Verify the sender email in SendGrid dashboard
- [ ] Test commission email delivery
- [ ] Location: `supabase/functions/send-affiliate-commission-email/index.ts`

### 2. Security Settings
- [ ] Enable leaked password protection in Supabase Auth
- [ ] Path: Supabase Dashboard → Authentication → Settings
- [ ] Review all RLS policies for proper access control

### 3. Stripe Integration
- [ ] Verify all product/price IDs match your Stripe account
- [ ] Test checkout flow end-to-end
- [ ] Confirm webhook endpoint is configured in Stripe
- [ ] Test webhook with Stripe CLI or test events

### 4. Database
- [ ] Review all table RLS policies
- [ ] Create initial admin user in `user_roles` table
- [ ] Set up test data for QA (optional)

### 5. Edge Functions Review
**Active Production Functions:**
- `create-checkout` - Stripe subscription checkout
- `check-subscription` - Subscription status verification
- `customer-portal` - Stripe customer portal access
- `stripe-webhook` - Payment event processing
- `send-affiliate-commission-email` - Commission notifications
- `generate-affiliate-code` - Affiliate account creation
- `redeem-retirement-code` - Lifetime access code redemption

**MCP Functions (Advanced Features):**
These power the AI agent system. Monitor usage and errors:
- `orchestrator-agent` - MCP coordination
- `mcp-vault-manager` - Career preparation
- `mcp-persona-memory` - User context
- `mcp-research-agent` - Market intelligence
- `mcp-resume-intelligence` - Resume optimization
- `mcp-application-automation` - Application processing
- `mcp-interview-prep` - Interview preparation
- `mcp-agency-matcher` - Agency recommendations
- `mcp-networking-orchestrator` - Network management
- `mcp-market-intelligence` - Job market analysis
- `mcp-job-scraper` - Job data collection

### 6. Frontend Configuration
- [ ] Update meta tags and SEO
- [ ] Test all navigation flows
- [ ] Verify subscription status displays correctly
- [ ] Test mobile responsiveness

### 7. Testing Checklist

#### User Flow Testing
- [ ] New user signup → email verification
- [ ] Login flow
- [ ] Password reset
- [ ] Profile creation/editing

#### Subscription Testing
- [ ] Career Starter checkout ($29/mo)
- [ ] Always Ready checkout ($49/mo)
- [ ] Concierge Elite checkout ($99/mo)
- [ ] Subscription status display
- [ ] Tier-based feature access
- [ ] Customer portal access
- [ ] Subscription cancellation

#### Affiliate Testing
- [ ] Create affiliate account
- [ ] Generate referral code
- [ ] Test referral tracking
- [ ] Commission calculation
- [ ] Commission email notification
- [ ] Affiliate dashboard stats

#### Retirement Code Testing
- [ ] Generate retirement code (admin)
- [ ] Redeem code as user
- [ ] Verify lifetime access granted
- [ ] Check retirement badge display

#### Payment Testing
- [ ] Test promo code application
- [ ] Test referral code application
- [ ] Verify webhook event handling
- [ ] Check commission creation

### 8. Monitoring Setup
- [ ] Set up error alerting for edge functions
- [ ] Monitor Stripe webhook delivery
- [ ] Track failed payments
- [ ] Monitor SendGrid email delivery
- [ ] Set up usage analytics

### 9. Documentation
- [ ] Create user onboarding guide
- [ ] Document admin procedures
- [ ] Create troubleshooting guide
- [ ] Document affiliate program details

### 10. Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Affiliate terms published
- [ ] Cookie consent (if required)
- [ ] GDPR compliance (if applicable)

## Post-Launch Monitoring

### Week 1
- [ ] Monitor sign-up conversions
- [ ] Check for authentication errors
- [ ] Review edge function logs daily
- [ ] Monitor payment success rate
- [ ] Track affiliate sign-ups

### Week 2-4
- [ ] Analyze user engagement metrics
- [ ] Review subscription retention
- [ ] Check for recurring errors
- [ ] Gather user feedback
- [ ] Plan feature iterations

## Emergency Contacts & Resources

### Supabase Project
- Project ID: `ubcghjlfxkamyyefnbkf`
- Dashboard: Via Lovable backend access

### Stripe
- Test mode webhooks for development
- Production webhooks for live

### SendGrid
- Verify sender domains
- Monitor delivery rates

## Known Limitations

1. **Experimental Features Removed:**
   - `/experimental` route
   - `/mcp-test` route
   - `/career-vault` route
   These were removed from production. Re-enable via App.tsx if needed.

2. **MCP Functions:**
   - Advanced AI features
   - May require additional API keys
   - Monitor for rate limits

3. **Rate Limits:**
   - Stripe API: 100 requests/second
   - SendGrid: Based on plan
   - Supabase: Based on plan

## Quick Reference

### Create Admin User
```sql
-- Insert into user_roles table
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

### Generate Test Retirement Code
```sql
-- Use the admin portal UI or run:
INSERT INTO retirement_access_codes (code, created_by, is_active)
VALUES ('TEST-' || gen_random_uuid()::text, 'admin-user-id', true);
```

### Check Subscription Status
```sql
SELECT p.email, s.tier, s.status, s.subscription_end
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.user_id
WHERE s.status = 'active';
```

## Version History
- v1.0 - Initial launch configuration
- Date: 2025-01-06
