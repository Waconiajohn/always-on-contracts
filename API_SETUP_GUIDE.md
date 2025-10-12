# Job API Setup Guide - Step-by-Step Instructions

This guide provides detailed instructions for obtaining API keys and setting up access for job APIs that require registration.

---

## 🟢 **ALREADY WORKING** (No Setup Needed)
These are already implemented and working:
- Greenhouse, Lever, Ashby
- RemoteOK, We Work Remotely, Remotive
- USAJOBS, SAM.gov, Indeed
- FlexJobs, Stack Overflow, Authentic Jobs
- Gun.io, Braintrust, Catalant, Krop

---

## 🆓 **FREE APIs (Just Added - No Keys Needed)**
These were just implemented with no API key required:
- Arbeitnow
- Remotive
- Working Nomads
- GitHub Jobs
- Hacker News Jobs
- German Jobsuche
- ReliefWeb
- JobStreet (limited)

---

## 🔑 **APIs REQUIRING REGISTRATION** (Free Tier Available)

### **1. Adzuna API** ✅ (Already have key in secrets)
**Status**: Already configured in your project!
- Go to Opportunities page to see Adzuna jobs

---

### **2. Google Jobs API (via SearchAPI)** ✅ (Already have key)
**Status**: Already configured in your project!
- Used in Job Search Agent

---

### **3. Workday Jobs API**
**Estimated Jobs**: 900K+
**Setup Time**: 15-20 minutes
**Cost**: Free for reasonable usage

**Steps**:
1. Go to: https://developer.workday.com/
2. Click "Get Started" → "Sign Up"
3. Fill in company details (can use Career Command Post as company name)
4. Verify email
5. Navigate to "My Apps" → "Create New App"
6. Select "Job Board" as app type
7. Copy the API Key and Client ID
8. Add to Lovable secrets:
   - Secret name: `WORKDAY_API_KEY`
   - Secret name: `WORKDAY_CLIENT_ID`

**API Documentation**: https://developer.workday.com/docs/job-board-api

---

### **4. SmartRecruiters API**
**Estimated Jobs**: 1.1M+
**Setup Time**: 10 minutes
**Cost**: Free

**Steps**:
1. Go to: https://developers.smartrecruiters.com/
2. Click "Get API Access"
3. Fill out the form (select "Job Board Integration")
4. They'll email you an API key within 24 hours
5. Once received, add to Lovable secrets:
   - Secret name: `SMARTRECRUITERS_API_KEY`

**API Documentation**: https://developers.smartrecruiters.com/docs/job-postings

---

### **5. Workable Jobs API**
**Estimated Jobs**: 150K+
**Setup Time**: 15 minutes
**Cost**: Free tier available

**Steps**:
1. Go to: https://workable.com/developers/
2. Click "Get Started" → Create Account
3. Go to Settings → API Access Tokens
4. Create new token with "Job Board" permissions
5. Copy the token
6. Add to Lovable secrets:
   - Secret name: `WORKABLE_API_KEY`

**API Documentation**: https://workable.readme.io/reference/jobs

---

### **6. iCIMS Talent Cloud API**
**Estimated Jobs**: Large coverage (exact number varies)
**Setup Time**: 20-30 minutes (requires business verification)
**Cost**: Free for approved partners

**Steps**:
1. Go to: https://developer.icims.com/
2. Click "Register" → Complete partner application
3. Select "Job Board" as integration type
4. Wait for approval (usually 2-3 business days)
5. Once approved, create an API key in the portal
6. Add to Lovable secrets:
   - Secret name: `ICIMS_API_KEY`
   - Secret name: `ICIMS_CUSTOMER_ID`

**API Documentation**: https://developer.icims.com/APIs/Job-Board-API

---

### **7. Reed.co.uk API** (UK Jobs)
**Estimated Jobs**: 250K+ UK jobs
**Setup Time**: 5 minutes
**Cost**: Free

**Steps**:
1. Go to: https://www.reed.co.uk/developers
2. Click "Register for API Access"
3. Fill out short form
4. API key sent instantly to email
5. Add to Lovable secrets:
   - Secret name: `REED_API_KEY`

**API Documentation**: https://www.reed.co.uk/developers/jobseeker

---

### **8. Jooble API**
**Estimated Jobs**: 2M+ (global aggregator)
**Setup Time**: 10 minutes
**Cost**: Free tier: 50K requests/month

**Steps**:
1. Go to: https://jooble.org/api/about
2. Fill out the application form
3. Receive API key via email (usually within 1 hour)
4. Add to Lovable secrets:
   - Secret name: `JOOBLE_API_KEY`

**API Documentation**: https://jooble.org/api/documentation

---

### **9. Careerjet API**
**Estimated Jobs**: 2M+ (global)
**Setup Time**: 15 minutes
**Cost**: Free tier available

**Steps**:
1. Go to: https://www.careerjet.com/partners/api/
2. Fill out affiliate application
3. Select "Job Board" as use case
4. Receive affiliate ID via email
5. Add to Lovable secrets:
   - Secret name: `CAREERJET_AFFILIATE_ID`

**API Documentation**: https://www.careerjet.com/partners/api/documentation

---

### **10. ZipRecruiter API**
**Estimated Jobs**: 8M+ (US-focused)
**Setup Time**: 20 minutes (requires business verification)
**Cost**: Free tier for low volume

**Steps**:
1. Go to: https://www.ziprecruiter.com/publishers
2. Click "Become a Publisher"
3. Fill out business application
4. Wait for approval (1-2 business days)
5. Once approved, get API credentials from dashboard
6. Add to Lovable secrets:
   - Secret name: `ZIPRECRUITER_API_KEY`

**API Documentation**: https://www.ziprecruiter.com/publishers/api

---

