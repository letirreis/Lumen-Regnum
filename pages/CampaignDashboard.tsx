
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, generateId } from '../services/store';
import type { DbResult } from '../services/store';
import { Campaign, Session, Note, CampaignCodex } from '../types';
import { Card, Badge, Button, Textarea, Input, Modal, ConfirmModal } from '../components/ui';
import { Calendar, MapPin, Users, Plus, Trash2, Edit2, FileText, Dices, ExternalLink } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';

export const CampaignDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, opt, formatDate } = useI18n();
  const fmt = (d: string) => formatDate(`${d}T12:00:00`);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codex, setCodex] = useState<CampaignCodex | null>(null);
  const [stats, setStats] = useState({ npcs: 0, locations: 0, sessions: 0 });
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [nextSessionDate, setNextSessionDate] = useState<string | null>(null);
  
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
        setLoadError(t('dashboard.notFound'));
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
            setNextSessionDate(null);
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
          showToast(t('dashboard.noteSaveError', { detail: result.error.message || t('common.tryAgain') }), 'error');
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
              showToast(t('dashboard.noteDeleteError', { detail: result.error.message || t('common.tryAgain') }), 'error');
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
      <Button variant="secondary" onClick={() => id && loadCampaignData(id)}>{t('common.tryAgainButton')}</Button>
    </div>
  );

  if (!campaign) return (
    <div className="flex items-center justify-center py-20 text-gold font-cinzel gap-3">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      {t('dashboard.loading')}
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
                    <Users className="w-4 h-4"/> {t('dashboard.statNpcs', { count: stats.npcs })}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="w-4 h-4"/> {t('dashboard.statLocations', { count: stats.locations })}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar className="w-4 h-4"/> {t('dashboard.statSessions', { count: stats.sessions })}
                </div>
            </div>
            <div className="bg-zinc-950/50 p-4 rounded-md border border-zinc-800/50">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold uppercase text-zinc-500">{t('dashboard.mainArc')}</h3>
                    <button 
                        onClick={() => navigate(`/campaign/${id}/codex/main-arc`)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        title={t('dashboard.editInCodex')}
                    >
                        <ExternalLink className="w-3 h-3" />
                        {t('dashboard.editInCodex')}
                    </button>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {codex?.main_arc?.premise || t('dashboard.noMainArc')}
                </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title={t('dashboard.quickStats')}>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">{t('dashboard.status')}</span>
                        <Badge color="green">{opt('campaign_status', campaign.status)}</Badge>
                    </div>
                    <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                         <span className="text-zinc-400">{t('dashboard.nextSession')}</span>
                         <span className={`font-mono font-bold ${nextSessionDate === null ? 'text-zinc-500' : 'text-indigo-400'}`}>
                            {nextSessionDate === null ? t('dashboard.tbd') : fmt(nextSessionDate)}
                         </span>
                    </div>
                </div>
            </Card>
            <Card title={t('dashboard.tools')}>
                <div className="space-y-2">
                    <Button variant="secondary" className="w-full justify-start text-sm" onClick={toggleDiceRoller}>
                        <Dices className="w-4 h-4 mr-2" />
                        {t('dashboard.openDice')}
                    </Button>
                    <Button variant="secondary" className="w-full justify-start text-sm">{t('dashboard.nameGen')} ({t('common.comingSoon')})</Button>
                </div>
            </Card>
          </div>
        </div>

        {/* Sidebar / Recent */}
        <div className="space-y-6">
            <Card title={t('dashboard.recentSessions')}>
                {recentSessions.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic">{t('dashboard.noSessions')}</p>
                ) : (
                    <div className="space-y-4">
                        {recentSessions.map(s => (
                            <div key={s.id} className="group cursor-pointer hover:bg-zinc-800/50 p-2 rounded transition-colors -mx-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-indigo-400">{fmt(s.date)}</span>
                                </div>
                                <p className="text-xs text-zinc-400 line-clamp-3">{s.summary}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            
            {/* Notes Section */}
            <Card 
                title={t('dashboard.notes')}
                action={
                    <button onClick={openNewNote} className="p-1 text-zinc-400 hover:text-white transition-colors" title={t('dashboard.addNote')}>
                        <Plus className="w-4 h-4" />
                    </button>
                }
            >
                {notesList.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-sm italic">
                        {t('dashboard.noNotes')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notesList.map(note => (
                            <div key={note.id} className="bg-zinc-950 border border-zinc-800 rounded p-3 group relative hover:border-zinc-600 transition-colors">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-zinc-950 pl-2">
                                     <button onClick={() => openEditNote(note)} aria-label={t('dashboard.editNoteAria', { title: note.title || t('dashboard.untitledNote') })} className="text-zinc-500 hover:text-indigo-400"><Edit2 className="w-3 h-3" /></button>
                                     <button onClick={() => setDeleteNoteId(note.id)} aria-label={t('dashboard.deleteNoteAria', { title: note.title || t('dashboard.untitledNote') })} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-zinc-600"/>
                                    {note.title || t('dashboard.untitledNote')}
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
      <Modal isOpen={isNoteModalOpen} onClose={() => setNoteModalOpen(false)} title={editingNote?.id ? t('dashboard.editNote') : t('dashboard.newNote')}>
            <div className="space-y-4">
                <Input 
                    label={t('dashboard.noteTitle')} 
                    value={editingNote?.title || ''} 
                    onChange={(e) => setEditingNote(prev => prev ? {...prev, title: e.target.value} : null)}
                    placeholder={t('dashboard.noteTitlePlaceholder')}
                    autoFocus
                />
                <Textarea 
                    label={t('dashboard.noteContent')} 
                    value={editingNote?.content || ''} 
                    onChange={(e) => setEditingNote(prev => prev ? {...prev, content: e.target.value} : null)}
                    className="min-h-[200px] font-mono"
                    placeholder={t('dashboard.noteContentPlaceholder')}
                />
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setNoteModalOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={saveNote}>{t('dashboard.saveNote')}</Button>
                </div>
            </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={confirmDeleteNote}
        title={t('dashboard.deleteNoteTitle')}
        message={t('dashboard.deleteNoteMessage')}
      />
    </div>
  );
};
