import React, { useState } from 'react';
import { NPC, Character, UUID } from '../types';
import { X } from 'lucide-react';

interface MultiMemberSelectProps {
  npcs: NPC[];
  characters: Character[];
  selectedIds: UUID[]; // Currently selected member IDs (NPCs + Characters)
  onChange: (ids: UUID[]) => void; // Callback when selection changes
}

/**
 * MultiMemberSelect: A multi-select component for NPCs and Characters
 * Displays selected members as chips with remove option
 * Shows a dropdown to add more members
 */
export const MultiMemberSelect: React.FC<MultiMemberSelectProps> = ({
  npcs,
  characters,
  selectedIds,
  onChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const allMembers = [
    ...npcs.map(n => ({ id: n.id, name: n.name, type: 'npc' as const })),
    ...characters.map(c => ({ id: c.id, name: c.name, type: 'character' as const })),
  ];

  const selectedMembers = allMembers.filter(m => selectedIds.includes(m.id));
  const availableMembers = allMembers.filter(m => !selectedIds.includes(m.id));

  const handleAdd = (id: UUID) => {
    onChange([...selectedIds, id]);
    setIsDropdownOpen(false);
  };

  const handleRemove = (id: UUID) => {
    onChange(selectedIds.filter(mid => mid !== id));
  };

  return (
    <div className="space-y-2">
      {/* Selected Members as Chips */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map(member => (
            <div
              key={member.id}
              className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-xs ${
                member.type === 'character' 
                  ? 'bg-green-900/30 text-green-200 border-green-800' 
                  : 'bg-blue-900/30 text-blue-200 border-blue-800'
              }`}
            >
              <span>{member.name}</span>
              <span className="text-[10px] opacity-70">({member.type === 'character' ? 'PC' : 'NPC'})</span>
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                aria-label={`Remove ${member.name}`}
                className="hover:bg-opacity-50 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Dropdown */}
      {availableMembers.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full text-left px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-100 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {selectedMembers.length === 0 ? 'Selecionar Membros (NPCs/PCs)...' : 'Adicionar mais membros...'}
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded shadow-lg max-h-48 overflow-y-auto">
              {availableMembers.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleAdd(member.id)}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-100 hover:bg-indigo-900/30 hover:text-indigo-200 transition-colors flex justify-between items-center"
                >
                  <span>{member.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    member.type === 'character' ? 'bg-green-800/50' : 'bg-blue-800/50'
                  }`}>
                    {member.type === 'character' ? 'PC' : 'NPC'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedMembers.length === 0 && availableMembers.length === 0 && (
        <p className="text-xs text-zinc-500 italic">
          Nenhum NPC ou Character disponível. Crie NPCs/Characters primeiro.
        </p>
      )}
    </div>
  );
};
