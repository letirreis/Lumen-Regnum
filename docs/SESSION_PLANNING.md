# Session Planning System

## Overview

The Session Planning System expands the Sessions functionality to provide DMs with a comprehensive tool for preparing and structuring RPG sessions with goals, scenes, and narrative hooks.

## Features

### 1. Session Detail Page

When clicking on a session in the calendar (or creating a new one), you'll be redirected to a dedicated session detail page with two tabs:

- **Prep Tab** (Active): For planning and structuring the session before it happens
- **Log Tab** (Coming Soon): For recording what actually happened during the session

### 2. Session Overview Fields

The Prep tab contains an expandable overview section with the following fields:

| Field | Description |
|-------|-------------|
| `session_number` | Sequential session number (0, 1, 2, 3...) |
| `title` | Session title (e.g., "The Forgotten Conflict") |
| `goal_dm` | Your narrative objectives as DM |
| `focus_players` | What players should experience/discover |
| `synopsis` | 1-3 paragraph overview of the session plan |
| `expected_start_state` | Where and how the session begins |
| `expected_end_state` | What should be resolved by the end |

All fields feature **autosave** with visual feedback.

### 3. Scene Management

Below the overview, you can create and manage individual scenes that make up your session:

#### Scene Properties

Each scene is a collapsible card containing:

| Field | Type | Description |
|-------|------|-------------|
| `title` | Text | Name of the scene (e.g., "The Burning Gate") |
| `type` | Select | Social, Combat, Exploration, Investigation, Flashback, Downtime, Travel, Other |
| `description` | Textarea | Setting, atmosphere, and initial situation |
| `objective` | Textarea | What the scene should accomplish narratively |
| `npcs` | Array | List of NPCs involved in the scene |
| `beats` | Array | Key story points or details to cover |
| `branches` | Textarea | Possible player choices and paths |
| `hooks` | Textarea | Narrative threads left open for later |
| `order_index` | Number | Scene ordering (automatic) |

#### Scene Interactions

- **Create**: Click "+ Add Scene" to create a new scene
- **Expand/Collapse**: Click on scene header to show/hide details
- **Edit**: All fields auto-save on change
- **Delete**: Click trash icon to remove a scene
- **Reorder**: Drag scenes using the grip handle (visual cue provided)

### 4. Navigation Flow

```
Sessions Calendar
    ↓ (Click existing session or create new)
Session Detail Page
    ├─ Prep Tab (active)
    │   ├─ Session Overview
    │   └─ Scenes List
    └─ Log Tab (coming soon)
```

## Database Schema

### New Fields in `dmos_sessions`

```sql
session_number INTEGER
title TEXT
goal_dm TEXT
focus_players TEXT
synopsis TEXT
expected_start_state TEXT
expected_end_state TEXT
```

### New Table: `dmos_session_scenes`

```sql
CREATE TABLE dmos_session_scenes (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES dmos_sessions(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT,
  description TEXT,
  objective TEXT,
  location_id TEXT,
  npcs JSONB,
  beats JSONB,
  branches TEXT,
  hooks TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

The table includes:
- **RLS policies** ensuring users can only access their own campaign's scenes
- **Automatic updated_at trigger** for tracking modifications
- **Cascade delete** so scenes are removed when parent session is deleted

## Usage Guide

### Planning a Session

1. **Navigate to Sessions**: Click "Sessions" in the sidebar
2. **Create or Open Session**: 
   - Create new: Click a date on calendar or "Schedule Session"
   - Open existing: Click on an existing session card
3. **Fill Overview**: Start with high-level planning
   - Set session number and title
   - Define your DM goals
   - Write what players should experience
   - Create a synopsis of the overall plan
4. **Structure Scenes**: Break session into manageable scenes
   - Click "+ Add Scene"
   - Give each scene a clear objective
   - Note NPCs, beats, and possible branches
   - Set hooks for future sessions
5. **Refine**: Expand/collapse scenes as needed, everything auto-saves

### Best Practices

- **Start broad, then specific**: Fill overview before diving into scenes
- **One scene = one location or encounter**: Keep scenes focused
- **Use beats for reminders**: Note important clues, items, or moments
- **Plan for flexibility**: Use "branches" to anticipate player choices
- **Leave hooks**: Always plan what threads to leave unresolved

## API Reference

### Types (TypeScript)

```typescript
interface Session {
  // ... existing fields
  session_number?: number;
  title?: string;
  goal_dm?: string;
  focus_players?: string;
  synopsis?: string;
  expected_start_state?: string;
  expected_end_state?: string;
}

interface SessionScene {
  id: UUID;
  session_id: UUID;
  title: string;
  type: 'Social' | 'Combat' | 'Exploration' | 'Investigation' | 
        'Flashback' | 'Downtime' | 'Travel' | 'Other';
  description: string;
  objective: string;
  location_id?: UUID;
  npcs: string[];
  beats: string[];
  branches: string;
  hooks: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}
```

### Store API

```typescript
// Scenes CRUD
db.scenes.list(sessionId: UUID): Promise<SessionScene[]>
db.scenes.add(scene: SessionScene): Promise<void>
db.scenes.update(scene: SessionScene): Promise<void>
db.scenes.delete(id: UUID): Promise<void>
```

## Components

### SceneCard

Collapsible card component for displaying and editing individual scenes.

**Props:**
- `scene: SessionScene` - Scene data
- `onUpdate: (scene: SessionScene) => void` - Update callback
- `onDelete: (id: UUID) => void` - Delete callback
- `isExpanded: boolean` - Expansion state
- `onToggleExpand: () => void` - Toggle callback

### SessionDetail

Main page component for session planning.

**Route:** `/campaign/:id/sessions/:sessionId`

## Future Enhancements (Log Tab)

The Log tab will eventually include:
- What actually happened vs. what was planned
- Changes to world state, NPCs, factions
- Key player decisions and their impacts
- Rewards and XP awarded
- Loose ends to address in future sessions

## Migration

Run the migration script to enable session planning:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/003_session_planning.sql
```

This will:
1. Add new fields to existing `dmos_sessions` table
2. Create `dmos_session_scenes` table
3. Set up RLS policies
4. Create update trigger

## Styling

The feature follows the Lumen Regnum aesthetic:
- **Dark theme**: Obsidian backgrounds with subtle borders
- **Colors**: Gold/indigo/violet accents
- **Typography**: Cinzel font for headers
- **Interactive states**: Hover effects and smooth transitions