### **11. Dice API** (Tech Jobs)
**Estimated Jobs**: 80K+ tech jobs
**Setup Time**: 15 minutes
**Cost**: Free

**Steps**:
1. Go to: https://www.dice.com/common/content/util/apidoc/jobsearch.html
2. No formal registration - API is open!
3. Just implement the API calls (no key needed)
4. Rate limit: 1000 requests/day

**API Documentation**: https://www.dice.com/common/content/util/apidoc/jobsearch.html

---

### **12. Idealist API** (Nonprofit Jobs)
**Estimated Jobs**: 100K+ nonprofit opportunities
**Setup Time**: 10 minutes
**Cost**: Free

**Steps**:
1. Go to: https://www.idealist.org/en/developer
2. Create an Idealist account
3. Apply for API access (explain it's for job aggregation)
4. Receive API key via email (usually same day)
5. Add to Lovable secrets:
   - Secret name: `IDEALIST_API_KEY`

**API Documentation**: https://www.idealist.org/en/api

---

### **13. Built In Jobs API**
**Estimated Jobs**: 50K+ tech startup jobs
**Setup Time**: Email request
**Cost**: Free for approved partners

**Steps**:
1. Email: api@builtin.com
2. Subject: "API Access Request for Job Board"
3. In email, explain you're building a job aggregator
4. They'll respond with API documentation and key
5. Add to Lovable secrets:
   - Secret name: `BUILTIN_API_KEY`

**Note**: No formal API docs public - they send private documentation

---

### **14. SEEK API** (Australia/New Zealand)
**Estimated Jobs**: 200K+ ANZ jobs
**Setup Time**: 30 minutes (requires business verification)
**Cost**: Paid plans start at $500/month (not recommended for now)

**Steps**:
1. Go to: https://talent.seek.com.au/
2. Contact their enterprise sales team
3. **Note**: This is a premium API - skip for now unless targeting ANZ market

---

### **15. Monster API**
**Estimated Jobs**: 1M+
**Setup Time**: 20 minutes
**Cost**: Free tier available

**Steps**:
1. Go to: https://partner.monster.com/
2. Click "Become a Partner"
3. Select "Job Board" integration
4. Fill out application
5. Wait for approval (2-3 days)
6. Add to Lovable secrets:
   - Secret name: `MONSTER_API_KEY`

**API Documentation**: https://partner.monster.com/api-documentation

---

### **16. CareerBuilder API**
**Estimated Jobs**: 1M+
**Setup Time**: 30 minutes (business verification)
**Cost**: Contact for pricing (likely not free)

**Steps**:
1. Go to: https://www.careerbuilder.com/share/aboutus/partners_affiliates.aspx
2. Fill out partner application
3. **Note**: May require paid partnership - verify before applying

---

## 🎯 **RECOMMENDED PRIORITY**

### **Immediate (Do These First)**:
1. ✅ Workday - Free, 900K jobs
2. ✅ SmartRecruiters - Free, 1.1M jobs  
3. ✅ Workable - Free, 150K jobs
4. ✅ Reed.co.uk - Free, instant, UK jobs
5. ✅ Jooble - Free tier, 2M jobs

### **High Priority (Do Next Week)**:
6. Dice - Open API, no key needed
7. iCIMS - Free but needs approval
8. Idealist - Free, nonprofit jobs
9. Careerjet - Free tier available

### **Medium Priority (Month 2)**:
10. ZipRecruiter - Needs approval
11. Monster - Needs approval
12. Built In - Email request

### **Low Priority (Evaluate Later)**:
- SEEK (expensive, ANZ only)
- CareerBuilder (likely paid)
- Premium APIs

---

## 📝 **SETUP CHECKLIST**

Create a spreadsheet to track:
- [ ] API Name
- [ ] Status (Applied / Approved / Key Added / Testing / Live)
- [ ] Application Date
- [ ] API Key Received Date
- [ ] Expected Jobs Count
- [ ] Notes

---

## 🔧 **HOW TO ADD API KEYS TO LOVABLE**

Once you receive any API key:

1. Tell me: "I have the [API_NAME] key"
2. I'll use the `secrets--add_secret` tool to prompt you
3. You'll paste the key securely in the modal
4. I'll update the sync-external-jobs function to use it
5. Test the integration

---

## 💡 **TIPS**

1. **Start Small**: Begin with the 5 recommended immediate APIs
2. **Stagger Applications**: Don't apply to all at once - space them out
3. **Business Email**: Use a professional email (not Gmail/Yahoo)
4. **Be Honest**: Explain you're building a job aggregation platform
5. **Track Everything**: Keep a spreadsheet of applications and keys
6. **Test Immediately**: As soon as you get a key, let me know to implement it

---

## 🚨 **COMMON ISSUES**

**"My application was rejected"**
- Some APIs only approve established businesses
- Try explaining your user base and traffic
- Consider starting with open/free APIs first

**"API key not working"**
- Double-check you copied the full key
- Verify you're using correct authentication method
- Check rate limits (you might be exceeding them)

**"No response from API provider"**
- Follow up after 3-5 business days
- Check spam folder for approval emails
- Try alternative contact methods (phone, LinkedIn)

---

## 📊 **EXPECTED TIMELINE**

**Week 1**: Apply to all free-tier APIs
**Week 2**: Receive first batch of keys, start integration
**Week 3**: Follow up on pending applications
**Week 4**: Full integration testing and launch

**Realistic Goal**: 10-15 new working APIs within 30 days
**Optimistic Goal**: 20+ new APIs within 60 days

---

## 🎉 **NEXT STEPS**

1. Review this guide
2. Start with the "Immediate Priority" list
3. Let me know as you receive each API key
4. I'll integrate them one by one
5. We'll test and go live!

Ready to 10x your job database? Let's do this! 🚀
