
export type UUID = string;

// RF1: Characters
export interface Character {
  id: UUID;
  campaign_id: UUID;
  name: string;
  race: string;
  class: string;
  subclass?: string;
  level: number;
  faction_id?: UUID; // Associated faction
  ac: number;
  max_hp: number;
  current_hp?: number; // Runtime tracking
  attributes: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  passives: {
    perception: number;
    insight: number;
    investigation: number;
  };
  speed: number;
  resistances: string;
  immunities: string;
  feats: string;
  notes: string;
  hooks: string;
}

// RF2: NPCs
export interface NPC {
  id: UUID;
  campaign_id: UUID;
  // Identity
  name: string;
  title: string;
  npc_type: string; // e.g. Merchant, Citizen
  race?: string; // D&D race (Dragonborn, Dwarf, Elf, etc.)
  class?: string; // D&D class (Artificer, Barbarian, Bard, etc.)
  status: string; // Ally, Neutral, Hostile
  magic_level: string; // None, Low, High
  alignment: string;
  
  // Stats
  attributes?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  // Description
  appearance: string;
  mannerisms: string;
  voice: string;

  // Personality
  personality_tags: string;
  motivation: string;
  secret: string;

  // Importance
  importance: string; // Critical, Relevant, Flavor
  role: string; // Narrative role (Mentor, etc)

  // Bonds
  faction_id?: UUID;
  location_id?: UUID;
  frequented_locations: string;
  relationships: string; // Text field for Family, Friends, Enemies
  
  notes: string;
}

// New: Monsters
export interface Monster {
  id: UUID;
  campaign_id: UUID;
  
  // 1. Identity
  name: string;
  monster_type: string; // Beast, Humanoid, Undead, etc.
  size: string; // Tiny, Small, Medium, Large, Huge, Gargantuan
  cr: string; // Challenge Rating
  alignment: string;
  origin_biome: string;
  role: string; // Minion, Boss, etc.
  status: string; // Alive, Dead, Ally, Enemy

  // 2. Basic Stats
  ac: number;
  max_hp: number;
  speed: string;
  attributes?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills: string;
  senses: string;
  languages: string;
  resistances: string;
  immunities: string;
  vulnerabilities: string;

  // 3. Combat & 4. Magic
  actions: string; // Text block
  reactions: string;
  legendary_actions: string;
  spells: string;

  // 5. Behavior
  intelligence_level: string;
  tactics: string;

  // 6. World Bonds & 7. Narrative
  locations_found: string;
  loot: string;
  narrative_theme: string;
  horror_scale: string; // 1-5
  consequences: string;

  // 8. Session Notes
  notes: string;
}

// RF3: Locations (Lumen Regnum Structure)
export interface Location {
  id: UUID;
  campaign_id: UUID;
  
  // 1. Identity
  name: string;
  type: string; // city, village, dungeon, etc.
  region: string; // Biome
  faction_influence: string; // Legacy field - kept for compatibility
  faction_ids?: UUID[]; // New: connected factions (requires dmos_location_factions pivot table or stored as array)
  importance: string; // Irrelevant, Relevant, Critical, Epic
  accent_color?: string; // Custom Color
  tags?: string; // Custom Tags

  // 2. Description Essential
  description: string; // Short 2-4 lines
  atmosphere: string; // Mood/Sensory
  magic_intensity?: string; // Dead, Low, Normal, Wild, High

  // 3. Details
  architecture: string;
  population: string;
  government: string;
  economy: string;
  magic_tech: string;
  climate?: string; // Recurring Weather

  // 4. Perigos
  dangers: string;
  typical_creatures?: string; // Common encounters
  
  // 5. Rumores
  rumors: string;

  // 6. Segredos
  secrets: string;

  // 7. NPCs
  npcs_related: string;

  // 8. Locais Internos
  sub_locations: string; // Districts, rooms
  map_description?: string; // Simplified Map

  // 9. Eventos
  events: string;

  // 10. Conexões
  connections: string;
  
  map_url?: string;
}

// RF4: Factions
export interface Faction {
  id: UUID;
  campaign_id: UUID;
  name: string;
  goal: string;
  methods: string;
  resources: string;
  conflicts: string;
  influence: string;
  notes: string;
  tag_ids?: UUID[]; // New: associated tags via dmos_faction_tags pivot table (tags can be of any type: type, status, custom, etc.)
  member_ids?: UUID[]; // New: IDs of NPCs/Characters associated (transient, not persisted directly)
}

// Tags for normalized metadata (requires dmos_tags table)
export interface Tag {
  id: UUID;
  campaign_id: UUID;
  name: string;
  color?: string; // Hex color or preset name
  tag_type?: string; // e.g., 'type', 'status', 'custom'
  created_by?: UUID;
  created_at?: string;
}

