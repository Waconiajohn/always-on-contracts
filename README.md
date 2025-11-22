# Evidence-Based Resume Builder

A next-generation resume optimization platform that shifts from "AI generation" to **AI-assisted evidence mapping**. Instead of hallucinating content, the system acts as a "Proof Engine," finding the best factual evidence from a user's career history to support every job requirement.

## 🎯 Core Philosophy

**Zero Hallucination**: Every claim on a resume is linked to a specific, existing database record from the user's Career Vault. The system doesn't generate fake achievements—it finds, enhances, and presents real ones.

## 🏗️ Architecture

### Backend (Supabase Edge Functions)

#### 1. `match-requirements-to-bullets`
- **Purpose**: Semantic matching engine that pairs job requirements with career vault evidence
- **Input**: 
  - `userId`: User identifier
  - `jobRequirements`: Array of requirements from job description
  - `atsKeywords`: Critical, important, and nice-to-have keywords
- **Output**: Evidence Matrix with matched bullets, scores, and enhancement suggestions
- **Location**: `supabase/functions/match-requirements-to-bullets/`

#### 2. `generate-dual-resume-section`
- **Purpose**: Generates resume sections using either evidence-based or traditional approach
- **Modes**:
  - **Evidence-Based Mode**: When `evidenceMatrix` is provided, assembles pre-approved evidence
  - **Traditional Mode**: Falls back to AI generation when no evidence exists
- **Location**: `supabase/functions/generate-dual-resume-section/`

### Database Schema

#### `resume_requirement_mappings`
Stores the audit trail of every resume decision:
- `requirement_id`: The specific job requirement
- `milestone_id`: Source of truth from Career Vault
- `match_score`: 0-100 AI confidence score
- `match_reasons`: Array of why this evidence matches
- `user_selection`: User's choice (original/enhanced/custom)
- `enhanced_bullet`: AI-enhanced version with ATS keywords
- `original_bullet`: Exact text from user's history

### Frontend Components

#### `RequirementBulletMapper` 
**Location**: `src/components/resume-builder/v2/RequirementBulletMapper.tsx`

Three-column proof builder interface:
- **Column 1 (The Ask)**: Displays job requirement and priority
- **Column 2 (Your Proof)**: Shows matched evidence from Career Vault with match score
- **Column 3 (The Result)**: Presents enhanced, original, and custom edit options

**Features**:
- Navigate between requirements
- Toggle between enhanced/original/custom versions
- Swap evidence for better matches
- Real-time validation of selections

#### `SwapEvidenceDialog`
**Location**: `src/components/resume-builder/v2/SwapEvidenceDialog.tsx`

Allows users to manually select alternative evidence when the AI's top match isn't ideal:
- Fetches alternative milestones from Career Vault
- Re-scores alternatives against the requirement
- Displays match scores and source context
- Updates evidence selection on swap

#### `LiveResumeCanvas`
**Location**: `src/components/resume-builder/v2/LiveResumeCanvas.tsx`

Interactive resume preview with hover traceability:
- Shows match scores on bullet hover
- Displays source information (company, role, date)
- Visual indicators (🥇🥈🥉) for match strength
- Injects `ResumeBulletMetadata` into rendered bullets

#### `DualGenerationComparison`
**Location**: `src/components/resume-builder/DualGenerationComparison.tsx`

Comparison interface with Evidence Map tab:
- Shows coverage statistics (X of Y requirements matched)
- Displays full evidence matrix with scores
- Highlights ATS keywords in enhanced bullets
- Match reason explanations

### Integration Points

#### `SectionWizard.tsx`
Main orchestrator for evidence-based flow:
1. Calls `match-requirements-to-bullets` with full context
2. Presents `RequirementBulletMapper` for user review
3. Saves selections to `resume_requirement_mappings`
4. Calls `generate-dual-resume-section` with approved evidence

#### `SectionEditorPanel.tsx`
Alternative entry point for section editing:
- Similar flow to `SectionWizard`
- Handles evidence completion and database persistence
- Supports both evidence-based and traditional generation

