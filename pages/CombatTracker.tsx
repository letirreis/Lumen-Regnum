
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/store';
import { Encounter, Combatant, Character } from '../types';
import { Card, Button, Input, Badge, Modal, ConfirmModal } from '../components/ui';
import { Swords, Plus, Trash2, RotateCcw, Shield, Heart, Play, Activity } from 'lucide-react';

export const CombatTracker: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // Modal states
  const [isModalOpen, setModalOpen] = useState(false);
  const [newEncounterName, setNewEncounterName] = useState('');

  // Delete Encounter state
  const [deleteEncounterId, setDeleteEncounterId] = useState<string | null>(null);

  // Creature Adder
  const [isAddCreatureOpen, setAddCreatureOpen] = useState(false);
  const [newCreature, setNewCreature] = useState<Partial<Combatant>>({ name: '', hp: 10, ac: 10, initiative: 0, type: 'Monster' });

  useEffect(() => {
    if (campaignId) {
        loadData();
    }
  }, [campaignId]);

  const loadData = async () => {
      if (!campaignId) return;
      const [enc, chars] = await Promise.all([
          db.encounters.list(campaignId),
          db.characters.list(campaignId)
      ]);
      setEncounters(enc);
      setCharacters(chars);
  };

  const saveEncounter = async (encounter: Encounter) => {
    await db.encounters.update(encounter);
    setEncounters(prev => prev.map(e => e.id === encounter.id ? encounter : e));
    setActiveEncounter(encounter);
  };

  const createEncounter = async () => {
    if (!campaignId || !newEncounterName) return;
    const newEnc: Encounter = {
      id: Date.now().toString(),
      campaign_id: campaignId,
      name: newEncounterName,
      creatures: [],
      status: 'planned',
      notes: '',
      round: 0
    };
    await db.encounters.add(newEnc);
    setEncounters([...encounters, newEnc]);
    setActiveEncounter(newEnc);
    setNewEncounterName('');
    setModalOpen(false);
  };

  const requestDeleteEncounter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteEncounterId(id);
  }

  const confirmDeleteEncounter = async () => {
      if(deleteEncounterId) {
          await db.encounters.delete(deleteEncounterId);
          setEncounters(encounters.filter(e => e.id !== deleteEncounterId));
          setDeleteEncounterId(null);
          if (activeEncounter?.id === deleteEncounterId) {
              setActiveEncounter(null);
          }
      }
  }

  const addCreature = async () => {
    if (!activeEncounter) return;
    const combatant: Combatant = {
      id: Date.now().toString(),
      name: newCreature.name || 'Enemy',
      type: newCreature.type as any,
      ac: newCreature.ac || 10,
      hp: newCreature.hp || 10,
      max_hp: newCreature.hp || 10,
      initiative: newCreature.initiative || 0,
      conditions: [],
    };
    const updated = { ...activeEncounter, creatures: [...activeEncounter.creatures, combatant] };
    await saveEncounter(updated);
    setAddCreatureOpen(false);
    setNewCreature({ name: '', hp: 10, ac: 10, initiative: 0, type: 'Monster' });
  };

  const addParty = async () => {
    if (!activeEncounter) return;
    const partyCombatants: Combatant[] = characters.map(c => ({
      id: c.id,
      name: c.name,
      type: 'PC',
      ac: c.ac,
      hp: c.current_hp ?? c.max_hp,
      max_hp: c.max_hp,
      initiative: 0,
      conditions: []
    }));
    const updated = { ...activeEncounter, creatures: [...activeEncounter.creatures, ...partyCombatants] };
    await saveEncounter(updated);
  };

  const updateCreature = async (id: string, updates: Partial<Combatant>) => {
    if (!activeEncounter) return;
    const updatedCreatures = activeEncounter.creatures.map(c => c.id === id ? { ...c, ...updates } : c);
    await saveEncounter({ ...activeEncounter, creatures: updatedCreatures });
  };

  const deleteCreature = async (id: string) => {
    if (!activeEncounter) return;
    await saveEncounter({ ...activeEncounter, creatures: activeEncounter.creatures.filter(c => c.id !== id) });
  };

  const rollInitiative = async () => {
    if (!activeEncounter) return;
    const rolled = activeEncounter.creatures.map(c => ({
      ...c,
      initiative: c.type === 'PC' ? c.initiative : Math.floor(Math.random() * 20) + 1 // Auto roll monsters, keep PC
    }));
    rolled.sort((a, b) => b.initiative - a.initiative);
    await saveEncounter({ ...activeEncounter, creatures: rolled, status: 'active', round: 1 });
  };

  const nextRound = async () => {
    if (!activeEncounter) return;
    await saveEncounter({ ...activeEncounter, round: activeEncounter.round + 1 });
  };

  // --- Render ---

  if (!activeEncounter) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Encounters</h2>
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Encounter</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {encounters.map(enc => (
            <Card key={enc.id} className="hover:border-indigo-500 cursor-pointer transition-colors relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => requestDeleteEncounter(e, enc.id)} className="p-1 bg-zinc-800 rounded hover:bg-red-900 text-zinc-300 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div onClick={() => setActiveEncounter(enc)}>
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                        <h3 className="text-lg font-semibold text-zinc-100">{enc.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <Badge color={enc.status === 'active' ? 'green' : enc.status === 'done' ? 'gray' : 'blue'}>
                        {enc.status}
                        </Badge>
                        <span className="text-xs text-zinc-500">{enc.creatures.length} Combatants</span>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full">
                        Open Tracker
                    </Button>
                </div>
            </Card>
          ))}
          {encounters.length === 0 && (
             <div className="col-span-full py-12 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-lg">
                No encounters planned.
            </div>
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create Encounter">
          <Input label="Encounter Name" value={newEncounterName} onChange={e => setNewEncounterName(e.target.value)} autoFocus />
          <div className="mt-4 flex justify-end">
            <Button onClick={createEncounter}>Create</Button>
          </div>
        </Modal>

        <ConfirmModal 
            isOpen={!!deleteEncounterId} 
            onClose={() => setDeleteEncounterId(null)} 
            onConfirm={confirmDeleteEncounter} 
            title="Delete Encounter" 
            message="Are you sure you want to delete this encounter?"
        />
      </div>
    );
  }

  // Active Encounter View
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div>
          <button onClick={() => setActiveEncounter(null)} className="text-sm text-zinc-400 hover:text-white mb-1">← Back to list</button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {activeEncounter.name}
            <Badge color={activeEncounter.status === 'active' ? 'green' : 'blue'}>Round {activeEncounter.round}</Badge>
          </h2>
        </div>
        <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={addParty}><Users className="w-4 h-4 mr-2"/> Add Party</Button>
            <Button size="sm" variant="secondary" onClick={() => setAddCreatureOpen(true)}><Plus className="w-4 h-4 mr-2"/> Add NPC/Monster</Button>
            {activeEncounter.status !== 'active' && (
                <Button size="sm" onClick={rollInitiative}><Swords className="w-4 h-4 mr-2"/> Roll Init</Button>
            )}
             {activeEncounter.status === 'active' && (
                <Button size="sm" onClick={nextRound}><RotateCcw className="w-4 h-4 mr-2"/> Next Round</Button>
            )}
        </div>
      </div>

      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 uppercase px-4">
            <div className="col-span-1 text-center">Init</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2 text-center">AC</div>
            <div className="col-span-3">HP</div>
            <div className="col-span-2 text-right">Actions</div>
        </div>
        
        {/* List */}
        {activeEncounter.creatures.sort((a,b) => b.initiative - a.initiative).map(c => (
             <div key={c.id} className={`grid grid-cols-12 gap-2 items-center bg-zinc-900 p-3 rounded-md border ${c.hp <= 0 ? 'border-zinc-800 opacity-60' : 'border-zinc-800'}`}>
                <div className="col-span-1">
                    <input 
                        type="number" 
                        className="w-full bg-transparent text-center font-mono focus:outline-none" 
                        value={c.initiative} 
                        onChange={(e) => updateCreature(c.id, { initiative: parseInt(e.target.value) || 0 })}
                    />
                </div>
                <div className="col-span-4 font-medium flex flex-col">
                    <span className={c.type === 'PC' ? 'text-indigo-400' : 'text-zinc-200'}>{c.name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{c.type}</span>
                </div>
                <div className="col-span-2 flex justify-center items-center gap-1 text-zinc-400">
                    <Shield className="w-3 h-3" />
                    <input 
                        type="number" 
                        className="w-12 bg-transparent text-center focus:outline-none" 
                        value={c.ac} 
                        onChange={(e) => updateCreature(c.id, { ac: parseInt(e.target.value) || 10 })}
                    />
                </div>
                <div className="col-span-3 flex items-center gap-2">
                     <Heart className={`w-3 h-3 ${c.hp < c.max_hp / 2 ? 'text-red-500' : 'text-zinc-500'}`} />
                     <div className="flex items-center">
                        <input 
                            type="number" 
                            className="w-12 bg-zinc-950 border border-zinc-700 rounded px-1 text-right focus:outline-none focus:border-indigo-500" 
                            value={c.hp} 
                            onChange={(e) => updateCreature(c.id, { hp: parseInt(e.target.value) || 0 })}
                        />
                        <span className="mx-1 text-zinc-500">/</span>
                        <span className="text-zinc-500 text-sm">{c.max_hp}</span>
                     </div>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => deleteCreature(c.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                </div>
             </div>
        ))}

        {activeEncounter.creatures.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No combatants. Add the party or monsters.</div>
        )}
      </div>

       <Modal isOpen={isAddCreatureOpen} onClose={() => setAddCreatureOpen(false)} title="Add Creature">
          <div className="space-y-4">
            <Input label="Name" value={newCreature.name} onChange={e => setNewCreature({...newCreature, name: e.target.value})} autoFocus />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Max HP" type="number" value={newCreature.hp} onChange={e => setNewCreature({...newCreature, hp: parseInt(e.target.value)})} />
                <Input label="AC" type="number" value={newCreature.ac} onChange={e => setNewCreature({...newCreature, ac: parseInt(e.target.value)})} />
            </div>
            <Input label="Initiative Bonus" type="number" value={newCreature.initiative} onChange={e => setNewCreature({...newCreature, initiative: parseInt(e.target.value)})} />
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setAddCreatureOpen(false)}>Cancel</Button>
                <Button onClick={addCreature}>Add Creature</Button>
            </div>
          </div>
       </Modal>
    </div>
  );
};

// Simple User Icon helper for the add party button
const Users: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
