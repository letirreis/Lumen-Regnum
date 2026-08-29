
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, generateId } from '../services/store';
import type { DbResult } from '../services/store';
import { Campaign, Session, Note, CampaignCodex } from '../types';
import { Card, Badge, Button, Textarea, Input, Modal, ConfirmModal } from '../components/ui';
import { Calendar, MapPin, Users, Plus, Trash2, Edit2, FileText, Dices, ExternalLink } from 'lucide-react';
import { useToast } from '../components/Toast';

export const CampaignDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codex, setCodex] = useState<CampaignCodex | null>(null);
  const [stats, setStats] = useState({ npcs: 0, locations: 0, sessions: 0 });
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [nextSessionDate, setNextSessionDate] = useState<string>('TBD');
  
  // Notes List State
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
        loadCampaignData(id);
    }
  }, [id]);

  const loadCampaignData = async (campaignId: string) => {
    setLoadError(null);
    let fetchError: string | null = null;
    const camps = await db.campaigns.list((error) => { fetchError = error.message; });
    if (fetchError) {
        setLoadError(fetchError);
        return;
    }
    const found = camps.find(c => c.id === campaignId);
    if (!found) {
        setLoadError('Campaign not found.');
        return;
    }
    if (found) {
        setCampaign(found);
        
        // Parallel data fetching for performance
        const [sessions, npcs, locations, notes, codexData] = await Promise.all([
            db.sessions.list(campaignId),
            db.npcs.list(campaignId),
            db.locations.list(campaignId),
            db.notes.list(campaignId),
            db.codex.get(campaignId)
        ]);

        setStats({
            npcs: npcs.length,
            locations: locations.length,
            sessions: sessions.length
        });

        // Recent Sessions logic
        const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setRecentSessions(sortedSessions.slice(-3).reverse());
        
        // Next Session Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today
        const nextSession = sortedSessions.find(s => {
            const sDate = new Date(s.date);
            return sDate >= today || s.date === today.toISOString().split('T')[0];
        });
        
        if (nextSession) {
            setNextSessionDate(nextSession.date);
        } else {
            setNextSessionDate('TBD');
        }

        setNotesList(notes);
        setCodex(codexData);
    }
  };

  const openNewNote = () => {
      setEditingNote({
          id: '',
          campaign_id: id!,
          title: '',
          content: '',
          created_at: new Date().toISOString()
      });
      setNoteModalOpen(true);
  };

  const openEditNote = (note: Note) => {
      setEditingNote(note);
      setNoteModalOpen(true);
  };

  const saveNote = async () => {
      if (!editingNote || !id) return;

      let result: DbResult<Note>;
      if (editingNote.id) {
          result = await db.notes.update(editingNote);
      } else {
          const newNote = { ...editingNote, id: generateId(), campaign_id: id };
          result = await db.notes.add(newNote);
      }
      
      if (result.error) {
          console.error('Error saving note:', result.error);
          showToast(`Failed to save note. ${result.error.message || 'Please try again.'}`, 'error');
          return;
      }
      
      setNoteModalOpen(false);
      const updatedNotes = await db.notes.list(id);
      setNotesList(updatedNotes);
  };

  const confirmDeleteNote = async () => {
      if (deleteNoteId && id) {
          const result = await db.notes.delete(deleteNoteId);
          if (result.error) {
              console.error('Error deleting note:', result.error);
              showToast(`Failed to delete note. ${result.error.message || 'Please try again.'}`, 'error');
              return;
          }
          setDeleteNoteId(null);
          const updatedNotes = await db.notes.list(id);
          setNotesList(updatedNotes);
      }
  };

  const toggleDiceRoller = () => {
      window.dispatchEvent(new CustomEvent('open-dice-roller'));
  };

  if (loadError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <p className="text-red-400">{loadError}</p>
      <Button variant="secondary" onClick={() => id && loadCampaignData(id)}>Try again</Button>
    </div>
  );

  if (!campaign) return (
    <div className="flex items-center justify-center py-20 text-gold font-cinzel gap-3">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      Loading campaign...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-indigo-950/50 to-zinc-900 border-indigo-900/50">
            <h1 className="text-3xl font-bold text-white mb-2">{campaign.name}</h1>
            <p className="text-indigo-200 italic mb-4">"{campaign.theme}"</p>
            <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Users className="w-4 h-4"/> {stats.npcs} NPCs
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="w-4 h-4"/> {stats.locations} Locations
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar className="w-4 h-4"/> {stats.sessions} Sessions
                </div>
            </div>
            <div className="bg-zinc-950/50 p-4 rounded-md border border-zinc-800/50">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold uppercase text-zinc-500">Main Arc</h3>
                    <button 
                        onClick={() => navigate(`/campaign/${id}/codex/main-arc`)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="Edit in Codex"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Edit in Codex
                    </button>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {codex?.main_arc?.premise || "No main arc defined yet."}
                </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Quick Stats">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Status</span>
                        <Badge color="green">Active</Badge>
                    </div>
                    <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                         <span className="text-zinc-400">Next Session</span>
                         <span className={`font-mono font-bold ${nextSessionDate === 'TBD' ? 'text-zinc-500' : 'text-indigo-400'}`}>
                            {nextSessionDate}
                         </span>
                    </div>
                </div>
            </Card>
            <Card title="Tools">
                <div className="space-y-2">
                    <Button variant="secondary" className="w-full justify-start text-sm" onClick={toggleDiceRoller}>
                        <Dices className="w-4 h-4 mr-2" />
                        Open Dice Roller
                    </Button>
                    <Button variant="secondary" className="w-full justify-start text-sm">Random Name Gen (Coming Soon)</Button>
                </div>
            </Card>
          </div>
        </div>

        {/* Sidebar / Recent */}
        <div className="space-y-6">
            <Card title="Recent Sessions">
                {recentSessions.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic">No sessions recorded.</p>
                ) : (
                    <div className="space-y-4">
                        {recentSessions.map(s => (
                            <div key={s.id} className="group cursor-pointer hover:bg-zinc-800/50 p-2 rounded transition-colors -mx-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-indigo-400">{s.date}</span>
                                </div>
                                <p className="text-xs text-zinc-400 line-clamp-3">{s.summary}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            
            {/* Notes Section */}
            <Card 
                title="Campaign Notes"
                action={
                    <button onClick={openNewNote} className="p-1 text-zinc-400 hover:text-white transition-colors" title="Add Note">
                        <Plus className="w-4 h-4" />
                    </button>
                }
            >
                {notesList.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-sm italic">
                        No notes yet. <br/> Click + to create one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notesList.map(note => (
                            <div key={note.id} className="bg-zinc-950 border border-zinc-800 rounded p-3 group relative hover:border-zinc-600 transition-colors">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-zinc-950 pl-2">
                                     <button onClick={() => openEditNote(note)} aria-label={`Edit note ${note.title || 'Untitled Note'}`} className="text-zinc-500 hover:text-indigo-400"><Edit2 className="w-3 h-3" /></button>
                                     <button onClick={() => setDeleteNoteId(note.id)} aria-label={`Delete note ${note.title || 'Untitled Note'}`} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-zinc-600"/>
                                    {note.title || "Untitled Note"}
                                </div>
                                <div className="text-xs text-zinc-400 line-clamp-3 whitespace-pre-wrap">{note.content}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
      </div>

      {/* Note Modal */}
      <Modal isOpen={isNoteModalOpen} onClose={() => setNoteModalOpen(false)} title={editingNote?.id ? "Edit Note" : "New Note"}>
            <div className="space-y-4">
                <Input 
                    label="Title" 
                    value={editingNote?.title || ''} 
                    onChange={(e) => setEditingNote(prev => prev ? {...prev, title: e.target.value} : null)}
                    placeholder="e.g. Secret Door Password"
                    autoFocus
                />
                <Textarea 
                    label="Content" 
                    value={editingNote?.content || ''} 
                    onChange={(e) => setEditingNote(prev => prev ? {...prev, content: e.target.value} : null)}
                    className="min-h-[200px] font-mono"
                    placeholder="Write your note here..."
                />
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setNoteModalOpen(false)}>Cancel</Button>
                    <Button onClick={saveNote}>Save Note</Button>
                </div>
            </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
      />
    </div>
  );
};
