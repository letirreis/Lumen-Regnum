
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { db, generateId } from './services/store';
import { Campaign } from './types';
import { Button, Card, Input, Modal, ConfirmModal } from './components/ui';
import { Plus, Trash2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { SupabaseSetup } from './components/SupabaseSetup';
import { checkConnection, supabase, getCurrentUser } from './services/supabase';
import { Auth } from './pages/Auth';

// Pages
import { CampaignDashboard } from './pages/CampaignDashboard';
import { CombatTracker } from './pages/CombatTracker';
import { GenericList } from './pages/GenericList';
import { SessionsCalendar } from './pages/SessionsCalendar';
import { SessionDetail } from './pages/SessionDetail';
import { ResetPassword } from './pages/ResetPassword';
import { UiDemo } from './pages/UiDemo';

// Codex Pages
import { MainArc } from './pages/codex/MainArc';
import { MajorPlots } from './pages/codex/MajorPlots';
import { WorldLore } from './pages/codex/WorldLore';
import { MagicTech } from './pages/codex/MagicTech';
import { PoliticsFactions } from './pages/codex/PoliticsFactions';
import { Secrets } from './pages/codex/Secrets';
import { ToneAesthetic } from './pages/codex/ToneAesthetic';
import { WorldTimeline } from './pages/codex/WorldTimeline';
import { HomeRules } from './pages/codex/HomeRules';
import { NotesAndScraps } from './pages/codex/NotesAndScraps';

// Configuration for Generic Pages
const SCHEMAS = {
    character: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'race', label: 'Race', type: 'text' },
        { key: 'class', label: 'Class', type: 'text' },
        { key: 'level', label: 'Level', type: 'number' },
        { key: 'attributes', label: 'Attributes', type: 'stats' },
        { key: 'ac', label: 'Armor Class', type: 'number' },
        { key: 'max_hp', label: 'Max HP', type: 'number' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    npc: [
        // Identity
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'title', label: 'Title / Honorific', type: 'text' },
        { key: 'npc_type', label: 'Type', type: 'select', options: [
            'Citizen', 'Merchant', 'Guard', 'Soldier', 'Noble', 
            'Thief', 'Criminal', 'Politician', 'Cultist', 
            'Mage', 'Cleric', 'Artisan', 'Beast', 'Monster'
        ] },
        { key: 'location_id', label: 'Current Location', type: 'select', options: [] }, // Options populated dynamically in GenericList
        { key: 'status', label: 'Relationship Status', type: 'select', options: ['Ally', 'Neutral', 'Hostile', 'Rival', 'Unknown', 'Deceased'] },
        { key: 'magic_level', label: 'Magic Level', type: 'select', options: ['Zero', 'Latent', 'Basic', 'Intermediate', 'Advanced', 'Arcane Entity'] },
        { key: 'alignment', label: 'Alignment', type: 'select', options: ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE', 'Unaligned'] },
        
        // Importance
        { key: 'importance', label: 'Importance', type: 'select', options: ['Flavor', 'Relevant', 'Key/Critical', 'Antagonist', 'Unknown'] },
        { key: 'role', label: 'Narrative Role', type: 'text' }, // Mentor, Informant
        
        // Stats
        { key: 'attributes', label: 'Attributes', type: 'stats' },
        
        // Description
        { key: 'appearance', label: 'Appearance', type: 'textarea' },
        { key: 'personality_tags', label: 'Personality Tags', type: 'text' },
        { key: 'motivation', label: 'Motivation', type: 'text' },
        { key: 'secret', label: 'Secret', type: 'text' },
        
        // Relationships & Bonds
        { key: 'relationships', label: 'Relationships', type: 'textarea' },
        
        { key: 'notes', label: 'DM Notes', type: 'textarea' },
    ],
    monster: [
        // 1. Identity
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'monster_type', label: 'Type', type: 'select', options: [
            'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 
            'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 
            'Monstrosity', 'Ooze', 'Plant', 'Undead'
        ] },
        { key: 'size', label: 'Size', type: 'select', options: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] },
        { key: 'cr', label: 'Challenge Rating (CR)', type: 'text' },
        { key: 'alignment', label: 'Alignment', type: 'select', options: ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE', 'Unaligned'] },
        { key: 'origin_biome', label: 'Origin / Biome', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['Alive', 'Dead', 'Ally', 'Enemy', 'Captured', 'Fled'] },

        // 2. Basic Stats
        { key: 'ac', label: 'Armor Class (AC)', type: 'number' },
        { key: 'max_hp', label: 'Max HP', type: 'number' },
        { key: 'speed', label: 'Speed', type: 'text' },
        { key: 'attributes', label: 'Attributes', type: 'stats' },
        { key: 'skills', label: 'Skills', type: 'text' },
        { key: 'senses', label: 'Senses', type: 'text' },
        { key: 'languages', label: 'Languages', type: 'text' },
        { key: 'resistances', label: 'Resistances', type: 'textarea' },
        { key: 'immunities', label: 'Immunities', type: 'textarea' },
        { key: 'vulnerabilities', label: 'Vulnerabilities', type: 'textarea' },

        // 3. Combat & 4. Magic
        { key: 'actions', label: 'Combat Actions', type: 'textarea' },
        { key: 'reactions', label: 'Reactions', type: 'textarea' },
        { key: 'legendary_actions', label: 'Legendary Actions', type: 'textarea' },
        { key: 'spells', label: 'Spells / Magic', type: 'textarea' },

        // 5. Behavior
        { key: 'intelligence_level', label: 'Intelligence / Smarts', type: 'select', options: ['Instinctive', 'Animalistic', 'Human-like', 'Genius', 'Omniscient'] },
        { key: 'tactics', label: 'Tactics & Behavior', type: 'textarea' },

        // 6. World Bonds & 7. Narrative
        { key: 'locations_found', label: 'Habitat / Regions', type: 'text' },
        { key: 'narrative_theme', label: 'Theme (Symbolism)', type: 'text' },
        { key: 'horror_scale', label: 'Horror Scale (1-5)', type: 'select', options: ['1', '2', '3', '4', '5'] },
        { key: 'loot', label: 'Loot / Harvest', type: 'textarea' },
        { key: 'consequences', label: 'Consequences (Death/Escape)', type: 'textarea' },

        // 8. Session Notes
        { key: 'notes', label: 'Session Notes', type: 'textarea' },
    ],
    location: [
        // 1. Identity
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: ['City', 'Village', 'District', 'Forest', 'Swamp', 'Ruins', 'Temple', 'Dungeon', 'Plane', 'Other'] },
        { key: 'region', label: 'Region / Biome', type: 'text' },
        { key: 'accent_color', label: 'Card Color', type: 'select', options: ['None', 'Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow'] },
        { key: 'tags', label: 'Custom Tags (comma separated)', type: 'text' },
        { key: 'faction_ids', label: 'Facções (conectar)', type: 'faction-multi-select' }, // New: multi-select factions
        { key: 'faction_influence', label: 'Faction Influence (texto livre)', type: 'text' }, // Legacy field for compatibility
        { key: 'importance', label: 'Importance', type: 'select', options: ['Irrelevant', 'Relevant', 'Important', 'Critical', 'Epic'] },

        // 2. Description Essential
        { key: 'description', label: 'Short Description (Visuals)', type: 'textarea' },
        { key: 'atmosphere', label: 'Atmosphere (Mood/Sensory)', type: 'textarea' },
        { key: 'magic_intensity', label: 'Magic Intensity', type: 'select', options: ['Dead Magic', 'Low', 'Normal', 'Wild', 'High'] },

        // 3. Details
        { key: 'architecture', label: 'Architecture & Style', type: 'text' },
        { key: 'population', label: 'Population & Culture', type: 'textarea' },
        { key: 'government', label: 'Government / Ruler', type: 'text' },
        { key: 'economy', label: 'Economy & Resources', type: 'text' },
        { key: 'magic_tech', label: 'Magic & Tech Level', type: 'text' },
        { key: 'climate', label: 'Recurring Weather / Climate', type: 'text' },

        // 4. Perigos
        { key: 'dangers', label: 'Dangers & Threats', type: 'textarea' },
        { key: 'typical_creatures', label: 'Typical Creatures', type: 'textarea' },

        // 5. Rumores
        { key: 'rumors', label: 'Rumors & Gossip', type: 'textarea' },

        // 6. Segredos
        { key: 'secrets', label: 'DM Secrets', type: 'textarea' },

        // 7. NPCs
        { key: 'npcs_related', label: 'Related NPCs', type: 'textarea' },

        // 8. Locais Internos
        { key: 'sub_locations', label: 'Sub-locations / Districts', type: 'textarea' },
        { key: 'map_description', label: 'Simplified Map / Layout', type: 'textarea' },

        // 9. Eventos
        { key: 'events', label: 'Past & Future Events', type: 'textarea' },

        // 10. Conexões
        { key: 'connections', label: 'Connections & Routes', type: 'textarea' },
        
        { key: 'map_url', label: 'Map URL (Optional)', type: 'text' },
    ],
    faction: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'tag_ids', label: 'Tags (type & status)', type: 'tags-select' }, // New: tag selector
        { key: 'goal', label: 'Goal', type: 'text' },
        { key: 'resources', label: 'Resources', type: 'textarea' },
        { key: 'conflicts', label: 'Conflicts', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    item: [
        // 1. Identity
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'rarity', label: 'Rarity', type: 'select', options: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'] },
        { key: 'type', label: 'Type', type: 'select', options: ['Weapon', 'Armor', 'Wondrous Item', 'Ring', 'Amulet', 'Potion', 'Scroll', 'Wand', 'Staff', 'Rod', 'Tool', 'Other'] },
        { key: 'item_class', label: 'Class/Tier', type: 'select', options: ['Minor Magic', 'Major Magic', 'Campaign Artifact', 'Divine Artifact'] },
        { key: 'status', label: 'Condition/Status', type: 'select', options: ['Intact', 'Corrupted', 'Sealed', 'Incomplete', 'Broken', 'Awakened'] },
        { key: 'accent_color', label: 'Card Color', type: 'select', options: ['None', 'Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow'] },
        { key: 'tags', label: 'Custom Tags (comma separated)', type: 'text' },

        // 2. Appearance
        { key: 'appearance', label: 'Appearance (Visuals, Aura)', type: 'textarea' },
        { key: 'runes', label: 'Associated Runes', type: 'text' },

        // 3. Efeitos
        { key: 'effects_passive', label: 'Passive Effects', type: 'textarea' },
        { key: 'effects_active', label: 'Active Abilities', type: 'textarea' },
        { key: 'conditions', label: 'Conditions / Triggers', type: 'textarea' },
        { key: 'random_effects', label: 'Random Effects Table', type: 'textarea' },

        // 4. Cost
        { key: 'requirements', label: 'Requirements / Attunement', type: 'text' },
        { key: 'class_compatibility', label: 'Class Compatibility', type: 'text' },
        { key: 'side_effects', label: 'Side Effects / Curses', type: 'textarea' },
        { key: 'corruption_growth', label: 'Gradual Corruption / Evolution', type: 'textarea' },

        // 5. Lore
        { key: 'lore', label: 'Lore / History', type: 'textarea' },

        // 6. Evolution
        { key: 'evolution', label: 'Evolution / Upgrades', type: 'textarea' },

        // 7. Owner
        { key: 'owner', label: 'Current Owner (PC/NPC)', type: 'text' },
        
        // 8. Location
        { key: 'found_at_location_id', label: 'Found At (Location)', type: 'select', options: [] }, // Dynamic

        // 9. Connections
        { key: 'connections', label: 'Connections (NPCs/Factions)', type: 'textarea' },

        // 10. Hooks
        { key: 'hooks', label: 'Narrative Hooks & Secrets', type: 'textarea' },
    ],
};