// RF5: Magic Items (Lumen Regnum Structure)
export interface MagicItem {
  id: UUID;
  campaign_id: UUID;
  
  // 1. Identidade
  name: string;
  rarity: string; // Common, Uncommon, Rare, Very Rare, Legendary, Artifact
  type: string; // Weapon, Armor, Wondrous Item, Ring, Potion, Scroll, etc.
  item_class: string; // Minor Magic, Major Magic, Campaign Artifact, Divine Artifact
  status: string; // Intact, Corrupted, Sealed, Incomplete
  accent_color?: string; // Custom Color
  tags?: string; // Custom Tags

  // 2. Aparência
  appearance: string; // Material, aura, runes
  runes?: string; // Associated Runes

  // 3. Efeitos
  effects_passive: string;
  effects_active: string;
  conditions: string;
  random_effects?: string; // Table of random effects

  // 4. Custo / Requisitos
  requirements: string; // Attunement, Class/Alignment reqs
  class_compatibility?: string; // Specific class notes
  side_effects: string; // Curses, penalties
  corruption_growth?: string; // Gradual corruption

  // 5. Lore / História
  lore: string; // Origin, previous owners, myth

  // 6. Evolução
  evolution: string; // Stages, unlock conditions

  // 7. Dono Atual
  owner: string; // PC or NPC name

  // 8. Local Onde Foi Encontrado
  found_at_location_id: string; // Link to Location

  // 9. Conexões
  connections: string; // NPCs, Factions, Monsters

  // 10. Ganchos
  hooks: string; // Secrets, future adventures
}

// RF6: Encounters
export interface Combatant {
  id: UUID;
  name: string;
  type: 'PC' | 'NPC' | 'Monster';
  ac: number;
  hp: number;
  max_hp: number;
  initiative: number;
  conditions: string[];
  notes?: string;
}

export interface Encounter {
  id: UUID;
  campaign_id: UUID;
  name: string;
  creatures: Combatant[]; // JSON array in DB, typed array here
  status: 'planned' | 'active' | 'done';
  notes: string;
  round: number;
}

// RF7: Sessions
export interface Session {
  id: UUID;
  campaign_id: UUID;
  date: string;
  summary: string;
  decisions: string;
  npcs_encountered: string[];
  locations_visited: string[];
  items_found: string[];
  secrets_revealed: string;
  consequences: string;
  next_hooks: string;
  notes: string;
  // Session Planning/Prep fields
  session_number?: number;
  title?: string;
  goal_dm?: string;
  focus_players?: string;
  synopsis?: string;
  expected_start_state?: string;
  expected_end_state?: string;
}

// Session Scenes (for session planning/prep)
export interface SessionScene {
  id: UUID;
  session_id: UUID;
  title: string;
  type: 'Social' | 'Combat' | 'Exploration' | 'Investigation' | 'Flashback' | 'Downtime' | 'Travel' | 'Other';
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

// Quick Notes (Dashboard)
export interface Note {
  id: UUID;
  campaign_id: UUID;
  title: string;
  content: string;
  created_at: string;
}

// RF9: Campaign
export interface Campaign {
  id: UUID;
  name: string;
  theme: string;
  main_arc: string;
  status: 'active' | 'paused' | 'finished';
  notes: string;
}

// Campaign Codex (Worldbuilding & Narrative)
export interface CampaignCodex {
  id: UUID;
  campaign_id: UUID;
  main_arc: {
    premise?: string;
    core_conflict?: string;
    primary_antagonist?: string;
    themes?: string;
    arc_status?: 'Beginning' | 'Rising Conflict' | 'Climax' | 'Resolution';
    final_goal?: string;
  };
  major_plots: Array<{
    id: string;
    name: string;
    description: string;
    involved_npcs?: string;
    involved_factions?: string;
    status: 'Active' | 'Future' | 'Resolved' | 'Dropped';
  }>;
  world_lore: {
    overview?: string;
    history_highlights?: string;
    races_cultures?: string;
    religion_cosmology?: string;
  };
  magic_and_technology: {
    magic_nature?: string;
    magic_commonality?: string;
    costs_risks?: string;
    technology_level?: string;
  };
  politics_and_factions: {
    political_landscape?: string;
    major_powers?: string;
    tensions_conflicts?: string;
  };
  secrets_of_world: string;
  tone_and_aesthetic: {
    emotional_palette?: string;
    inspirations?: string;
    pacing?: string;
    hard_limits?: string;
  };
  world_timeline: Array<{
    id: string;
    event_name: string;
    era_date?: string;
    description: string;
    impact?: string;
  }>;
  home_rules: string;
  notes_and_scraps: string;
  created_at?: string;
  updated_at?: string;
}

export type EntityType = 'npc' | 'location' | 'faction' | 'item' | 'character' | 'session' | 'monster';
