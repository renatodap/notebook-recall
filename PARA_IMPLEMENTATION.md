# PARA System Implementation

## Overview

The PARA (Projects, Areas, Resources, Archive) organizational system has been fully implemented in Recall Notebook. This system provides a powerful way to organize all sources based on the methodology created by Tiago Forte.

## What is PARA?

- **Projects**: Short-term efforts with specific goals and deadlines (e.g., "Write research paper", "Q4 Marketing Campaign")
- **Areas**: Long-term responsibilities and areas of focus that require ongoing attention (e.g., "Health", "Career Development", "Team Management")
- **Resources**: Topics of interest and reference materials (e.g., "Machine Learning", "Design Patterns", "Productivity Techniques")
- **Archive**: Inactive items from the other three categories

## Key Features

### 1. Flexible Assignment
- Every source MUST belong to at least one of: Project, Area, Resource, OR be archived
- Sources can belong to multiple categories simultaneously
  - Example: A source can be in 2 projects, 1 area, and 3 resources
  - Example: A source can be in just 1 area
  - Example: An archived source can still belong to other PAR categories but won't show elsewhere

### 2. Database Schema

#### New Tables Created:
- `projects` - Store user projects with goals and deadlines
- `areas` - Store user areas with standards and review frequency
- `resources` - Store user resources with categories
- `project_sources` - Many-to-many junction table
- `area_sources` - Many-to-many junction table
- `resource_sources` - Many-to-many junction table

#### Source Table Enhancement:
- Added `archived` boolean field (default: false)
- Added `archived_at` timestamp field

### 3. Database Functions
- `get_para_stats(user_id)` - Get PARA statistics for a user
- `get_unassigned_sources(user_id)` - Get sources that need organization
- `source_meets_para_requirements(source_id)` - Check if source meets PARA rules

### 4. Row Level Security (RLS)
All new tables have proper RLS policies ensuring users can only access their own data.

## API Endpoints

### Projects
- `GET /api/para/projects` - List all projects
- `POST /api/para/projects` - Create a new project
- `GET /api/para/projects/[id]` - Get project with sources
- `PATCH /api/para/projects/[id]` - Update project
- `DELETE /api/para/projects/[id]` - Delete project

### Areas
- `GET /api/para/areas` - List all areas
- `POST /api/para/areas` - Create a new area
- `GET /api/para/areas/[id]` - Get area with sources
- `PATCH /api/para/areas/[id]` - Update area
- `DELETE /api/para/areas/[id]` - Delete area

### Resources
- `GET /api/para/resources` - List all resources
- `POST /api/para/resources` - Create a new resource
- `GET /api/para/resources/[id]` - Get resource with sources
- `PATCH /api/para/resources/[id]` - Update resource
- `DELETE /api/para/resources/[id]` - Delete resource

### Source Management
- `POST /api/para/sources/assign` - Assign source to PARA categories
- `POST /api/para/sources/unassign` - Remove source from PARA categories
- `POST /api/para/sources/archive` - Archive/unarchive a source
- `GET /api/para/sources/archive` - Get all archived sources
- `GET /api/para/sources/[id]/status` - Get PARA status for a source
- `GET /api/para/sources/unassigned` - Get unassigned sources

### Statistics
- `GET /api/para/stats` - Get PARA statistics
  - Total sources
  - Archived sources
  - Unassigned sources (need organization)
  - Project count
  - Area count
  - Resource count

## UI Components

### 1. Dashboard Integration (`PARADashboard.tsx`)
- Shows overview of Projects, Areas, and Resources
- Displays warning for unassigned sources
- Shows count of archived sources
- Quick links to create new categories
- Quick access to top 3 items in each category

### 2. Archive Page (`/para/archive`)
- Dedicated page for viewing archived sources
- Ability to unarchive sources
- Shows when sources were archived

