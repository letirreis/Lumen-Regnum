import React, { useState } from 'react';
import { Faction, UUID } from '../types';
import { X } from 'lucide-react';

interface MultiFactionSelectProps {
  factions: Faction[]; // All available factions for the campaign
  selectedIds: UUID[]; // Currently selected faction IDs
  onChange: (ids: UUID[]) => void; // Callback when selection changes
}

/**
 * MultiFactionSelect: A simple multi-select component for factions
 * Displays selected factions as chips/buttons with remove option
 * Shows a dropdown to add more factions
 */
export const MultiFactionSelect: React.FC<MultiFactionSelectProps> = ({
  factions,
  selectedIds,
  onChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedFactions = factions.filter(f => selectedIds.includes(f.id));
  const availableFactions = factions.filter(f => !selectedIds.includes(f.id));

  const handleAdd = (id: UUID) => {
    onChange([...selectedIds, id]);
    setIsDropdownOpen(false);
  };

  const handleRemove = (id: UUID) => {
    onChange(selectedIds.filter(fid => fid !== id));
  };

  return (
    <div className="space-y-2">
      {/* Selected Factions as Chips */}
      {selectedFactions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFactions.map(faction => (
            <div
              key={faction.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-900/30 text-indigo-200 border border-indigo-800 rounded text-xs"
            >
              <span>{faction.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(faction.id)}
                className="hover:bg-indigo-800/50 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Faction Dropdown */}
      {availableFactions.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full text-left px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-100 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {selectedFactions.length === 0 ? 'Selecionar Facções...' : 'Adicionar mais facções...'}
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded shadow-lg max-h-48 overflow-y-auto">
              {availableFactions.map(faction => (
                <button
                  key={faction.id}
                  type="button"
                  onClick={() => handleAdd(faction.id)}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-100 hover:bg-indigo-900/30 hover:text-indigo-200 transition-colors"
                >
                  {faction.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedFactions.length === 0 && availableFactions.length === 0 && (
        <p className="text-xs text-zinc-500 italic">
          Nenhuma facção disponível. Crie facções na aba "Families &amp; Factions" primeiro.
        </p>
      )}
    </div>
  );
};
