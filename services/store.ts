
import { supabase } from './supabase';
import { Campaign, Character, NPC, Location, Faction, MagicItem, Encounter, Session, Note, Monster, UUID, CampaignCodex, SessionScene, Tag } from '../types';

// Utility to generate IDs client-side (Supabase can do this, but we keep it for optimistic UI updates if needed)
export const generateId = (): UUID => {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Database Schema Keys (Tables)
// NOTE: dmos_tags and dmos_faction_tags tables must be created via SQL migrations 
// (see SQL_MIGRATIONS_REFERENCE.md) before using tag features
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
  CODEX: 'dmos_campaign_codex',
  SCENES: 'dmos_session_scenes',
  TAGS: 'dmos_tags', // Normalized tags (type, status, etc.)
  FACTION_TAGS: 'dmos_faction_tags', // Pivot table: faction_id, tag_id
  FACTION_MEMBERS: 'dmos_faction_members', // Pivot table: faction_id, member_id, member_type
};

// Generic Helper for basic CRUD
const api = {
    list: async <T>(table: string, campaignId?: string, filterColumn?: string): Promise<T[]> => {
        if (!supabase) { console.warn('Supabase not configured'); return []; }
        
        let query = supabase.from(table).select('*');
        if (campaignId) {
            const column = filterColumn || 'campaign_id';
            query = query.eq(column, campaignId);
        }
        // Only order by order_index for tables that have it (scenes table)
        if (table === TABLES.SCENES) {
            query = query.order('order_index', { ascending: true, nullsFirst: false });
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
    add: async <T>(table: string, item: T): Promise<{ data: T | null; error: any }> => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.from(table).insert(item).select().maybeSingle();
        if (error) {
            console.error(`Error adding to ${table}`, error);
        }
        return { data: data as T | null, error };
    },
    update: async <T extends { id: string }>(table: string, item: T): Promise<{ data: T | null; error: any }> => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.from(table).update(item).eq('id', item.id).select().maybeSingle();
        if (error) {
            console.error(`Error updating ${table}`, error);
        }
        return { data: data as T | null, error };
    },
    delete: async (table: string, id: string): Promise<{ data: any; error: any }> => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            console.error(`Error deleting from ${table}`, error);
        }
        return { data, error };
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
      return created as CampaignCodex;
    },
    update: async (codex: CampaignCodex): Promise<{ data: CampaignCodex | null; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      const { data, error } = await supabase
        .from(TABLES.CODEX)
        .update(codex)
        .eq('id', codex.id)
        .select()
        .maybeSingle();
      if (error) {
        console.error('Error updating codex', error);
      }
      return { data: data as CampaignCodex | null, error };
    },
  },
  scenes: {
    list: (sessionId: UUID) => api.list<SessionScene>(TABLES.SCENES, sessionId, 'session_id'),
    add: (scene: SessionScene) => api.add(TABLES.SCENES, scene),
    update: (scene: SessionScene) => api.update(TABLES.SCENES, scene),
    delete: (id: UUID) => api.delete(TABLES.SCENES, id),
  },
  // Tags API (requires dmos_tags table created via SQL migrations)
  tags: {
    list: (campaignId: UUID) => api.list<Tag>(TABLES.TAGS, campaignId),
    add: (tag: Tag) => api.add(TABLES.TAGS, tag),
    update: (tag: Tag) => api.update(TABLES.TAGS, tag),
    delete: (id: UUID) => api.delete(TABLES.TAGS, id),
  },
  // Faction-Tags Pivot Table API (requires dmos_faction_tags table created via SQL migrations)
  faction_tags: {
    // List all tags for a faction
    listForFaction: async (factionId: UUID): Promise<any[]> => {
      if (!supabase) { console.warn('Supabase not configured'); return []; }
      const { data, error } = await supabase
        .from(TABLES.FACTION_TAGS)
        .select('*')
        .eq('faction_id', factionId);
      if (error) {
        console.error('Error listing faction tags', error);
        return [];
      }
      return data || [];
    },
    // Set tags for a faction (replaces all existing tags)
    setForFaction: async (factionId: UUID, tagIds: UUID[]): Promise<{ data: any; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      
      // Delete all existing tags for this faction
      const { error: deleteError } = await supabase
        .from(TABLES.FACTION_TAGS)
        .delete()
        .eq('faction_id', factionId);
      
      if (deleteError) {
        console.error('Error deleting existing faction tags', deleteError);
        return { data: null, error: deleteError };
      }
      
      // If no tags to add, return success
      if (!tagIds || tagIds.length === 0) {
        return { data: [], error: null };
      }
      
      // Add new tag associations
      const links = tagIds.map(tagId => ({ faction_id: factionId, tag_id: tagId }));
      const { data, error } = await supabase
        .from(TABLES.FACTION_TAGS)
        .insert(links)
        .select();
      
      if (error) {
        console.error('Error adding faction tags', error);
      }
      
      return { data, error };
    },
    // Add a single tag association to a faction
    addLink: async (factionId: UUID, tagId: UUID): Promise<{ data: any; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      const { data, error } = await supabase
        .from(TABLES.FACTION_TAGS)
        .insert({ faction_id: factionId, tag_id: tagId })
        .select();
      if (error) {
        console.error('Error adding faction tag', error);
      }
      return { data, error };
    },
    // Remove a single tag association from a faction
    deleteLink: async (factionId: UUID, tagId: UUID): Promise<{ data: any; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      const { data, error } = await supabase
        .from(TABLES.FACTION_TAGS)
        .delete()
        .eq('faction_id', factionId)
        .eq('tag_id', tagId);
      if (error) {
        console.error('Error deleting faction tag', error);
      }
      return { data, error };
    },
    // Delete all tags for a faction (useful when deleting faction)
    deleteAll: async (factionId: UUID): Promise<{ data: any; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      const { data, error } = await supabase
        .from(TABLES.FACTION_TAGS)
        .delete()
        .eq('faction_id', factionId);
      if (error) {
        console.error('Error deleting all faction tags', error);
      }
      return { data, error };
    },
  },
  // Faction-Members Pivot Table API (requires dmos_faction_members table created via SQL migrations)
  faction_members: {
    // List all members for a faction
    listForFaction: async (factionId: UUID): Promise<any[]> => {
      if (!supabase) { console.warn('Supabase not configured'); return []; }
      const { data, error } = await supabase
        .from(TABLES.FACTION_MEMBERS)
        .select('*')
        .eq('faction_id', factionId);
      if (error) {
        console.error('Error listing faction members', error);
        return [];
      }
      return data || [];
    },
    
    // Set members for a faction (replaces all existing members)
    setForFaction: async (factionId: UUID, memberIds: UUID[], memberTypes: string[]): Promise<{ data: any; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      
      // Delete all existing members for this faction
      const { error: deleteError } = await supabase
        .from(TABLES.FACTION_MEMBERS)
        .delete()
        .eq('faction_id', factionId);
      
      if (deleteError) {
        console.error('Error deleting existing faction members', deleteError);
        return { data: null, error: deleteError };
      }
      
      // If no members to add, return success
      if (!memberIds || memberIds.length === 0) {
        return { data: [], error: null };
      }
      
      // Add new member associations
      const links = memberIds.map((memberId, idx) => ({ 
        faction_id: factionId, 
        member_id: memberId,
        member_type: memberTypes[idx]
      }));
      const { data, error } = await supabase
        .from(TABLES.FACTION_MEMBERS)
        .insert(links)
        .select();
      
      if (error) {
        console.error('Error adding faction members', error);
      }
      
      return { data, error };
    },
    
    // Delete all members for a faction (useful when deleting faction)
    deleteAll: async (factionId: UUID): Promise<{ data: any; error: any }> => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      const { data, error } = await supabase
        .from(TABLES.FACTION_MEMBERS)
        .delete()
        .eq('faction_id', factionId);
      if (error) {
        console.error('Error deleting all faction members', error);
      }
      return { data, error };
    },
  }
};
