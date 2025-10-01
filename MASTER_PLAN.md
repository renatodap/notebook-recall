# 🚀 MASTER PLAN: Recall Notebook → Game-Changing Academic Research Platform

**Mission:** Transform basic note-taking app into THE platform for academic researchers.

**Goal:** Implement 4 major feature pillars with complete TDD, intuitive UI, and production quality.

---

## 📊 Feature Pillars Overview

### Pillar 1: Academic Niche Features
**Target User:** PhD students, researchers, academics
**Core Value:** Professional citation management + PDF workflow + structured review templates

### Pillar 2: AI-First Differentiation
**Target User:** Anyone drowning in research papers
**Core Value:** Auto-discover connections, generate insights, find gaps in knowledge

### Pillar 3: Collaborative Learning
**Target User:** Research teams, study groups, academic communities
**Core Value:** Share knowledge graphs, follow researchers, collaborative collections

### Pillar 4: Publishing Workflow
**Target User:** Academic writers, bloggers, newsletter creators
**Core Value:** Transform research → polished output (blog, paper, newsletter, book)

---

## 🔑 Required API Keys & Services

### Already Have:
- ✅ `OPENAI_API_KEY` - GPT-4 for synthesis, embeddings
- ✅ `ANTHROPIC_API_KEY` - Claude for writing, analysis
- ✅ `SUPABASE` - Database with pgvector

### Need to Add:
- 📄 **OCR**: Tesseract.js (free, client-side) or Google Cloud Vision API
- 📚 **Citation APIs**:
  - CrossRef API (free, no key needed)
  - OpenAlex API (free, no key needed)
  - DOI.org resolution (free)
- 📊 **Graph Visualization**: D3.js + React Flow (free, no API)
- 🔗 **PDF Processing**: pdf.js (free) + pdf-parse (free)

**NEW ENV VARS NEEDED:**
```bash
# Optional - only if using Google Cloud Vision for premium OCR
GOOGLE_CLOUD_VISION_API_KEY=optional

# For citation fetching (free APIs, no keys needed)
# CrossRef: https://api.crossref.org/works/{doi}
# OpenAlex: https://api.openalex.org/works/doi:{doi}
```

---

## 📋 Complete Feature List (32 Features)

### PILLAR 1: Academic Features (8 features)

#### 1.1 Citation Export System
- Export to BibTeX, RIS, APA, MLA, Chicago formats
- Auto-fetch metadata from DOI/URL
- Batch export selected sources
- Copy citation to clipboard
- Citation style selector in UI

#### 1.2 PDF Annotation System
- Upload PDFs, extract text with OCR
- Highlight text, add comments
- Extract annotations to notes
- Link annotations to sources
- Annotation sidebar view

#### 1.3 Literature Review Templates
- Systematic review template
- Meta-analysis template
- Narrative review template
- Scoping review template
- PRISMA flow diagram generator

#### 1.4 Reference Manager
- Import from Zotero (BibTeX import)
- Import from Mendeley (RIS import)
- Import from EndNote (XML import)
- Duplicate detection
- Merge duplicate sources

#### 1.5 Academic Writing Assistant
- Paper structure templates (IMRaD)
- Section scaffolding (intro, methods, results, discussion)
- Word count tracking
- Citation insertion helper
- Literature review paragraph generator

#### 1.6 OCR for Scanned PDFs
- Tesseract.js integration (client-side)
- Extract text from images in PDFs
- Language detection (multi-language support)
- Confidence scoring
- Manual text correction interface

#### 1.7 Research Question Tracker
- Define research questions
- Link sources to questions
- Track which questions are answered
- Gap analysis (unanswered questions)
- Research question workspace

#### 1.8 Methodology Extractor
- Auto-detect research methods in papers
- Extract sample size, variables, measures
- Compare methodologies across sources
- Methodology summary table
- Export methodology matrix

---

### PILLAR 2: AI-First Features (10 features)

#### 2.1 Auto-Connection Discovery
- Find semantically similar sources
- Detect citation relationships
- Show "sources that cite this"
- Show "sources cited by this"
- Connection strength scoring

#### 2.2 Concept Extraction & Clustering
- Auto-extract key concepts from all sources
- Cluster sources by concept similarity
- Concept frequency analysis
- Concept timeline (how concepts evolve)
- Concept network visualization