const CampaignSelector: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignTheme, setNewCampaignTheme] = useState('');
  
  // Connection Status
  const [connStatus, setConnStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    verifyConnectionAndLoad();
  }, []);

  const verifyConnectionAndLoad = async () => {
      setConnStatus('checking');
      const conn = await checkConnection();
      if (conn.success) {
          setConnStatus('connected');
          loadCampaigns();
      } else {
          setConnStatus('error');
          setErrorMsg(conn.message || 'Unknown error');
      }
  };

  const loadCampaigns = async () => {
      const data = await db.campaigns.list();
      setCampaigns(data);
  };

  const createCampaign = async () => {
    if (!newCampaignName) return;
    const newCamp: Campaign = {
        id: generateId(),
        name: newCampaignName,
        theme: newCampaignTheme,
        main_arc: '',
        status: 'active',
        notes: ''
    };
    const result = await db.campaigns.add(newCamp);
    if (result.error) {
        console.error('Error creating campaign:', result.error);
        alert(`Failed to create campaign. ${result.error.message || 'Check console for details.'}`);
        return;
    }
    setCampaigns([...campaigns, newCamp]);
    setModalOpen(false);
    setNewCampaignName('');
    setNewCampaignTheme('');
  };

  const requestDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteId(id);
  };

  const confirmDelete = async () => {
      if (deleteId) {
          const result = await db.campaigns.delete(deleteId);
          if (result.error) {
              console.error('Error deleting campaign:', result.error);
              alert(`Failed to delete campaign. ${result.error.message || 'Check console for details.'}`);
              return;
          }
          setCampaigns(campaigns.filter(c => c.id !== deleteId));
          setDeleteId(null);
      }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">DM OS</h1>
                <p className="text-zinc-400">Select a campaign to begin preparation.</p>
                
                {/* Connection Badge */}
                <div className="mt-4 flex items-center gap-2">
                    {connStatus === 'checking' && <span className="text-xs text-zinc-500 animate-pulse">Checking DB connection...</span>}
                    {connStatus === 'connected' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-900/20 border border-green-800 text-green-400 text-xs font-medium">
                            <Wifi className="w-3 h-3" /> Database Connected
                        </span>
                    )}
                    {connStatus === 'error' && (
                        <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-900/20 border border-red-800 text-red-400 text-xs font-medium">
                                <WifiOff className="w-3 h-3" /> Connection Failed
                            </span>
                            <span className="text-xs text-red-400 max-w-md">
                                <AlertTriangle className="w-3 h-3 inline mr-1"/>
                                Error: {errorMsg}. Did you run the SQL Setup script?
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <Button size="lg" onClick={() => setModalOpen(true)} disabled={connStatus === 'error'}><Plus className="w-5 h-5 mr-2" /> New Campaign</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map(c => (
                <div key={c.id} onClick={() => navigate(`/campaign/${c.id}`)} className="group bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-indigo-500 cursor-pointer transition-all relative">
                    <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 mb-1">{c.name}</h2>
                    <p className="text-zinc-500 italic mb-4">{c.theme}</p>
                    <div className="flex gap-2">
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Active</span>
                    </div>
                    <button onClick={(e) => requestDelete(c.id, e)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ))}
            {campaigns.length === 0 && connStatus === 'connected' && (
                <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                    No campaigns found. Create one to get started.
                </div>
            )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Start New Campaign">
            <Input label="Campaign Name" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} placeholder="e.g. The Curse of Strahd" autoFocus />
            <Input label="Theme / Hook" value={newCampaignTheme} onChange={e => setNewCampaignTheme(e.target.value)} placeholder="e.g. Gothic Horror" />
            <div className="flex justify-end pt-4">
                <Button onClick={createCampaign}>Create Campaign</Button>
            </div>
        </Modal>

        <ConfirmModal 
            isOpen={!!deleteId} 
            onClose={() => setDeleteId(null)} 
            onConfirm={confirmDelete} 
            title="Delete Campaign" 
            message="Are you sure you want to delete this campaign? This action cannot be undone and will delete all associated characters, NPCs, items, and notes."
        />
    </div>
  );
};

