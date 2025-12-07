# Codex System

The **Codex** is a comprehensive worldbuilding and narrative management system for Lumen Regnum campaigns. It provides DMs with structured pages to organize all campaign lore, plots, and rules.

## Overview

The Codex appears in the sidebar navigation as an expandable menu item positioned between "Overview" and "Characters". It contains 10 specialized pages for different aspects of worldbuilding.

## Pages

### 1. Main Arc
**Route**: `/campaign/:id/codex/main-arc`

Define the core narrative of your campaign:
- **Premise**: 1-3 paragraph campaign overview
- **Core Conflict**: Central story tension
- **Primary Antagonist(s)**: Main opposition
- **Themes**: Campaign themes (e.g., tragedy, politics)
- **Arc Status**: Beginning, Rising Conflict, Climax, or Resolution
- **Final Goal**: Ultimate objective

### 2. Major Plots
**Route**: `/campaign/:id/codex/major-plots`

Manage sub-arcs and storylines:
- Create, edit, and delete plot entries
- Track plot status (Active, Future, Resolved, Dropped)
- Link to involved NPCs and factions
- Full CRUD interface with modal editor

### 3. World Lore
**Route**: `/campaign/:id/codex/world-lore`

Document the foundation of your world:
- **World Overview**: Broad world description
- **History Highlights**: Key historical events
- **Races & Cultures**: Major civilizations
- **Religion & Cosmology**: Gods, planes, beliefs

### 4. Magic & Technology
**Route**: `/campaign/:id/codex/magic-tech`

Define how magic and technology work:
- **Magic Nature**: What magic is and how it works
- **Magic Commonality**: How common is magic usage
- **Costs & Risks**: Consequences of magic use
- **Technology Level**: Medieval, Renaissance, Industrial, etc.

### 5. Politics & Factions
**Route**: `/campaign/:id/codex/politics-factions`

Map political landscape and power dynamics:
- **Political Landscape**: Government structures
- **Major Powers**: Rulers and influential figures
- **Current Tensions & Conflicts**: Wars, rivalries, intrigue

### 6. Secrets of the World
**Route**: `/campaign/:id/codex/secrets`

DM-only secrets and plot twists:
- Large freeform text area for hidden truths
- Special red visual indicator for DM eyes only
- Perfect for conspiracies, secret histories, and revelations

### 7. Tone & Aesthetic
**Route**: `/campaign/:id/codex/tone-aesthetic`

Define campaign mood and boundaries:
- **Emotional Palette**: Target emotions (dark, hopeful, gritty)
- **Inspirations**: Media, books, movies inspiring the campaign
- **Pacing**: Fast-paced action, slow-burn mystery, sandbox
- **Hard Limits**: Content boundaries for the table

### 8. World Timeline
**Route**: `/campaign/:id/codex/world-timeline`

Chronicle major historical events:
- Create, edit, and delete timeline entries
- Track event names, dates/eras, descriptions
- Note impact on current campaign
- Full CRUD interface with modal editor

### 9. Home Rules
**Route**: `/campaign/:id/codex/home-rules`

Document custom rules and modifications:
- Large freeform text area
- Perfect for house rules, clarifications, and system tweaks
- Examples provided in placeholder

### 10. Notes & Scraps
**Route**: `/campaign/:id/codex/notes`

Freeform scratchpad for ideas:
- No structure required
- Quick ideas, session prep, plot hooks
- Character concepts, scenes, references
- Anything that doesn't fit elsewhere

## Technical Implementation

### Database
- Table: `campaign_codex`
- One record per campaign (enforced by UNIQUE constraint)
- Auto-created on first access
- JSONB fields for structured data (main_arc, major_plots, etc.)
- TEXT fields for freeform content (secrets, home_rules, notes)
- Row-Level Security policies ensure users only access their own data

### Data Access
```typescript
// Get codex (auto-creates if doesn't exist)
const codex = await db.codex.get(campaignId);

// Update codex
await db.codex.update(codex);
```

### Navigation
- Codex menu item uses `Book` icon
- Clicking expands/collapses submenu
- Auto-expands when on any codex route
- Active state shows violet highlighting
- Chevron icons indicate expansion state

## Styling

All pages follow Lumen Regnum design system:
- Dark obsidian background
- Gold and violet/indigo accents
- Cinzel font for headings
- Semi-transparent cards with subtle borders
- Consistent save buttons with feedback states
- Responsive design matching existing pages

## Security

- RLS policies prevent cross-user data access
- All database functions use `SET search_path = public, pg_catalog`
- No client-side data leakage
- Secure auto-creation pattern

## Future Enhancements

Potential improvements:
- Markdown support for text fields
- Export/import codex data
- Template codex entries
- Search across all codex content
- Link recognition (e.g., @NPC_Name)
- Version history/rollback