#### 2.3 Synthesis Report Generator
- Generate literature review from selected sources
- Thematic synthesis across sources
- Compare & contrast analysis
- Key findings summary
- Research gap identification

#### 2.4 Contradiction Detector
- Find conflicting findings across sources
- Highlight disagreements between papers
- Show evolution of consensus over time
- Generate "conflicting views" report
- Reconciliation suggestions

#### 2.5 Timeline Visualization
- Plot sources on timeline
- Show field evolution over time
- Identify paradigm shifts
- Trend analysis
- Interactive timeline UI

#### 2.6 Research Gap Analyzer
- Identify under-researched topics
- Find missing connections
- Suggest future research directions
- Generate "future work" section
- Gap analysis report

#### 2.7 Smart Recommendations
- "What to read next" suggestions
- Based on current research focus
- Personalized to user's interests
- Diversity recommendations (explore new areas)
- Recency balance (classic vs. new papers)

#### 2.8 Automated Literature Review
- Full literature review generation
- Structured sections (intro, themes, gaps, conclusion)
- Citation integration
- Customizable length (500-5000 words)
- Export to Word/LaTeX

#### 2.9 Cross-Source Q&A
- Ask questions across all sources
- AI answers with citations
- Show supporting evidence from multiple sources
- Confidence scoring
- Interactive Q&A interface

#### 2.10 Research Assistant Chat
- Chat with your knowledge base
- Ask for summaries, comparisons, analyses
- Context-aware responses
- Citation of sources in responses
- Conversation history

---

### PILLAR 3: Collaborative Features (7 features)

#### 3.1 Knowledge Graph Visualization
- Force-directed graph of sources & concepts
- Interactive zoom/pan/filter
- Node sizing by importance
- Edge thickness by connection strength
- Export graph as image

#### 3.2 Public/Private Source Sharing
- Make sources public or private
- Share single source or collection
- Public profile page
- Privacy controls
- Embeddable widgets

#### 3.3 Follow Researchers
- Follow other users
- See their public reading lists
- Notification on new sources
- Following/followers counts
- Researcher directory

#### 3.4 Collaborative Collections
- Create shared collections
- Invite collaborators
- Real-time updates
- Comment threads
- Version history

#### 3.5 Social Features
- Like/bookmark sources
- Comment on sources
- @ mentions
- Activity feed
- Trending sources

#### 3.6 Team Workspaces
- Create team workspaces
- Shared knowledge base
- Role-based permissions (admin, editor, viewer)
- Team analytics
- Workspace settings

#### 3.7 Knowledge Graph Sharing
- Export knowledge graph as JSON
- Import others' knowledge graphs
- Merge knowledge graphs
- Graph templates (starter packs)
- Community graph marketplace

---

### PILLAR 4: Publishing Features (7 features)

#### 4.1 Blog Post Generator
- Transform sources → blog post
- Customizable tone (academic, casual, technical)
- Auto-generate introduction & conclusion
- Insert citations as hyperlinks
- SEO optimization suggestions

#### 4.2 Newsletter Generator
- Weekly/monthly research roundup
- Themed newsletters from collections
- Email-ready HTML export
- Newsletter templates
- Subscriber management (integration)

#### 4.3 Book Outline Generator
- Generate book outline from research
- Chapter structure from themes
- Content mapping (which sources → which chapters)
- Word count estimates
- Outline export to Markdown/Word

#### 4.4 Academic Paper Writer
- Full paper generation from sources
- IMRaD structure
- Methods section from methodology extraction
- Results section with figures/tables
- Discussion with synthesis
- LaTeX export

#### 4.5 Presentation Generator
- Create slide decks from sources
- Key points extraction
- Visual suggestions
- Export to PPTX/Google Slides
- Speaker notes

#### 4.6 Citation Manager for Publishing
- Insert inline citations while writing
- Auto-format bibliography
- Citation style switcher
- Citation editing interface
- Export formatted document

#### 4.7 Multi-Format Publishing
- Export to Markdown, HTML, PDF, DOCX, LaTeX
- Template system for outputs
- Custom CSS/styling
- Version control for drafts
- Publishing preview mode

---

## 🗂️ Database Schema Changes Needed

### New Tables:

