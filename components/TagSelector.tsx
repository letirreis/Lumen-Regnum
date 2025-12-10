import React, { useState } from 'react';
import { Tag, UUID } from '../types';
import { X, Plus } from 'lucide-react';
import { db, generateId } from '../services/store';

interface TagSelectorProps {
  campaignId: UUID;
  tags: Tag[]; // All available tags for the campaign
  selectedIds: UUID[]; // Currently selected tag IDs
  onChange: (ids: UUID[]) => void; // Callback when selection changes
  onTagsReload: () => Promise<void>; // Callback to reload tags after creating new ones
}

/**
 * TagSelector: Component for selecting and creating tags inline
 * Displays tags as colored chips, allows filtering by type, and inline creation
 * NOTE: Requires dmos_tags table to exist in database
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  campaignId,
  tags,
  selectedIds,
  onChange,
  onTagsReload,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1'); // Default indigo
  const [newTagType, setNewTagType] = useState('type');
  const [filterType, setFilterType] = useState<string>(''); // Filter by tag_type

  const selectedTags = tags.filter(t => selectedIds.includes(t.id));
  
  // Filter available tags
  const availableTags = tags.filter(t => {
    const notSelected = !selectedIds.includes(t.id);
    const matchesFilter = !filterType || t.tag_type === filterType;
    return notSelected && matchesFilter;
  });

  const handleToggle = (id: UUID) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(tid => tid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: generateId(),
      campaign_id: campaignId,
      name: newTagName.trim(),
      color: newTagColor,
      tag_type: newTagType,
      created_at: new Date().toISOString(),
    };

    try {
      await db.tags.add(newTag);
      await onTagsReload(); // Reload tags from database
      onChange([...selectedIds, newTag.id]); // Auto-select newly created tag
      
      // Reset form
      setNewTagName('');
      setNewTagColor('#6366f1');
      setNewTagType('type');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Erro ao criar tag. Verifique se a tabela dmos_tags existe no banco de dados.');
    }
  };

  // Get tag type options from existing tags
  const tagTypes = Array.from(new Set(tags.map(t => t.tag_type).filter(Boolean))) as string[];
  if (!tagTypes.includes('type')) tagTypes.unshift('type');
  if (!tagTypes.includes('status')) tagTypes.unshift('status');

  return (
    <div className="space-y-3">
      {/* Filter by Type */}
      <div className="flex gap-2 items-center">
        <label className="text-xs text-zinc-400">Filtrar por tipo:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="">Todos os tipos</option>
          {tagTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Tags Selecionadas:</label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : '#3730a320',
                  borderColor: tag.color || '#3730a3',
                  color: tag.color || '#818cf8',
                }}
              >
                <span className="font-medium">{tag.name}</span>
                {tag.tag_type && (
                  <span className="text-[9px] opacity-70">({tag.tag_type})</span>
                )}
                <button
                  type="button"
                  onClick={() => handleToggle(tag.id)}
                  className="hover:opacity-70 rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Tags to Select */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Clique para adicionar:</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-zinc-950/50 border border-zinc-800 rounded">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggle(tag.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: tag.color ? `${tag.color}15` : '#3730a315',
                  borderColor: tag.color || '#3730a3',
                  color: tag.color || '#818cf8',
                }}
              >
                <span className="font-medium">{tag.name}</span>
                {tag.tag_type && (
                  <span className="text-[9px] opacity-70">({tag.tag_type})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New Tag Inline */}
      {!isCreating ? (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 border-dashed rounded text-sm text-zinc-400 hover:text-indigo-400 hover:border-indigo-600 focus:outline-none transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Criar nova tag
        </button>
      ) : (
        <div className="p-3 bg-zinc-950 border border-indigo-900/30 rounded space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da tag"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-12 h-8 rounded border border-zinc-700 bg-zinc-900 cursor-pointer"
              title="Cor da tag"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-zinc-400">Tipo:</label>
            <select
              value={newTagType}
              onChange={(e) => setNewTagType(e.target.value)}
              className="flex-1 h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="type">type</option>
              <option value="status">status</option>
              <option value="custom">custom</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateTag}
              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              Criar Tag
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTagName('');
                setNewTagColor('#6366f1');
                setNewTagType('type');
              }}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {tags.length === 0 && (
        <p className="text-xs text-zinc-500 italic">
          Nenhuma tag disponível. Use "Criar nova tag" para começar.
        </p>
      )}
    </div>
  );
};
