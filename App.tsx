
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { db, generateId } from './services/store';
import { Campaign } from './types';
import { Button, Input, Modal, ConfirmModal } from './components/ui';
import { Plus, Trash2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { SupabaseSetup } from './components/SupabaseSetup';
import { checkConnection, supabase } from './services/supabase';
import { Auth } from './pages/Auth';
import { useToast } from './components/Toast';
import { useI18n } from './i18n';

// Pages
import { CampaignDashboard } from './pages/CampaignDashboard';
import { CombatTracker } from './pages/CombatTracker';
import { GenericList } from './pages/GenericList';
import { SessionsCalendar } from './pages/SessionsCalendar';
import { SessionDetail } from './pages/SessionDetail';
import { ResetPassword } from './pages/ResetPassword';
import { PlanPage } from './pages/Plan';
import { deleteMediaForCampaign } from './services/media';
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

// D&D 5e Race and Class Options
export const DND_RACES = [
    'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 
    'Half-Orc', 'Halfling', 'Human', 'Tiefling', 'Other'
];

export const DND_CLASSES = [
    'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 
    'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 
    'Sorcerer', 'Warlock', 'Wizard'
];

// Configuration for Generic Pages
const SCHEMAS = {
    character: [
        { key: 'name', type: 'text' },
        { key: 'race', type: 'select', options: DND_RACES },
        { key: 'race_custom', type: 'text', conditionalOn: { key: 'race', value: 'Other' } },
        { key: 'class', type: 'select', options: DND_CLASSES },
        { key: 'level', type: 'number' },
        { key: 'faction_id', type: 'select', options: [] }, // Options populated dynamically in GenericList
        { key: 'attributes', type: 'stats' },
        { key: 'ac', type: 'number' },
        { key: 'max_hp', type: 'number' },
        { key: 'notes', type: 'textarea' },
    ],
    npc: [
        // Identity
        { key: 'name', type: 'text' },
        { key: 'title', type: 'text' },
        { key: 'race', type: 'select', options: DND_RACES },
        { key: 'race_custom', type: 'text', conditionalOn: { key: 'race', value: 'Other' } },
        { key: 'class', type: 'select', options: DND_CLASSES },
        { key: 'npc_type', type: 'select', options: [
            'Citizen', 'Merchant', 'Guard', 'Soldier', 'Noble', 
            'Thief', 'Criminal', 'Politician', 'Cultist', 
            'Mage', 'Cleric', 'Artisan', 'Beast', 'Monster'
        ] },
        { key: 'location_id', type: 'select', options: [] }, // Options populated dynamically in GenericList
        { key: 'status', type: 'select', options: ['Ally', 'Neutral', 'Hostile', 'Rival', 'Unknown', 'Deceased'] },
        { key: 'magic_level', type: 'select', options: ['Zero', 'Latent', 'Basic', 'Intermediate', 'Advanced', 'Arcane Entity'] },
        { key: 'alignment', type: 'select', options: ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE', 'Unaligned'] },
        
        // Importance
        { key: 'importance', type: 'select', options: ['Flavor', 'Relevant', 'Key/Critical', 'Antagonist', 'Unknown'] },
        { key: 'role', type: 'text' }, // Mentor, Informant
        
        // Stats
        { key: 'attributes', type: 'stats' },
        
        // Description
        { key: 'appearance', type: 'textarea' },
        { key: 'personality_tags', type: 'text' },
        { key: 'motivation', type: 'text' },
        { key: 'secret', type: 'text' },
        
        // Relationships & Bonds
        { key: 'relationships', type: 'textarea' },
        
        { key: 'notes', type: 'textarea' },
    ],
    monster: [
        // 1. Identity
        { key: 'name', type: 'text' },
        { key: 'monster_type', type: 'select', options: [
            'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 
            'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 
            'Monstrosity', 'Ooze', 'Plant', 'Undead'
        ] },
        { key: 'size', type: 'select', options: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] },
        { key: 'cr', type: 'text' },
        { key: 'alignment', type: 'select', options: ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE', 'Unaligned'] },
        { key: 'origin_biome', type: 'text' },
        { key: 'status', type: 'select', options: ['Alive', 'Dead', 'Ally', 'Enemy', 'Captured', 'Fled'] },

        // 2. Basic Stats
        { key: 'ac', type: 'number' },
        { key: 'max_hp', type: 'number' },
        { key: 'speed', type: 'text' },
        { key: 'attributes', type: 'stats' },
        { key: 'skills', type: 'text' },
        { key: 'senses', type: 'text' },
        { key: 'languages', type: 'text' },
        { key: 'resistances', type: 'textarea' },
        { key: 'immunities', type: 'textarea' },
        { key: 'vulnerabilities', type: 'textarea' },

        // 3. Combat & 4. Magic
        { key: 'actions', type: 'textarea' },
        { key: 'reactions', type: 'textarea' },
        { key: 'legendary_actions', type: 'textarea' },
        { key: 'spells', type: 'textarea' },

        // 5. Behavior
        { key: 'intelligence_level', type: 'select', options: ['Instinctive', 'Animalistic', 'Human-like', 'Genius', 'Omniscient'] },
        { key: 'tactics', type: 'textarea' },

        // 6. World Bonds & 7. Narrative
        { key: 'locations_found', type: 'text' },
        { key: 'narrative_theme', type: 'text' },
        { key: 'horror_scale', type: 'select', options: ['1', '2', '3', '4', '5'] },
        { key: 'loot', type: 'textarea' },
        { key: 'consequences', type: 'textarea' },

        // 8. Session Notes
        { key: 'notes', type: 'textarea' },
    ],
    location: [
        // 1. Identity
        { key: 'name', type: 'text' },
        { key: 'type', type: 'select', options: ['City', 'Village', 'District', 'Forest', 'Swamp', 'Ruins', 'Temple', 'Dungeon', 'Plane', 'Other'] },
        { key: 'region', type: 'text' },
        { key: 'accent_color', type: 'select', options: ['None', 'Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow'] },
        { key: 'tags', type: 'text' },
        { key: 'faction_ids', type: 'faction-multi-select' }, // New: multi-select factions
        { key: 'faction_influence', type: 'text' }, // Legacy field for compatibility
        { key: 'importance', type: 'select', options: ['Irrelevant', 'Relevant', 'Important', 'Critical', 'Epic'] },

        // 2. Description Essential
        { key: 'description', type: 'textarea' },
        { key: 'atmosphere', type: 'textarea' },
        { key: 'magic_intensity', type: 'select', options: ['Dead Magic', 'Low', 'Normal', 'Wild', 'High'] },

        // 3. Details
        { key: 'architecture', type: 'text' },
        { key: 'population', type: 'textarea' },
        { key: 'government', type: 'text' },
        { key: 'economy', type: 'text' },
        { key: 'magic_tech', type: 'text' },
        { key: 'climate', type: 'text' },

        // 4. Perigos
        { key: 'dangers', type: 'textarea' },
        { key: 'typical_creatures', type: 'textarea' },

        // 5. Rumores
        { key: 'rumors', type: 'textarea' },

        // 6. Segredos
        { key: 'secrets', type: 'textarea' },

        // 7. NPCs
        { key: 'npcs_related', type: 'textarea' },

        // 8. Locais Internos
        { key: 'sub_locations', type: 'textarea' },
        { key: 'map_description', type: 'textarea' },

        // 9. Eventos
        { key: 'events', type: 'textarea' },

        // 10. Conexões
        { key: 'connections', type: 'textarea' },
        
        { key: 'map_url', type: 'text' },
    ],
    faction: [
        { key: 'name', type: 'text' },
        { key: 'tag_ids', type: 'tags-select' }, // New: tag selector
        { key: 'member_ids', type: 'member-multi-select' }, // New: member selector
        { key: 'goal', type: 'text' },
        { key: 'resources', type: 'textarea' },
        { key: 'conflicts', type: 'textarea' },
        { key: 'notes', type: 'textarea' },
    ],
    item: [
        // 1. Identity
        { key: 'name', type: 'text' },
        { key: 'rarity', type: 'select', options: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'] },
        { key: 'type', type: 'select', options: ['Weapon', 'Armor', 'Wondrous Item', 'Ring', 'Amulet', 'Potion', 'Scroll', 'Wand', 'Staff', 'Rod', 'Tool', 'Other'] },
        { key: 'item_class', type: 'select', options: ['Minor Magic', 'Major Magic', 'Campaign Artifact', 'Divine Artifact'] },
        { key: 'status', type: 'select', options: ['Intact', 'Corrupted', 'Sealed', 'Incomplete', 'Broken', 'Awakened'] },
        { key: 'accent_color', type: 'select', options: ['None', 'Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow'] },
        { key: 'tags', type: 'text' },

        // 2. Appearance
        { key: 'appearance', type: 'textarea' },
        { key: 'runes', type: 'text' },

        // 3. Efeitos
        { key: 'effects_passive', type: 'textarea' },
        { key: 'effects_active', type: 'textarea' },
        { key: 'conditions', type: 'textarea' },
        { key: 'random_effects', type: 'textarea' },

        // 4. Cost
        { key: 'requirements', type: 'text' },
        { key: 'class_compatibility', type: 'text' },
        { key: 'side_effects', type: 'textarea' },
        { key: 'corruption_growth', type: 'textarea' },

        // 5. Lore
        { key: 'lore', type: 'textarea' },

        // 6. Evolution
        { key: 'evolution', type: 'textarea' },

        // 7. Owner
        { key: 'owner', type: 'text' },
        
        // 8. Location
        { key: 'found_at_location_id', type: 'select', options: [] }, // Dynamic

        // 9. Connections
        { key: 'connections', type: 'textarea' },

        // 10. Hooks
        { key: 'hooks', type: 'textarea' },
    ],
};

const CampaignSelector: React.FC = () => {
  const { t, opt } = useI18n();
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
  const { showToast } = useToast();

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
          setErrorMsg(conn.message || t('common.unknownError'));
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
        showToast(t('campaigns.createError', { detail: result.error.message || t('common.checkConsole') }), 'error');
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
          await deleteMediaForCampaign(deleteId).catch((e) => console.error('Error removing images', e));
          const result = await db.campaigns.delete(deleteId);
          if (result.error) {
              console.error('Error deleting campaign:', result.error);
              showToast(t('campaigns.deleteError', { detail: result.error.message || t('common.checkConsole') }), 'error');
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
                <h1 className="text-4xl font-bold text-white mb-2">{t('app.shortName')}</h1>
                <p className="text-zinc-400">{t('campaigns.subtitle')}</p>
                
                {/* Connection Badge */}
                <div className="mt-4 flex items-center gap-2">
                    {connStatus === 'checking' && <span className="text-xs text-zinc-500 animate-pulse">{t('campaigns.checking')}</span>}
                    {connStatus === 'connected' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-900/20 border border-green-800 text-green-400 text-xs font-medium">
                            <Wifi className="w-3 h-3" /> {t('campaigns.connected')}
                        </span>
                    )}
                    {connStatus === 'error' && (
                        <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-900/20 border border-red-800 text-red-400 text-xs font-medium">
                                <WifiOff className="w-3 h-3" /> {t('campaigns.connectionFailed')}
                            </span>
                            <span className="text-xs text-red-400 max-w-md">
                                <AlertTriangle className="w-3 h-3 inline mr-1"/>
                                {t('campaigns.connectionHint', { error: errorMsg })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <Button size="lg" onClick={() => setModalOpen(true)} disabled={connStatus === 'error'}><Plus className="w-5 h-5 mr-2" /> {t('campaigns.new')}</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map(c => (
                <div key={c.id} onClick={() => navigate(`/campaign/${c.id}`)} className="group bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-indigo-500 cursor-pointer transition-all relative">
                    <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 mb-1">{c.name}</h2>
                    <p className="text-zinc-500 italic mb-4">{c.theme}</p>
                    <div className="flex gap-2">
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">{opt('campaign_status', c.status)}</span>
                    </div>
                    <button onClick={(e) => requestDelete(c.id, e)} aria-label={t('campaigns.deleteAria', { name: c.name })} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ))}
            {campaigns.length === 0 && connStatus === 'connected' && (
                <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                    {t('campaigns.empty')}
                </div>
            )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={t('campaigns.modalTitle')}>
            <Input label={t('campaigns.name')} value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} placeholder={t('campaigns.namePlaceholder')} autoFocus />
            <Input label={t('campaigns.theme')} value={newCampaignTheme} onChange={e => setNewCampaignTheme(e.target.value)} placeholder={t('campaigns.themePlaceholder')} />
            <div className="flex justify-end pt-4">
                <Button onClick={createCampaign}>{t('campaigns.create')}</Button>
            </div>
        </Modal>

        <ConfirmModal 
            isOpen={!!deleteId} 
            onClose={() => setDeleteId(null)} 
            onConfirm={confirmDelete} 
            title={t('campaigns.deleteTitle')}
            message={t('campaigns.deleteMessage')}
        />
    </div>
  );
};

const CampaignRouteWrapper: React.FC = () => {
    return (
        <Routes>
             <Route path="/" element={<CampaignDashboard />} />
             <Route path="/characters" element={<GenericList entityType="character" fields={SCHEMAS.character as any} />} />
             <Route path="/npcs" element={<GenericList entityType="npc" fields={SCHEMAS.npc as any} />} />
             <Route path="/monsters" element={<GenericList entityType="monster" fields={SCHEMAS.monster as any} />} />
             <Route path="/locations" element={<GenericList entityType="location" fields={SCHEMAS.location as any} />} />
             <Route path="/factions" element={<GenericList entityType="faction" fields={SCHEMAS.faction as any} />} />
             <Route path="/items" element={<GenericList entityType="item" fields={SCHEMAS.item as any} />} />
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
  const { t, locale, setLocale } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Idioma da conta: se já houver um salvo, ele vale em qualquer dispositivo; senão, grava o atual.
  const accountLocale = session?.user?.user_metadata?.locale as string | undefined;
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId || !supabase) return;
    if (accountLocale === 'pt-BR' || accountLocale === 'en') {
      if (accountLocale !== locale) setLocale(accountLocale, { remote: false });
    } else {
      supabase.auth.updateUser({ data: { locale } }).catch(() => { /* ignora */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, accountLocale]);

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
            <span className="animate-pulse">{t('app.loading')}</span>
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
                <Route path="/plan" element={<Layout><PlanPage /></Layout>} />
                <Route path="/campaign/:id/*" element={<Layout><CampaignRouteWrapper /></Layout>} />
            </Routes>
        )}
    </HashRouter>
  );
}

export default App;
