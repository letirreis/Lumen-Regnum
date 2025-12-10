
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, generateId } from '../services/store';
import { Card, Button, Input, Textarea, Modal, ConfirmModal } from '../components/ui';
import { Plus, Search, Trash2, Edit, Filter, MapPin, Sparkles, AlertCircle, Cloud, Skull, Scroll, Zap, ShieldAlert } from 'lucide-react';
import { Location, Faction, Tag } from '../types';
import { MultiFactionSelect } from '../components/MultiFactionSelect';
import { TagSelector } from '../components/TagSelector';

interface SchemaField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'stats' | 'faction-multi-select' | 'tags-select';
  options?: string[]; // For select
}

interface GenericListProps {
  entityType: 'npc' | 'location' | 'faction' | 'item' | 'character' | 'session' | 'monster';
  title: string;
  fields: SchemaField[];
}

export const GenericList: React.FC<GenericListProps> = ({ entityType, title, fields }) => {
  const { id: campaignId } = useParams<{ id: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]); // For dynamic lookups
  const [availableFactions, setAvailableFactions] = useState<Faction[]>([]); // For faction multi-select
  const [availableTags, setAvailableTags] = useState<Tag[]>([]); // For tag selector
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  // Monster Filters
  const [filterMonsterType, setFilterMonsterType] = useState('');
  const [filterSize, setFilterSize] = useState('');
  // Location Filters
  const [filterLocType, setFilterLocType] = useState('');
  const [filterImportance, setFilterImportance] = useState('');
  // Item Filters
  const [filterItemRarity, setFilterItemRarity] = useState('');
  const [filterItemType, setFilterItemType] = useState('');
  
  // Edit/Create State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // If null, we are creating
  const [isSaving, setIsSaving] = useState(false); // Prevents double submit

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadItems();
    }
  }, [campaignId, entityType]);

  const loadItems = async () => {
    if(!campaignId) return;
    let data: any[] = [];
    switch(entityType) {
        case 'npc': data = await db.npcs.list(campaignId); break;
        case 'monster': data = await db.monsters.list(campaignId); break;
        case 'location': data = await db.locations.list(campaignId); break;
        case 'faction': data = await db.factions.list(campaignId); break;
        case 'item': data = await db.items.list(campaignId); break;
        case 'character': data = await db.characters.list(campaignId); break;
        case 'session': data = await db.sessions.list(campaignId); break;
    }
    setItems(data);

    // Load locations for NPCs and Items (Found At) if needed
    if (entityType === 'npc' || entityType === 'item') {
        const locs = await db.locations.list(campaignId);
        setLocations(locs);
    }
  };

  // Load available factions and tags when modal opens (for location and faction forms)
  const loadFormDependencies = async () => {
    if (!campaignId) return;
    
    // Load factions for location form
    if (entityType === 'location') {
      const factions = await db.factions.list(campaignId);
      setAvailableFactions(factions);
    }
    
    // Load tags for faction form
    if (entityType === 'faction') {
      const tags = await db.tags.list(campaignId);
      setAvailableTags(tags);
    }
  };

  const handleSave = async () => {
    if (!campaignId) return;
    setIsSaving(true);
    
    try {
        // Extract client-only fields (tag_ids, faction_ids) before constructing payload
        const { tag_ids, faction_ids, ...basePayload } = editingItem;
        const tagIds = tag_ids || [];
        const factionIds = faction_ids || [];
        
        // Construct payload without client-only fields
        const payload = {
            ...basePayload,
            campaign_id: campaignId,
        };

        // Sanitize Payload: Convert empty strings in ID fields to null to avoid UUID errors
        Object.keys(payload).forEach(key => {
            if ((key.endsWith('_id') || key === 'found_at_location_id') && payload[key] === "") {
                payload[key] = null;
            }
        });

        // Initialize complex objects if new or missing
        if (entityType === 'character' || entityType === 'npc' || entityType === 'monster') {
             if(!payload.attributes) payload.attributes = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
        }
        if (entityType === 'character') {
             if(!payload.passives) payload.passives = { perception:10, insight:10, investigation:10 };
        }

        // For compatibility: set faction_influence to empty string if faction_ids is used
        if (entityType === 'location' && factionIds.length > 0) {
            if (!payload.faction_influence) {
                payload.faction_influence = '';
            }
        }

        // If ID exists, update. Else add.
        const isUpdate = !!editingItem.id;
        if (!isUpdate) {
            payload.id = generateId();
        }

        // Save main entity and handle new { data, error } return format
        let result: { data: any; error: any } = { data: null, error: null };
        if (isUpdate) {
            switch(entityType) {
                case 'npc': result = await db.npcs.update(payload); break;
                case 'monster': result = await db.monsters.update(payload); break;
                case 'location': result = await db.locations.update(payload); break;
                case 'faction': result = await db.factions.update(payload); break;
                case 'item': result = await db.items.update(payload); break;
                case 'character': result = await db.characters.update(payload); break;
                case 'session': result = await db.sessions.update(payload); break;
            }
        } else {
            switch(entityType) {
                case 'npc': result = await db.npcs.add(payload); break;
                case 'monster': result = await db.monsters.add(payload); break;
                case 'location': result = await db.locations.add(payload); break;
                case 'faction': result = await db.factions.add(payload); break;
                case 'item': result = await db.items.add(payload); break;
                case 'character': result = await db.characters.add(payload); break;
                case 'session': result = await db.sessions.add(payload); break;
            }
        }

        // Check for errors in main entity save
        if (result.error) {
            console.error("Error saving entity:", result.error);
            alert(`Failed to save ${entityType}. ${result.error.message || 'Check console for details.'}`);
            return;
        }

        // Sync faction_tags pivot table if entity is faction and has tag_ids
        if (entityType === 'faction' && Array.isArray(tagIds)) {
            const syncResult = await db.faction_tags.setForFaction(payload.id, tagIds);
            if (syncResult.error) {
                console.error("Error syncing faction tags:", syncResult.error);
                alert(`${entityType} saved, but failed to sync tags. ${syncResult.error.message || 'Check console for details.'}`);
            }
        }

        setModalOpen(false);
        loadItems();
    } catch (error) {
        console.error("Failed to save item:", error);
        alert("Failed to save. Check console for details.");
    } finally {
        setIsSaving(false);
    }
  };

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if(!deleteId) return;
    setIsSaving(true);
    try {
        let result: { data: any; error: any } = { data: null, error: null };
        switch(entityType) {
            case 'npc': result = await db.npcs.delete(deleteId); break;
            case 'monster': result = await db.monsters.delete(deleteId); break;
            case 'location': result = await db.locations.delete(deleteId); break;
            case 'faction': result = await db.factions.delete(deleteId); break;
            case 'item': result = await db.items.delete(deleteId); break;
            case 'character': result = await db.characters.delete(deleteId); break;
            case 'session': result = await db.sessions.delete(deleteId); break;
        }
        
        if (result.error) {
            console.error("Error deleting entity:", result.error);
            alert(`Failed to delete ${entityType}. ${result.error.message || 'Check console for details.'}`);
            return;
        }
        
        setDeleteId(null);
        loadItems();
    } catch (error) {
        console.error("Failed to delete item:", error);
        alert("Failed to delete. Check console for details.");
    } finally {
        setIsSaving(false);
    }
  };

  const openNew = async () => {
      await loadFormDependencies();
      setEditingItem({});
      setModalOpen(true);
  };

  const openEdit = async (item: any) => {
      await loadFormDependencies();
      setEditingItem({...item});
      setModalOpen(true);
  };

  // Helper to find location name by ID
  const getLocationName = (id: string) => {
      return locations.find(l => l.id === id)?.name || 'Unknown Location';
  };

  // Helper for Rarity Colors
  const getRarityColor = (rarity: string) => {
      switch(rarity) {
          case 'Common': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
          case 'Uncommon': return 'bg-green-900/30 text-green-400 border-green-800';
          case 'Rare': return 'bg-blue-900/30 text-blue-400 border-blue-800';
          case 'Very Rare': return 'bg-purple-900/30 text-purple-400 border-purple-800';
          case 'Legendary': return 'bg-orange-900/30 text-orange-400 border-orange-800';
          case 'Artifact': return 'bg-red-900/30 text-red-400 border-red-800';
          default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      }
  };

  // Helper for Accent Colors
  const getBorderColor = (color?: string) => {
      if (!color || color === 'None') return 'hover:border-indigo-500';
      switch(color) {
          case 'Red': return 'border-red-900 hover:border-red-600 bg-red-950/10';
          case 'Blue': return 'border-blue-900 hover:border-blue-600 bg-blue-950/10';
          case 'Green': return 'border-green-900 hover:border-green-600 bg-green-950/10';
          case 'Purple': return 'border-purple-900 hover:border-purple-600 bg-purple-950/10';
          case 'Orange': return 'border-orange-900 hover:border-orange-600 bg-orange-950/10';
          case 'Yellow': return 'border-yellow-900 hover:border-yellow-600 bg-yellow-950/10';
          default: return 'hover:border-indigo-500';
      }
  };

   // Helper for Tag Badges
   const renderTags = (tagsStr: string | undefined) => {
       if (!tagsStr) return null;
       const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t !== '');
       if (tags.length === 0) return null;
       return (
           <div className="flex flex-wrap gap-1 mt-1">
               {tags.map((tag, idx) => (
                   <span key={idx} className="text-[9px] uppercase font-bold bg-zinc-700/50 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded">
                       {tag}
                   </span>
               ))}
           </div>
       );
   };

  // Filtering Logic
  const filteredItems = items.filter(i => {
    // 1. Text Search
    const matchesSearch = 
        i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.date?.includes(searchTerm) ||
        i.npc_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.monster_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Type Filter (NPC only)
    const matchesType = filterType ? i.npc_type === filterType : true;

    // 3. Location Filter (NPC only)
    const matchesLocation = filterLocation ? i.location_id === filterLocation : true;

    // 4. Monster Filters
    const matchesMonsterType = filterMonsterType ? i.monster_type === filterMonsterType : true;
    const matchesSize = filterSize ? i.size === filterSize : true;

    // 5. Location Filters
    const matchesLocType = filterLocType ? i.type === filterLocType : true;
    const matchesImportance = filterImportance ? i.importance === filterImportance : true;

    // 6. Item Filters
    const matchesItemRarity = filterItemRarity ? i.rarity === filterItemRarity : true;
    const matchesItemType = filterItemType ? i.type === filterItemType : true;

    return matchesSearch && matchesType && matchesLocation && matchesMonsterType && matchesSize && matchesLocType && matchesImportance && matchesItemRarity && matchesItemType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
          {/* Header & Main Actions */}
          <div className="flex justify-between items-center">
             <h2 className="text-3xl font-bold text-white">{title}</h2>
             <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New</Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
             <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search name, role, tags..."
                    className="pl-9 flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* NPC Specific Filters */}
            {entityType === 'npc' && (
                <>
                    <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {fields.find(f => f.key === 'npc_type')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                        >
                            <option value="">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Monster Specific Filters */}
            {entityType === 'monster' && (
                <>
                    <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterMonsterType}
                            onChange={(e) => setFilterMonsterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {fields.find(f => f.key === 'monster_type')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-32">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterSize}
                            onChange={(e) => setFilterSize(e.target.value)}
                        >
                            <option value="">All Sizes</option>
                            {fields.find(f => f.key === 'size')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Location Specific Filters */}
            {entityType === 'location' && (
                <>
                     <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterLocType}
                            onChange={(e) => setFilterLocType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {fields.find(f => f.key === 'type')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                     <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterImportance}
                            onChange={(e) => setFilterImportance(e.target.value)}
                        >
                            <option value="">All Importance</option>
                            {fields.find(f => f.key === 'importance')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Item Specific Filters */}
            {entityType === 'item' && (
                <>
                     <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterItemRarity}
                            onChange={(e) => setFilterItemRarity(e.target.value)}
                        >
                            <option value="">All Rarities</option>
                            {fields.find(f => f.key === 'rarity')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                     <div className="w-full md:w-48">
                         <select
                            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            value={filterItemType}
                            onChange={(e) => setFilterItemType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {fields.find(f => f.key === 'type')?.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}
             
            {/* Clear Button */}
            {(filterType || filterLocation || filterMonsterType || filterSize || filterLocType || filterImportance || filterItemRarity || filterItemType) && (
                <Button variant="ghost" onClick={() => { 
                    setFilterType(''); 
                    setFilterLocation(''); 
                    setFilterMonsterType('');
                    setFilterSize('');
                    setFilterLocType('');
                    setFilterImportance('');
                    setFilterItemRarity('');
                    setFilterItemType('');
                }}>
                    Clear
                </Button>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map(item => (
            <Card 
                key={item.id} 
                className={`group relative transition-all ${getBorderColor(item.accent_color)}`}
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => openEdit(item)} className="p-1 bg-zinc-800 rounded hover:bg-indigo-600 text-zinc-300 hover:text-white"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => requestDelete(item.id)} className="p-1 bg-zinc-800 rounded hover:bg-red-900 text-zinc-300 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex justify-between items-start pr-16">
                     <div>
                        <h3 className="text-lg font-bold text-zinc-100 leading-tight">{item.name || item.date}</h3>
                        {item.title && <div className="text-xs text-zinc-400 italic">{item.title}</div>}
                        {entityType === 'monster' && <div className="text-xs text-zinc-400 italic">{item.size} {item.monster_type} {item.cr && `(CR ${item.cr})`}</div>}
                     </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2 mb-2">
                    {/* Tags */}
                    {renderTags(item.tags)}

                    {/* Generic Type Tags */}
                    {item.type && entityType !== 'location' && entityType !== 'item' && <span className="text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{item.type}</span>}
                    {item.npc_type && <span className="text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{item.npc_type}</span>}
                    
                    {/* Location Specific Tags */}
                    {entityType === 'location' && (
                        <>
                             {item.type && <span className="text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{item.type}</span>}
                             {item.region && <span className="text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> {item.region}</span>}
                             {item.importance && <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                 item.importance === 'Critical' || item.importance === 'Epic' ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-700' : 'bg-zinc-800 text-zinc-400'
                             }`}>{item.importance}</span>}
                             {item.magic_intensity && (
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                    item.magic_intensity === 'High' || item.magic_intensity === 'Wild' ? 'bg-pink-900/30 text-pink-300 border border-pink-800' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                   <Sparkles className="w-3 h-3"/> {item.magic_intensity}
                                </span>
                             )}
                        </>
                    )}

                    {/* Item Specific Tags */}
                    {entityType === 'item' && (
                        <>
                             {item.rarity && <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getRarityColor(item.rarity)}`}>{item.rarity}</span>}
                             {item.type && <span className="text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{item.type}</span>}
                             {item.item_class && <span className="text-[10px] uppercase font-bold bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{item.item_class}</span>}
                             {item.corruption_growth && <span className="text-[10px] uppercase font-bold bg-zinc-900 text-purple-400 border border-purple-900/50 px-1.5 py-0.5 rounded flex items-center gap-1"><Skull className="w-3 h-3"/> Corrupting</span>}
                        </>
                    )}

                    {/* Location Tag for NPC / Item */}
                    {(entityType === 'npc' || entityType === 'item') && item.found_at_location_id && (
                        <span className="text-[10px] uppercase font-bold bg-indigo-900/30 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <MapPin className="w-3 h-3"/> {getLocationName(item.found_at_location_id)}
                        </span>
                    )}
                     {(entityType === 'npc') && item.location_id && (
                        <span className="text-[10px] uppercase font-bold bg-indigo-900/30 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <MapPin className="w-3 h-3"/> {getLocationName(item.location_id)}
                        </span>
                    )}

                    {/* Status Tags (Works for NPC and Monster) */}
                    {item.status && <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'Hostile' || item.status === 'Enemy' || item.status === 'Corrupted' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                        item.status === 'Ally' || item.status === 'Intact' || item.status === 'Awakened' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                        item.status === 'Dead' || item.status === 'Broken' ? 'bg-zinc-950 text-zinc-600 border border-zinc-800 line-through' :
                        'bg-zinc-800 text-zinc-400'
                    }`}>{item.status}</span>}
                    
                    {/* Monster Horror Scale */}
                    {item.horror_scale && <span className="text-[10px] uppercase font-bold bg-purple-900/30 text-purple-400 border border-purple-900 px-1.5 py-0.5 rounded">Horror {item.horror_scale}</span>}
                    
                    {entityType !== 'location' && entityType !== 'item' && item.importance && item.importance !== 'Unknown' && <span className="text-[10px] uppercase font-bold bg-indigo-900/30 text-indigo-300 border border-indigo-900 px-1.5 py-0.5 rounded">{item.importance}</span>}
                </div>

                {item.race && item.class && <span className="text-xs text-indigo-400 mb-2 block">Lvl {item.level} {item.race} {item.class}</span>}
                
                {/* Location Specific Content Display */}
                {entityType === 'location' ? (
                     <div className="text-sm text-zinc-400 space-y-2 mt-2">
                        {item.atmosphere && <p className="italic text-indigo-200/80 text-xs">"{item.atmosphere}"</p>}
                        <p className="line-clamp-3">{item.description}</p>
                        
                        <div className="flex flex-col gap-1 mt-2">
                            {item.dangers && (
                                <div className="flex gap-1 items-start">
                                    <span className="text-[10px] font-bold text-red-400 bg-red-950/30 px-1 rounded uppercase">Dangers</span>
                                    <span className="text-xs line-clamp-1">{item.dangers}</span>
                                </div>
                            )}
                             {item.typical_creatures && (
                                <div className="flex gap-1 items-start">
                                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded uppercase">Creatures</span>
                                    <span className="text-xs line-clamp-1">{item.typical_creatures}</span>
                                </div>
                            )}
                            {item.climate && (
                                <div className="flex gap-1 items-start">
                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/30 px-1 rounded uppercase flex items-center gap-0.5"><Cloud className="w-2 h-2"/> Climate</span>
                                    <span className="text-xs line-clamp-1">{item.climate}</span>
                                </div>
                            )}
                             {item.rumors && (
                                <div className="flex gap-1 items-start">
                                    <span className="text-[10px] font-bold text-yellow-500/80 bg-yellow-900/20 px-1 rounded uppercase">Rumors</span>
                                    <span className="text-xs line-clamp-1">{item.rumors}</span>
                                </div>
                            )}
                             {item.map_description && (
                                <div className="flex gap-1 items-start">
                                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded uppercase">Layout</span>
                                    <span className="text-xs line-clamp-1 italic">{item.map_description}</span>
                                </div>
                            )}
                        </div>
                     </div>
                ) : entityType === 'item' ? (
                    <div className="text-sm text-zinc-400 space-y-2 mt-2">
                         {item.effects_passive && (
                            <div className="flex gap-1 items-start">
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded uppercase border border-zinc-800">Passive</span>
                                <span className="text-xs line-clamp-2">{item.effects_passive}</span>
                            </div>
                        )}
                        {item.effects_active && (
                            <div className="flex gap-1 items-start">
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-900/20 px-1 rounded uppercase border border-indigo-900/30">Active</span>
                                <span className="text-xs line-clamp-2">{item.effects_active}</span>
                            </div>
                        )}
                        {item.runes && (
                            <div className="flex gap-1 items-start">
                                <span className="text-[10px] font-bold text-purple-400 bg-purple-900/20 px-1 rounded uppercase border border-purple-900/30 flex items-center gap-0.5"><Scroll className="w-2 h-2"/> Runes</span>
                                <span className="text-xs line-clamp-1 font-mono text-purple-300">{item.runes}</span>
                            </div>
                        )}
                         {item.random_effects && (
                            <div className="flex gap-1 items-start">
                                <span className="text-[10px] font-bold text-yellow-500/80 bg-yellow-900/20 px-1 rounded uppercase flex items-center gap-0.5"><Zap className="w-2 h-2"/> Random</span>
                                <span className="text-xs line-clamp-1 italic">{item.random_effects}</span>
                            </div>
                        )}
                        <div className="mt-2 space-y-1">
                            {item.class_compatibility && (
                                <div className="text-xs text-zinc-500 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3"/> Only: {item.class_compatibility}
                                </div>
                            )}
                            {item.requirements && (
                                <div className="text-xs text-zinc-500 italic flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3"/> {item.requirements}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-400 line-clamp-3">
                        {item.description || item.summary || item.notes || item.role || item.effect || item.narrative_theme || "No details provided."}
                    </p>
                )}
                
                {/* Stats Preview */}
                {item.attributes && (
                    <div className="mt-3 grid grid-cols-6 gap-1 text-center">
                        {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => (
                            <div key={k} className="bg-zinc-950/50 rounded p-1 border border-zinc-800">
                                <div className="text-[9px] uppercase text-zinc-500 mb-0.5">{k}</div>
                                <div className="text-xs font-bold text-zinc-300">{item.attributes[k]}</div>
                            </div>
                        ))}
                    </div>
                )}
                
                {(entityType === 'character' || entityType === 'monster') && !item.attributes && (
                    <div className="mt-3 flex gap-2 text-xs font-mono text-zinc-500">
                        <span title="Armor Class">AC:{item.ac}</span>
                        <span title="Hit Points">HP:{item.max_hp}</span>
                    </div>
                )}
            </Card>
        ))}
        {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-lg">
                No items found. Create one to get started.
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSaving && setModalOpen(false)} title={editingItem?.id ? `Edit ${title}` : `New ${title}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {fields.map(field => {
                // Handle faction-multi-select field type
                if (field.type === 'faction-multi-select') {
                    return (
                        <div key={field.key} className="mb-2">
                            <label className="block text-xs font-medium text-zinc-400 mb-1">{field.label}</label>
                            <MultiFactionSelect
                                factions={availableFactions}
                                selectedIds={editingItem?.[field.key] || []}
                                onChange={(ids) => setEditingItem({ ...editingItem, [field.key]: ids })}
                            />
                        </div>
                    );
                }

                // Handle tags-select field type
                if (field.type === 'tags-select') {
                    return (
                        <div key={field.key} className="mb-2">
                            <label className="block text-xs font-medium text-zinc-400 mb-1">{field.label}</label>
                            <TagSelector
                                campaignId={campaignId!}
                                tags={availableTags}
                                selectedIds={editingItem?.[field.key] || []}
                                onChange={(ids) => setEditingItem({ ...editingItem, [field.key]: ids })}
                                onTagsReload={async () => {
                                    // Reload tags after creating a new one
                                    if (campaignId) {
                                        const tags = await db.tags.list(campaignId);
                                        setAvailableTags(tags);
                                    }
                                }}
                            />
                        </div>
                    );
                }

                if (field.type === 'stats') {
                    const stats = editingItem?.[field.key] || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
                    return (
                         <div key={field.key} className="mb-2">
                            <label className="block text-xs font-medium text-zinc-400 mb-2">{field.label}</label>
                            <div className="grid grid-cols-6 gap-2">
                                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                                    <div key={stat} className="flex flex-col items-center">
                                        <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1">{stat}</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-950 px-1 text-center text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                            value={stats[stat]}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newStats = { ...stats, [stat]: val === '' ? '' : parseInt(val) };
                                                setEditingItem({ ...editingItem, [field.key]: newStats });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                         </div>
                    );
                } else if (field.type === 'select') {
                    // Logic to handle dynamic location dropdown
                    const isLocationField = field.key === 'location_id' || field.key === 'found_at_location_id';
                    const options = isLocationField 
                        ? locations.map(l => ({ value: l.id, label: l.name })) 
                        : field.options?.map(o => ({ value: o, label: o }));

                    return (
                        <div key={field.key} className="mb-2">
                            <label className="block text-xs font-medium text-zinc-400 mb-1">{field.label}</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                value={editingItem?.[field.key] || ''}
                                onChange={(e) => setEditingItem({...editingItem, [field.key]: e.target.value})}
                            >
                                <option value="">Select...</option>
                                {options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    );
                }
                
                return (
                <div key={field.key}>
                    {field.type === 'textarea' ? (
                        <Textarea 
                            label={field.label}
                            value={editingItem?.[field.key] || ''}
                            onChange={(e) => setEditingItem({...editingItem, [field.key]: e.target.value})}
                        />
                    ) : field.type === 'number' ? (
                         <Input
                            type="number" 
                            label={field.label}
                            value={editingItem?.[field.key] ?? ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setEditingItem({...editingItem, [field.key]: Number(e.target.value)})}
                        />
                    ) : (
                        <Input 
                            label={field.label}
                            value={editingItem?.[field.key] || ''}
                            onChange={(e) => setEditingItem({...editingItem, [field.key]: e.target.value})}
                        />
                    )}
                </div>
            )})}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : `Save ${title}`}
                </Button>
            </div>
        </div>
      </Modal>

      <ConfirmModal 
            isOpen={!!deleteId} 
            onClose={() => !isSaving && setDeleteId(null)} 
            onConfirm={confirmDelete} 
            title={`Delete ${title.slice(0, -1)}`} 
            message={isSaving ? "Deleting..." : "Are you sure you want to delete this item? This action cannot be undone."}
      />
    </div>
  );
};
