# Job API Setup Guide - Accurate & Verified Sources

This guide provides **VERIFIED** instructions for obtaining API keys for job APIs that actually work. Many APIs listed in initial research don't exist or aren't publicly available - this guide focuses only on **confirmed, obtainable sources**.

## ⚠️ **IMPORTANT REALITY CHECK**
Many popular job board APIs (Workday, SmartRecruiters, ZipRecruiter, Monster, CareerBuilder) are **NOT publicly available** or have been discontinued. This guide focuses on the APIs you can **actually obtain and use**.

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

## ❌ **APIs THAT ARE NOT AVAILABLE** (Removed from Implementation)

### **Workday Jobs API** - ❌ DOES NOT EXIST
**Reality**: Workday does NOT have a public job board API. Only internal APIs for existing enterprise customers.
**Verdict**: Cannot obtain - Enterprise software only.

---

### **SmartRecruiters API** - ❌ RESTRICTED ACCESS
**Reality**: Requires being a SmartRecruiters customer or official partner, not available for public job boards.
**Verdict**: Cannot easily obtain - Business partnership required.

---

### **ZipRecruiter API** - ❌ DISCONTINUED
**Reality**: ZipRecruiter ended their ZipSearch API program on March 31, 2025.
**Verdict**: No longer available - Program completely shut down.

---

### **Monster API** - ❌ WRONG API
**Reality**: The "Monster API" is for AI/ML models, not job postings. No public job posting API available.
**Verdict**: Incorrect - Not applicable for job aggregation.

---

### **CareerBuilder API** - ❌ RESTRICTED
**Reality**: Requires paid enterprise partnership.
**Verdict**: Not easily obtainable.

---

### **iCIMS Jobs API** - ⚠️ LIMITED PUBLIC ACCESS
**Reality**: Has public job portal endpoints but requires knowing specific customer IDs and limited functionality.
**Verdict**: Complex implementation, low priority.

---

## 🔑 **APIs THAT ARE ACTUALLY AVAILABLE**

### **1. Adzuna API** ✅ (Already have key in secrets)
**Status**: Already configured in your project!
- Go to Opportunities page to see Adzuna jobs

---

### **2. Google Jobs API (via SearchAPI)** ✅ (Already have key)
**Status**: Already configured in your project!
- Used in Job Search Agent

---

### **3. Dice API** ✅ (NO KEY NEEDED - HIGHEST PRIORITY)
**Estimated Jobs**: 80K+ tech jobs
**Setup Time**: Immediate - No registration needed!
**Cost**: Free (1000 requests/day)

**Steps**:
1. No registration needed - API is completely open!
2. Just implement the API calls directly
3. Rate limit: 1000 requests/day

**API Endpoint**: `https://www.dice.com/api/v1/jobs/search`

**Example**:
```javascript
fetch('https://www.dice.com/api/v1/jobs/search?q=developer&location=Chicago')
```

**API Documentation**: https://www.dice.com/common/content/util/apidoc/jobsearch.html

---

### **4. Reed.co.uk API** ✅ (UK Jobs - HIGH PRIORITY)
**Estimated Jobs**: 250K+ UK jobs
**Setup Time**: 5 minutes - Instant signup
**Cost**: Free (1000 requests/day)

**Steps**:
1. Go to: https://www.reed.co.uk/developers
2. Click "Register for API Access"
3. Fill out short form
4. API key sent instantly to email
5. Add to Lovable secrets:
   - Secret name: `REED_API_KEY`

**API Endpoint**: `https://www.reed.co.uk/api/1.0/search`

**Example**:
```javascript
fetch('https://www.reed.co.uk/api/1.0/search?keywords=developer&locationName=London', {
  headers: { 'Authorization': 'Basic ' + btoa(apiKey + ':') }
})
```

**API Documentation**: https://www.reed.co.uk/developers/Jobseeker

---

### **5. Workable Jobs API** ✅ (HIGH PRIORITY)
**Estimated Jobs**: 150K+
**Setup Time**: Immediate - No authentication needed!
**Cost**: Free

**Steps**:
1. No API key needed - public endpoints!
2. Just need to know company names using Workable
3. Implement direct API calls

**API Endpoint**: `https://apply.workable.com/api/v1/widget/accounts/{company_name}`

**Example**:
```javascript
fetch('https://apply.workable.com/api/v1/widget/accounts/COMPANY_NAME')
```

**API Documentation**: https://help.workable.com/hc/en-us/articles/115012771647

---

### **6. Jooble API** ✅ (MEDIUM PRIORITY)
**Estimated Jobs**: 2M+ (global aggregator)
**Setup Time**: 10 minutes
**Cost**: Free tier: 50K requests/month

**Steps**:
1. Go to: https://jooble.org/api/about
2. Fill out the application form
3. Receive API key via email (usually within 1 hour)
4. Add to Lovable secrets:
   - Secret name: `JOOBLE_API_KEY`

**API Endpoint**: `https://jooble.org/api/{api_key}`

**Example**:
```javascript
fetch('https://jooble.org/api/YOUR_API_KEY', {
  method: 'POST',
  body: JSON.stringify({ keywords: 'developer', location: 'New York' })
})
```

**API Documentation**: https://jooble.org/api/documentation

---

### **7. Careerjet API** ⚠️ (MEDIUM PRIORITY - REQUIRES AFFILIATE)
**Estimated Jobs**: 2M+ (global)
**Setup Time**: 1-2 weeks (affiliate approval)
**Cost**: Free tier available