```sql
-- PDF Annotations
CREATE TABLE annotations (
  id uuid PRIMARY KEY,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  page_number int,
  quote text,
  comment text,
  color varchar(20),
  position jsonb, -- {x, y, width, height}
  created_at timestamptz
);

-- Citations
CREATE TABLE citations (
  id uuid PRIMARY KEY,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  doi text,
  citation_metadata jsonb, -- {authors, year, journal, etc}
  bibtex text,
  created_at timestamptz
);

-- Connections (source relationships)
CREATE TABLE source_connections (
  id uuid PRIMARY KEY,
  source_a_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  source_b_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  connection_type varchar(50), -- 'cites', 'similar', 'contradicts'
  strength float, -- 0-1 score
  created_at timestamptz,
  UNIQUE(source_a_id, source_b_id, connection_type)
);

-- Concepts
CREATE TABLE concepts (
  id uuid PRIMARY KEY,
  name text UNIQUE,
  embedding vector(1536),
  created_at timestamptz
);

CREATE TABLE source_concepts (
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES concepts(id) ON DELETE CASCADE,
  relevance float, -- 0-1 score
  PRIMARY KEY (source_id, concept_id)
);

-- Collections (for collaborative & publishing)
CREATE TABLE collections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz
);

CREATE TABLE collection_sources (
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  added_at timestamptz,
  PRIMARY KEY (collection_id, source_id)
);

-- Follows
CREATE TABLE follows (
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz,
  PRIMARY KEY (follower_id, following_id)
);

-- Comments
CREATE TABLE comments (
  id uuid PRIMARY KEY,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz
);

-- Research Questions
CREATE TABLE research_questions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  status varchar(20), -- 'open', 'partial', 'answered'
  created_at timestamptz
);

CREATE TABLE question_sources (
  question_id uuid REFERENCES research_questions(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  relevance_note text,
  PRIMARY KEY (question_id, source_id)
);

-- Published Outputs
CREATE TABLE published_outputs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar(50), -- 'blog', 'newsletter', 'paper', 'book'
  title text NOT NULL,
  content text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

-- User Profiles (for public sharing)
CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  avatar_url text,
  is_public boolean DEFAULT false,
  research_interests text[]
);
```

---

## 🏗️ Implementation Order (by dependency)

### Phase 1: Foundation (Database + Core APIs)
1. Database migration with all new tables
2. Update types with new schemas
3. Core CRUD APIs for new tables

### Phase 2: Academic Features (Pillar 1)
1. Citation system (fetch metadata, export formats)
2. PDF upload & processing
3. OCR integration
4. PDF annotations
5. Literature review templates
6. Reference import
7. Research questions
8. Methodology extraction

### Phase 3: AI Features (Pillar 2)
1. Auto-connection discovery
2. Concept extraction
3. Synthesis generator
4. Contradiction detector
5. Timeline visualization
6. Gap analyzer
7. Recommendations
8. Literature review generator
9. Q&A system
10. Research assistant chat

### Phase 4: Collaboration (Pillar 3)
1. Collections system
2. Public/private sharing
3. User profiles
4. Follow system
5. Comments & social
6. Team workspaces
7. Knowledge graph viz
8. Graph sharing

### Phase 5: Publishing (Pillar 4)
1. Blog post generator
2. Newsletter generator
3. Book outline generator
4. Academic paper writer
5. Presentation generator
6. Citation manager
7. Multi-format export

### Phase 6: UI Implementation
1. All component creation
2. Navigation updates
3. New pages/routes
4. Styling & UX polish
5. Accessibility verification
6. Mobile responsiveness

### Phase 7: Testing & Validation
1. Unit tests for all features
2. Integration tests
3. E2E tests
4. Coverage validation (≥80%)
5. Performance testing
6. User testing

---

## 📁 File Structure Plan

