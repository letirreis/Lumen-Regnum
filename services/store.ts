
import { supabase } from './supabase';
import { Campaign, Character, NPC, Location, Faction, MagicItem, Encounter, Session, Note, Monster, UUID, CampaignCodex } from '../types';

// Utility to generate IDs client-side (Supabase can do this, but we keep it for optimistic UI updates if needed)
export const generateId = (): UUID => {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Database Schema Keys (Tables)
const TABLES = {
  CAMPAIGNS: 'dmos_campaigns',
  CHARACTERS: 'dmos_characters',
  NPCS: 'dmos_npcs',
  MONSTERS: 'dmos_monsters',
  LOCATIONS: 'dmos_locations',
  FACTIONS: 'dmos_factions',
  ITEMS: 'dmos_items',
  ENCOUNTERS: 'dmos_encounters',
  SESSIONS: 'dmos_sessions',
  NOTES: 'dmos_notes',
  CODEX: 'campaign_codex',
};

// Generic Helper for basic CRUD
const api = {
    list: async <T>(table: string, campaignId?: string): Promise<T[]> => {
        if (!supabase) { console.warn('Supabase not configured'); return []; }
        
        let query = supabase.from(table).select('*');
        if (campaignId) {
            query = query.eq('campaign_id', campaignId);
        }
        const { data, error } = await query;
        if (error) {
            console.error(`Error listing ${table}`, error);
            // CRITICAL FIX: Return empty array instead of causing crash if error occurs
            return [];
        }
        // CRITICAL FIX: Return empty array if data is null (Supabase sometimes returns null for empty tables)
        return (data || []) as T[];
    },
    add: async <T>(table: string, item: T): Promise<void> => {
        if (!supabase) return;
        const { error } = await supabase.from(table).insert(item);
        if (error) console.error(`Error adding to ${table}`, error);
    },
    update: async <T extends { id: string }>(table: string, item: T): Promise<void> => {
        if (!supabase) return;
        const { error } = await supabase.from(table).update(item).eq('id', item.id);
        if (error) console.error(`Error updating ${table}`, error);
    },
    delete: async (table: string, id: string): Promise<void> => {
        if (!supabase) return;
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) console.error(`Error deleting from ${table}`, error);
    }
}

// --- Exported API (Async) ---

export const db = {
  campaigns: {
    list: () => api.list<Campaign>(TABLES.CAMPAIGNS),
    add: (c: Campaign) => api.add(TABLES.CAMPAIGNS, c),
    update: (c: Campaign) => api.update(TABLES.CAMPAIGNS, c),
    delete: (id: UUID) => api.delete(TABLES.CAMPAIGNS, id),
  },
  characters: {
    list: (campaignId: UUID) => api.list<Character>(TABLES.CHARACTERS, campaignId),
    add: (c: Character) => api.add(TABLES.CHARACTERS, c),
    update: (c: Character) => api.update(TABLES.CHARACTERS, c),
    delete: (id: UUID) => api.delete(TABLES.CHARACTERS, id),
  },
  npcs: {
    list: (campaignId: UUID) => api.list<NPC>(TABLES.NPCS, campaignId),
    add: (c: NPC) => api.add(TABLES.NPCS, c),
    update: (c: NPC) => api.update(TABLES.NPCS, c),
    delete: (id: UUID) => api.delete(TABLES.NPCS, id),
  },
  monsters: {
    list: (campaignId: UUID) => api.list<Monster>(TABLES.MONSTERS, campaignId),
    add: (c: Monster) => api.add(TABLES.MONSTERS, c),
    update: (c: Monster) => api.update(TABLES.MONSTERS, c),
    delete: (id: UUID) => api.delete(TABLES.MONSTERS, id),
  },
  locations: {
    list: (campaignId: UUID) => api.list<Location>(TABLES.LOCATIONS, campaignId),
    add: (c: Location) => api.add(TABLES.LOCATIONS, c),
    update: (c: Location) => api.update(TABLES.LOCATIONS, c),
    delete: (id: UUID) => api.delete(TABLES.LOCATIONS, id),
  },
  factions: {
    list: (campaignId: UUID) => api.list<Faction>(TABLES.FACTIONS, campaignId),
    add: (c: Faction) => api.add(TABLES.FACTIONS, c),
    update: (c: Faction) => api.update(TABLES.FACTIONS, c),
    delete: (id: UUID) => api.delete(TABLES.FACTIONS, id),
  },
  items: {
    list: (campaignId: UUID) => api.list<MagicItem>(TABLES.ITEMS, campaignId),
    add: (c: MagicItem) => api.add(TABLES.ITEMS, c),
    update: (c: MagicItem) => api.update(TABLES.ITEMS, c),
    delete: (id: UUID) => api.delete(TABLES.ITEMS, id),
  },
  encounters: {
    list: (campaignId: UUID) => api.list<Encounter>(TABLES.ENCOUNTERS, campaignId),
    add: (c: Encounter) => api.add(TABLES.ENCOUNTERS, c),
    update: (c: Encounter) => api.update(TABLES.ENCOUNTERS, c),
    delete: (id: UUID) => api.delete(TABLES.ENCOUNTERS, id),
  },
  sessions: {
    list: (campaignId: UUID) => api.list<Session>(TABLES.SESSIONS, campaignId),
    add: (c: Session) => api.add(TABLES.SESSIONS, c),
    update: (c: Session) => api.update(TABLES.SESSIONS, c),
    delete: (id: UUID) => api.delete(TABLES.SESSIONS, id),
  },
  notes: {
    list: (campaignId: UUID) => api.list<Note>(TABLES.NOTES, campaignId),
    add: (c: Note) => api.add(TABLES.NOTES, c),
    update: (c: Note) => api.update(TABLES.NOTES, c),
    delete: (id: UUID) => api.delete(TABLES.NOTES, id),
  },
  codex: {
    // Get or create codex for a campaign
    get: async (campaignId: UUID): Promise<CampaignCodex | null> => {
      if (!supabase) { console.warn('Supabase not configured'); return null; }
      
      const { data, error } = await supabase
        .from(TABLES.CODEX)
        .select('*')
        .eq('campaign_id', campaignId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, create a new codex entry
          console.log('No codex found, auto-creating for campaign:', campaignId);
          return await db.codex.create(campaignId);
        }
        console.error('Error fetching codex', error);
        return null;
      }
      
      return data as CampaignCodex;
    },
    create: async (campaignId: UUID): Promise<CampaignCodex | null> => {
      if (!supabase) { console.warn('Supabase not configured'); return null; }
      
      const newCodex: Partial<CampaignCodex> = {
        campaign_id: campaignId,
        main_arc: {},
        major_plots: [],
        world_lore: {},
        magic_and_technology: {},
        politics_and_factions: {},
        secrets_of_world: '',
        tone_and_aesthetic: {},
        world_timeline: [],
        home_rules: '',
        notes_and_scraps: '',
      };
      
      const { data: created, error: createError } = await supabase
        .from(TABLES.CODEX)
        .insert(newCodex)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating codex:', createError);
        return null;
      }
      console.log('Codex created successfully');
      return created as CampaignCodex;
    },
    update: async (codex: CampaignCodex): Promise<void> => {
      if (!supabase) return;
      const { error } = await supabase
        .from(TABLES.CODEX)
        .update(codex)
        .eq('id', codex.id);
      if (error) console.error('Error updating codex', error);
    },
  }
};