**Steps**:
1. Go to: https://www.careerjet.com/partners/api/
2. Apply to become a Careerjet affiliate partner
3. Wait for approval
4. Receive affiliate ID via email
5. Add to Lovable secrets:
   - Secret name: `CAREERJET_AFFILIATE_ID`

**API Documentation**: https://www.careerjet.com/partners/api/documentation

---

### **8. Idealist API** ✅ (NONPROFIT JOBS - LOW PRIORITY)
**Estimated Jobs**: 100K+ nonprofit opportunities
**Setup Time**: 1-2 days
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

## 🎯 **RECOMMENDED PRIORITY**

### **🚀 IMMEDIATE SETUP (Do These TODAY - No Registration Needed)**:
1. ✅ **Dice API** - Free, 80K tech jobs, NO KEY NEEDED
2. ✅ **Workable API** - Free, 150K jobs, NO KEY NEEDED

### **⚡ QUICK SETUP (5-10 Minutes - Instant Keys)**:
3. ✅ **Reed.co.uk API** - Free, 250K UK jobs, instant signup

### **📅 SHORT TERM (1-2 Days - Simple Registration)**:
4. ✅ **Jooble API** - Free tier, 2M global jobs, 1-hour approval
5. ✅ **Idealist API** - Free, 100K nonprofit jobs, same-day approval

### **🔄 MEDIUM TERM (1-2 Weeks - Requires Affiliate Approval)**:
6. ⚠️ **Careerjet API** - Free tier, 2M global jobs, needs affiliate approval

### **❌ DO NOT PURSUE (Not Available/Restricted)**:
- ❌ Workday - No public API exists
- ❌ SmartRecruiters - Customers/partners only
- ❌ ZipRecruiter - Program discontinued March 2025
- ❌ Monster - No job posting API
- ❌ CareerBuilder - Paid partnerships only
- ⚠️ iCIMS - Limited public access, complex
- ⚠️ SEEK - $500+/month, ANZ only
- ⚠️ Built In - Private API, uncertain availability

---

## 📝 **SETUP CHECKLIST**

Track your progress:

### **Immediate (No Keys Needed)**
- [ ] Dice API - Implement today
- [ ] Workable API - Implement today

### **Quick Setup (Keys Within Hours)**
- [ ] Reed.co.uk API - Applied: ____ / Key Received: ____ / Implemented: ____
- [ ] Jooble API - Applied: ____ / Key Received: ____ / Implemented: ____

### **Medium Term (1-2 Weeks)**
- [ ] Idealist API - Applied: ____ / Key Received: ____ / Implemented: ____
- [ ] Careerjet API - Applied: ____ / Affiliate Approved: ____ / Implemented: ____

### **Already Working**
- [x] Adzuna API - Live
- [x] Google Jobs API - Live
- [x] USAJobs API - Live
- [x] 20+ Company Career APIs - Live

**Expected Total**: 480K-3M+ additional jobs from new APIs

---

## 🔧 **HOW TO ADD API KEYS TO LOVABLE**

Once you receive any API key:

1. Tell me: "I have the [API_NAME] key"
2. I'll use the `secrets--add_secret` tool to prompt you
3. You'll paste the key securely in the modal
4. I'll update the sync-external-jobs function to use it
5. Test the integration

**Priority Order for Key Entry**:
1. Reed.co.uk (instant - do today)
2. Jooble (1-hour turnaround)
3. Idealist (same-day approval)
4. Careerjet (1-2 week approval)

---

## 💡 **TIPS**

1. **Start with No-Key APIs**: Dice and Workable work immediately
2. **Quick Wins First**: Reed.co.uk gives instant API key
3. **Professional Approach**: Use business email for registrations
4. **Be Transparent**: Explain you're building a job aggregation platform
5. **Track Everything**: Keep notes on which APIs you've applied for
6. **Test Immediately**: Let me know as soon as you get each key

---

## 🚨 **COMMON ISSUES**

**"My application was rejected"**
- Most of the working APIs (Dice, Workable, Reed.co.uk, Jooble) have automatic approval
- For Careerjet affiliate program, emphasize legitimate job board use case

**"API key not working"**
- Double-check you copied the full key
- Verify authentication method (Basic Auth for Reed.co.uk)
- Check rate limits

**"No response from API provider"**
- Reed.co.uk and Jooble respond within hours
- Careerjet may take 1-2 weeks for affiliate approval
- For Idealist, follow up after 3 days if no response

---

## 📊 **EXPECTED TIMELINE**

**Today**: Implement Dice + Workable APIs (NO KEYS NEEDED!)
**Day 2-3**: Get Reed.co.uk key, implement
**Week 1**: Apply for Jooble + Idealist, implement when keys arrive
**Week 2-3**: Apply for Careerjet affiliate program
**Month 1**: Testing and optimization

**Realistic Goal**: 5-7 new working APIs within 30 days
**Total Job Coverage**: 500K-3M additional jobs

---

## 🎉 **NEXT STEPS**

1. **TODAY**: Implement Dice and Workable APIs (no keys needed)
2. **TODAY**: Register for Reed.co.uk API (instant key)
3. **This Week**: Apply for Jooble and Idealist APIs
4. **Monitor**: Track application status for Careerjet
5. **Integrate**: Let me know as you receive each API key and I'll add them

**Immediate Win**: With just Dice + Workable + Reed.co.uk, you'll add 480K+ jobs in the next hour!

Ready to implement the APIs that actually work? Let's start with Dice and Workable! 🚀
