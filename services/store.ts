
import { supabase } from './supabase';
import { Campaign, Character, NPC, Location, Faction, MagicItem, Encounter, Session, Note, Monster, UUID } from '../types';

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
            return [];
        }
        return data as T[];
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
  }
};