## 📊 Data Models

### `EvidenceMatch`
```typescript
interface EvidenceMatch {
  requirementId: string;
  requirementText: string;
  requirementCategory: 'required' | 'preferred' | 'nice_to_have';
  
  originalBullet: string;
  originalSource: {
    jobTitle: string;
    company: string;
    dateRange: string;
  };
  
  matchScore: number;
  matchReasons: string[];
  
  enhancedBullet: string;
  atsKeywords: string[];
  milestoneId: string; // Link to vault_resume_milestones
}
```

### `ResumeBulletMetadata`
```typescript
interface ResumeBulletMetadata {
  requirementText?: string;
  matchScore?: number;
  originalSource?: {
    company: string;
    jobTitle: string;
    dateRange: string;
  };
  atsKeywords?: string[];
}
```

## 🔄 User Flow

1. **Job Analysis**: User provides job description
2. **Requirement Extraction**: System identifies key requirements
3. **Evidence Matching**: `match-requirements-to-bullets` finds best vault items
4. **User Review**: `RequirementBulletMapper` presents matches for approval
5. **Evidence Swap** (Optional): User can swap evidence via `SwapEvidenceDialog`
6. **Database Persistence**: Selections saved to `resume_requirement_mappings`
7. **Final Generation**: `generate-dual-resume-section` assembles approved evidence
8. **Live Preview**: `LiveResumeCanvas` shows final result with traceability

## 🔒 Key Features

### Defensibility
Every bullet point can be traced back to its source:
- Hover over bullet → See match score and source
- Evidence Map tab → Full audit trail
- Database record → Permanent link to Career Vault item

### Transparency
Users understand why content was selected:
- Match scores (0-100) show confidence
- Match reasons explain the connection
- Coverage stats show gaps in evidence

### Control
Users have final say over every decision:
- Choose enhanced, original, or custom versions
- Swap evidence for better matches
- Edit any bullet inline

## 🚀 Development Setup

### Prerequisites
- Supabase project (included via Lovable Cloud)
- Career Vault populated with user data

### Environment Variables
All environment variables are auto-configured via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_API_KEY` (backend only)

### Running Locally
```bash
npm install
npm run dev
```

### Deploying Edge Functions
Edge functions deploy automatically when code is pushed. No manual deployment needed.

## 📈 Future Enhancements

- **Real-time ATS Scoring**: Calculate keyword density and formatting scores
- **Evidence Strength Indicators**: Predict which evidence will perform best with ATS
- **Batch Evidence Operations**: Swap multiple pieces of evidence at once
- **Evidence Gaps Report**: Identify missing evidence and suggest vault improvements
- **Version History**: Track changes to evidence selections over time

## 🔧 Technical Details

### Match Score Algorithm
Scoring is performed by AI (via `match-requirements-to-bullets`):
- 90-100: Perfect match with quantified results
- 70-89: Strong relevance with clear connection
- 50-69: Moderate match, may need enhancement
- <50: Weak match, consider swapping

### ATS Keyword Integration
Enhanced bullets automatically integrate ATS keywords:
- Critical keywords: Must appear in enhanced version
- Important keywords: Added when context allows
- Nice-to-have keywords: Included if natural fit

### Data Persistence Strategy
All user decisions are saved for:
- Audit trail and compliance
- Re-generation without re-matching
- Analytics on evidence effectiveness
- Future AI training (with user consent)

---

## Project Info

**URL**: https://lovable.dev/projects/063e2d87-a1fd-4f0f-a2a2-78aeab05c9f0

**Built with**: React, TypeScript, Supabase, Lovable AI, Tailwind CSS

**Status**: ✅ Phase 1-4 Complete (100% Integration)

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/063e2d87-a1fd-4f0f-a2a2-78aeab05c9f0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/063e2d87-a1fd-4f0f-a2a2-78aeab05c9f0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