```
recall-notebook/
├── docs/
│   ├── design/
│   │   ├── academic-citations.md
│   │   ├── pdf-annotations.md
│   │   ├── literature-review-templates.md
│   │   ├── ocr-integration.md
│   │   ├── auto-connections.md
│   │   ├── concept-extraction.md
│   │   ├── synthesis-generator.md
│   │   ├── contradiction-detector.md
│   │   ├── timeline-viz.md
│   │   ├── gap-analyzer.md
│   │   ├── recommendations.md
│   │   ├── research-assistant.md
│   │   ├── collections.md
│   │   ├── social-features.md
│   │   ├── knowledge-graph.md
│   │   ├── team-workspaces.md
│   │   ├── blog-generator.md
│   │   ├── newsletter-generator.md
│   │   ├── book-outline.md
│   │   └── academic-paper-writer.md
│   └── testing/
│       └── (corresponding test design docs)
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── citations/ (fetch, export, import)
│   │   │   ├── pdf/ (upload, process, ocr)
│   │   │   ├── annotations/ (CRUD)
│   │   │   ├── connections/ (discover, CRUD)
│   │   │   ├── concepts/ (extract, cluster)
│   │   │   ├── synthesis/ (generate reports)
│   │   │   ├── timeline/ (visualization data)
│   │   │   ├── recommendations/ (get suggestions)
│   │   │   ├── collections/ (CRUD, share)
│   │   │   ├── follows/ (CRUD)
│   │   │   ├── comments/ (CRUD)
│   │   │   ├── publish/ (blog, newsletter, paper)
│   │   │   └── chat/ (research assistant)
│   │   ├── citations/
│   │   ├── annotations/
│   │   ├── graph/ (knowledge graph page)
│   │   ├── insights/ (AI insights dashboard)
│   │   ├── collaborate/ (team workspace)
│   │   ├── publish/ (publishing dashboard)
│   │   └── profile/[userId]/ (public profiles)
│   │
│   ├── components/
│   │   ├── academic/
│   │   │   ├── CitationExporter.tsx
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── AnnotationTool.tsx
│   │   │   ├── LiteratureReviewTemplate.tsx
│   │   │   ├── ResearchQuestions.tsx
│   │   │   └── MethodologyExtractor.tsx
│   │   ├── ai/
│   │   │   ├── ConnectionGraph.tsx
│   │   │   ├── ConceptCloud.tsx
│   │   │   ├── SynthesisReport.tsx
│   │   │   ├── ContradictionFinder.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── GapAnalysis.tsx
│   │   │   ├── Recommendations.tsx
│   │   │   └── ResearchAssistant.tsx
│   │   ├── social/
│   │   │   ├── KnowledgeGraph.tsx
│   │   │   ├── CollectionCard.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   ├── FollowButton.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── ActivityFeed.tsx
│   │   └── publishing/
│   │       ├── BlogGenerator.tsx
│   │       ├── NewsletterBuilder.tsx
│   │       ├── BookOutline.tsx
│   │       ├── PaperWriter.tsx
│   │       └── PublishingPreview.tsx
│   │
│   └── lib/
│       ├── citations/ (BibTeX, RIS, citation styles)
│       ├── pdf/ (processing, OCR)
│       ├── ai/ (synthesis, analysis, recommendations)
│       ├── graph/ (knowledge graph algorithms)
│       └── publishing/ (generators, formatters)
│
└── supabase/
    └── migrations/
        └── 20250103000000_game_changer_features.sql
```

---

## ⏱️ Estimated Implementation Time

**Per Feature Average:** 2-4 hours (design + TDD + implementation + UI)

**Total Features:** 32 features

**Realistic Timeline:**
- Phase 1 (Foundation): 4 hours
- Phase 2 (Academic): 16 hours (8 features × 2h)
- Phase 3 (AI): 30 hours (10 features × 3h)
- Phase 4 (Collaboration): 14 hours (7 features × 2h)
- Phase 5 (Publishing): 14 hours (7 features × 2h)
- Phase 6 (UI Polish): 8 hours
- Phase 7 (Testing): 6 hours

**TOTAL: ~92 hours of focused work**

---

## 🎯 Success Metrics

### Technical:
- ✅ All 32 features implemented
- ✅ ≥80% test coverage
- ✅ Production build succeeds
- ✅ All APIs documented
- ✅ No TypeScript errors

### UX:
- ✅ Every feature has UI access
- ✅ All buttons provide feedback
- ✅ Intuitive navigation
- ✅ Mobile responsive
- ✅ Accessible (WCAG AA)

### Differentiation:
- ✅ 3+ features competitors don't have
- ✅ Clear value proposition
- ✅ Academic niche dominance
- ✅ AI capabilities unmatched

---

## 🚀 LET'S BEGIN

**Starting with Phase 1: Foundation**

Next steps:
1. Create database migration with all tables
2. Define TypeScript types
3. Build core CRUD APIs
4. Start Phase 2: Academic features

**TIME TO BUILD A GAME-CHANGER. NO STOPPING UNTIL DONE.**