### 3. PARA Assignment Modal (`PARAAssignmentModal.tsx`)
- Modal for assigning sources to PARA categories
- Shows all available Projects, Areas, and Resources
- Multi-select checkboxes for flexible assignment
- Displays current assignments
- Easy to add/remove assignments

### 4. Archive View (`ArchiveView.tsx`)
- Component for displaying archived sources
- One-click unarchive functionality
- Empty state messaging

## TypeScript Types

All PARA-related types are defined in `src/types/index.ts`:
- `Project`, `Area`, `Resource`
- `ProjectSource`, `AreaSource`, `ResourceSource`
- `SourceWithPARA` - Extended source type
- `PARAStats` - Statistics interface
- Request/Response types for all operations

## Migration File

**Migration**: `supabase/migrations/20251002_add_para_system.sql`

This migration includes:
1. Table creation for projects, areas, resources
2. Junction tables for many-to-many relationships
3. Source table alterations (archived fields)
4. Indexes for performance
5. Helper functions
6. RLS policies
7. Triggers for timestamps and archive tracking
8. View for source PARA status

## How to Use

### 1. Run the Migration
```bash
# Apply the migration to your Supabase instance
supabase db push
```

### 2. Create Your PARA Structure
1. Go to dashboard
2. Click on Projects/Areas/Resources sections
3. Create your organizational structure

### 3. Organize Sources
1. For each source, click "Organize"
2. Select which Projects/Areas/Resources it belongs to
3. A source must belong to at least one category OR be archived

### 4. Archive Inactive Sources
1. When a source is no longer active, archive it
2. Archived sources won't appear in normal views
3. Access archived sources via `/para/archive`

## Business Rules Enforced

1. **Every source must be organized**: Each source must belong to at least one Project, Area, or Resource, OR be archived
2. **Flexible categorization**: Sources can belong to multiple categories
3. **Archive isolation**: Archived sources only appear in the Archive page
4. **User isolation**: All PARA data is user-specific via RLS

## Dashboard Features

The dashboard now shows:
- PARA organization section with overview cards
- Warning banner for unassigned sources with count
- Quick links to manage each category
- Archive section with archived source count
- Seamless integration with existing source management

## Next Steps (Optional Enhancements)

1. **Batch Operations**: Add ability to assign multiple sources at once
2. **PARA Templates**: Provide template Projects/Areas/Resources for common use cases
3. **Smart Suggestions**: AI-powered suggestions for which PARA category a source belongs to
4. **PARA Analytics**: Visualize how sources are distributed across PARA categories
5. **Review Reminders**: Notifications based on area review frequency
6. **Project Completion**: Workflow for completing projects and archiving related sources
7. **PARA Export**: Export PARA structure and assignments

## Files Created

### Migration
- `supabase/migrations/20251002_add_para_system.sql`

### Types
- Updated `src/types/index.ts` with PARA types

### API Routes
- `src/app/api/para/projects/route.ts`
- `src/app/api/para/projects/[id]/route.ts`
- `src/app/api/para/areas/route.ts`
- `src/app/api/para/areas/[id]/route.ts`
- `src/app/api/para/resources/route.ts`
- `src/app/api/para/resources/[id]/route.ts`
- `src/app/api/para/sources/assign/route.ts`
- `src/app/api/para/sources/unassign/route.ts`
- `src/app/api/para/sources/archive/route.ts`
- `src/app/api/para/sources/[id]/status/route.ts`
- `src/app/api/para/sources/unassigned/route.ts`
- `src/app/api/para/stats/route.ts`

### Components
- `src/components/para/PARADashboard.tsx`
- `src/components/para/PARAAssignmentModal.tsx`
- `src/components/para/ArchiveView.tsx`

### Pages
- `src/app/para/archive/page.tsx`
- Updated `src/app/dashboard/page.tsx`

## Summary

The PARA system is now fully integrated into Recall Notebook, providing users with a powerful, flexible way to organize all their sources. The implementation follows best practices with proper database design, type safety, RLS security, and a clean UI/UX.
