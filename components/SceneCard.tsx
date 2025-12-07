import React, { useState } from 'react';
import { SessionScene, UUID } from '../types';
import { Card, Input, Textarea, Button } from './ui';
import { ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';

interface SceneCardProps {
  scene: SessionScene;
  onUpdate: (scene: SessionScene) => void;
  onDelete: (id: UUID) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const SCENE_TYPES = ['Social', 'Combat', 'Exploration', 'Investigation', 'Flashback', 'Downtime', 'Travel', 'Other'] as const;

export const SceneCard: React.FC<SceneCardProps> = ({ scene, onUpdate, onDelete, isExpanded, onToggleExpand }) => {
  const [localScene, setLocalScene] = useState(scene);

  const handleChange = (field: keyof SessionScene, value: any) => {
    const updated = { ...localScene, [field]: value };
    setLocalScene(updated);
    onUpdate(updated);
  };

  const handleArrayChange = (field: 'npcs' | 'beats', index: number, value: string) => {
    const updated = { ...localScene };
    updated[field][index] = value;
    setLocalScene(updated);
    onUpdate(updated);
  };

  const handleAddArrayItem = (field: 'npcs' | 'beats') => {
    const updated = { ...localScene };
    updated[field] = [...updated[field], ''];
    setLocalScene(updated);
    onUpdate(updated);
  };

  const handleRemoveArrayItem = (field: 'npcs' | 'beats', index: number) => {
    const updated = { ...localScene };
    updated[field] = updated[field].filter((_, i) => i !== index);
    setLocalScene(updated);
    onUpdate(updated);
  };

  return (
    <Card className="mb-4 relative">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 -m-4 p-4 rounded-t transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="w-5 h-5 text-zinc-600 cursor-grab active:cursor-grabbing" />
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gold" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-cinzel text-gold/70">#{localScene.order_index + 1}</span>
              <h4 className="font-cinzel font-semibold text-white text-lg">
                {localScene.title || 'Untitled Scene'}
              </h4>
              <span className="text-xs px-2 py-1 rounded bg-violet/20 border border-violet/40 text-violet-light">
                {localScene.type}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}
          className="text-zinc-600 hover:text-red-400 transition-colors ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Scene Title"
              value={localScene.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g., The Burning Gate"
            />
            
            <div className="mb-4">
              <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
                Scene Type
              </label>
              <select
                value={localScene.type}
                onChange={e => handleChange('type', e.target.value)}
                className="flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
              >
                {SCENE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <Textarea 
            label="Description (Setting & Atmosphere)"
            value={localScene.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Describe the scene's environment, mood, and initial situation..."
            rows={3}
          />

          <Textarea 
            label="Objective (What should this scene accomplish?)"
            value={localScene.objective}
            onChange={e => handleChange('objective', e.target.value)}
            placeholder="What narrative goal or information should this scene deliver?"
            rows={2}
          />

          {/* NPCs Involved */}
          <div>
            <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              NPCs Involved
            </label>
            <div className="space-y-2">
              {localScene.npcs.map((npc, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={npc}
                    onChange={e => handleArrayChange('npcs', idx, e.target.value)}
                    placeholder="NPC name..."
                    className="flex h-9 flex-1 rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50"
                  />
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleRemoveArrayItem('npcs', idx)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => handleAddArrayItem('npcs')}>
                + Add NPC
              </Button>
            </div>
          </div>

          {/* Beats (Key Points) */}
          <div>
            <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              Beats (Key Points to Cover)
            </label>
            <div className="space-y-2">
              {localScene.beats.map((beat, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={beat}
                    onChange={e => handleArrayChange('beats', idx, e.target.value)}
                    placeholder="Story beat or important detail..."
                    className="flex h-9 flex-1 rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50"
                  />
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleRemoveArrayItem('beats', idx)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => handleAddArrayItem('beats')}>
                + Add Beat
              </Button>
            </div>
          </div>

          <Textarea 
            label="Branches (Possible Player Paths)"
            value={localScene.branches}
            onChange={e => handleChange('branches', e.target.value)}
            placeholder="How might players approach this differently? What choices might they make?"
            rows={2}
          />

          <Textarea 
            label="Hooks (What this scene leaves open)"
            value={localScene.hooks}
            onChange={e => handleChange('hooks', e.target.value)}
            placeholder="What narrative threads or questions does this scene create for later?"
            rows={2}
          />
        </div>
      )}
    </Card>
  );
};