const CampaignRouteWrapper: React.FC = () => {
    return (
        <Routes>
             <Route path="/" element={<CampaignDashboard />} />
             <Route path="/characters" element={<GenericList entityType="character" title="Characters" fields={SCHEMAS.character as any} />} />
             <Route path="/npcs" element={<GenericList entityType="npc" title="NPCs" fields={SCHEMAS.npc as any} />} />
             <Route path="/monsters" element={<GenericList entityType="monster" title="Monsters" fields={SCHEMAS.monster as any} />} />
             <Route path="/locations" element={<GenericList entityType="location" title="Locations" fields={SCHEMAS.location as any} />} />
             <Route path="/factions" element={<GenericList entityType="faction" title="Factions" fields={SCHEMAS.faction as any} />} />
             <Route path="/items" element={<GenericList entityType="item" title="Magic Items" fields={SCHEMAS.item as any} />} />
             <Route path="/sessions" element={<SessionsCalendar />} />
             <Route path="/sessions/:sessionId" element={<SessionDetail />} />
             <Route path="/combat" element={<CombatTracker />} />
             
             {/* UI Demo */}
             <Route path="/ui-demo" element={<UiDemo />} />
             
             {/* Codex Routes */}
             <Route path="/codex/main-arc" element={<MainArc />} />
             <Route path="/codex/major-plots" element={<MajorPlots />} />
             <Route path="/codex/world-lore" element={<WorldLore />} />
             <Route path="/codex/magic-tech" element={<MagicTech />} />
             <Route path="/codex/politics-factions" element={<PoliticsFactions />} />
             <Route path="/codex/secrets" element={<Secrets />} />
             <Route path="/codex/tone-aesthetic" element={<ToneAesthetic />} />
             <Route path="/codex/world-timeline" element={<WorldTimeline />} />
             <Route path="/codex/home-rules" element={<HomeRules />} />
             <Route path="/codex/notes" element={<NotesAndScraps />} />
        </Routes>
    );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured yet (no env vars, no local storage),
    // we still finish loading to let SupabaseSetup render.
    if(!supabase) {
        setLoading(false);
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-gold font-cinzel gap-4">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            <span className="animate-pulse">Accessing Lumen Regnum Archives...</span>
        </div>
    );
  }

  return (
    <HashRouter>
        <SupabaseSetup />
        
        {/* If supabase is not configured, we show setup. If configured but no session, we show auth. */}
        {!supabase ? (
            /* SupabaseSetup handles the UI if not configured */
            <div className="min-h-screen bg-obsidian" /> 
        ) : !session ? (
            <Routes>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Auth onLoginSuccess={() => {}} />} />
            </Routes>
        ) : (
            <Routes>
                <Route path="/" element={<Layout><CampaignSelector /></Layout>} />
                <Route path="/campaign/:id/*" element={<Layout><CampaignRouteWrapper /></Layout>} />
            </Routes>
        )}
    </HashRouter>
  );
}

export default App;
