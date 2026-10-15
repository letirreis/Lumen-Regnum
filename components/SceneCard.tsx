import React, { useState } from 'react';
import { SessionScene, UUID } from '../types';
import { Card, Input, Textarea, Button } from './ui';
import { useI18n } from '../i18n';
import { ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';

interface SceneCardProps {
  scene: SessionScene;
  onUpdate: (scene: SessionScene) => void;
  onDelete: (id: UUID) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  plots?: { id: string; name: string }[]; // tramas do Códex disponíveis para ligar
}

const SCENE_TYPES = ['Social', 'Combat', 'Exploration', 'Investigation', 'Flashback', 'Downtime', 'Travel', 'Other'] as const;

export const SceneCard: React.FC<SceneCardProps> = ({ scene, onUpdate, onDelete, isExpanded, onToggleExpand, plots = [] }) => {
  const { t, opt } = useI18n();
  const [localScene, setLocalScene] = useState(scene);

  // Sync local state when scene prop changes
  React.useEffect(() => {
    setLocalScene(scene);
  }, [scene]);

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
          <GripVertical className="w-5 h-5 text-zinc-700" aria-hidden="true" title={t('scene.reorderUnsupported')} />
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gold" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-cinzel text-gold/70">#{localScene.order_index + 1}</span>
              <h4 className="font-cinzel font-semibold text-white text-lg">
                {localScene.title || t('scene.untitled')}
              </h4>
              <span className="text-xs px-2 py-1 rounded bg-violet/20 border border-violet/40 text-violet-light">
                {opt('scene_type', localScene.type)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}
          aria-label={t('scene.deleteAria', { title: localScene.title || t('scene.untitled') })}
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
              label={t('scene.title')}
              value={localScene.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder={t('scene.titlePlaceholder')}
            />
            
            <div className="mb-4">
              <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
                {t('scene.type')}
              </label>
              <select
                value={localScene.type}
                onChange={e => handleChange('type', e.target.value)}
                className="flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
              >
                {SCENE_TYPES.map(type => (
                  <option key={type} value={type}>{opt('scene_type', type)}</option>
                ))}
              </select>
            </div>
          </div>

          <Textarea 
            label={t('scene.description')}
            value={localScene.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder={t('scene.descriptionPlaceholder')}
            rows={3}
          />

          <Textarea 
            label={t('scene.objective')}
            value={localScene.objective}
            onChange={e => handleChange('objective', e.target.value)}
            placeholder={t('scene.objectivePlaceholder')}
            rows={2}
          />

          {/* NPCs Involved */}
          <div>
            <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              {t('scene.npcs')}
            </label>
            <div className="space-y-2">
              {localScene.npcs.map((npc, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={npc}
                    onChange={e => handleArrayChange('npcs', idx, e.target.value)}
                    placeholder={t('scene.npcPlaceholder')}
                    className="flex h-9 flex-1 rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50"
                  />
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleRemoveArrayItem('npcs', idx)}
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => handleAddArrayItem('npcs')}>
                {t('scene.addNpc')}
              </Button>
            </div>
          </div>

          {/* Beats (Key Points) */}
          <div>
            <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              {t('scene.beats')}
            </label>
            <div className="space-y-2">
              {localScene.beats.map((beat, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={beat}
                    onChange={e => handleArrayChange('beats', idx, e.target.value)}
                    placeholder={t('scene.beatPlaceholder')}
                    className="flex h-9 flex-1 rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50"
                  />
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleRemoveArrayItem('beats', idx)}
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => handleAddArrayItem('beats')}>
                {t('scene.addBeat')}
              </Button>
            </div>
          </div>

          <Textarea 
            label={t('scene.branches')}
            value={localScene.branches}
            onChange={e => handleChange('branches', e.target.value)}
            placeholder={t('scene.branchesPlaceholder')}
            rows={2}
          />

          {/* Tramas do Códex que esta cena movimenta */}
          <div>
            <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              {t('scene.plots')}
            </label>
            {plots.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">{t('scene.plotsEmpty')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {plots.map(plot => {
                  const active = (localScene.plot_ids ?? []).includes(plot.id);
                  return (
                    <button
                      key={plot.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        const current = localScene.plot_ids ?? [];
                        handleChange('plot_ids', active ? current.filter(id => id !== plot.id) : [...current, plot.id]);
                      }}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${active ? 'bg-violet/20 border-violet/60 text-violet-light' : 'border-zinc-700 text-zinc-400 hover:border-gold/40 hover:text-gold'}`}
                    >
                      {plot.name || t('scene.plotUnnamed')}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Textarea 
            label={t('scene.secrets')}
            value={localScene.secrets ?? ''}
            onChange={e => handleChange('secrets', e.target.value)}
            placeholder={t('scene.secretsPlaceholder')}
            rows={2}
          />

          <Textarea 
            label={t('scene.hooks')}
            value={localScene.hooks}
            onChange={e => handleChange('hooks', e.target.value)}
            placeholder={t('scene.hooksPlaceholder')}
            rows={2}
          />
        </div>
      )}
    </Card>
  );
};
