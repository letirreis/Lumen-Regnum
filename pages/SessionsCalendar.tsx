
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, generateId } from '../services/store';
import { Session } from '../types';
import { Card, Button, Input, Textarea, Modal, ConfirmModal, Badge } from '../components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export const SessionsCalendar: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal / Edit State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<Session>>({});
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
        loadSessions();
    }
  }, [campaignId]);

  const loadSessions = async () => {
      if (campaignId) {
          const data = await db.sessions.list(campaignId);
          setSessions(data);
      }
  };

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openNewSession = (day?: number) => {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day || new Date().getDate()).padStart(2, '0');
      
      setEditingSession({
          campaign_id: campaignId!,
          date: `${year}-${month}-${dayStr}`,
          summary: '',
          decisions: '',
          notes: '',
          next_hooks: ''
      });
      setModalOpen(true);
  };

  const openEditSession = (session: Session) => {
      // Navigate to SessionDetail page instead of opening modal
      navigate(`/campaign/${campaignId}/sessions/${session.id}`);
  };

  const saveSession = async () => {
      if (!editingSession.date || !campaignId) return;

      const payload = {
          ...editingSession,
          npcs_encountered: editingSession.npcs_encountered || [],
          locations_visited: editingSession.locations_visited || [],
          items_found: editingSession.items_found || [],
      } as Session;

      const result = payload.id
          ? await db.sessions.update(payload)
          : await db.sessions.add({ ...payload, id: generateId() });

      if (result.error) {
          showToast(`Failed to save session: ${result.error.message}`, 'error');
          return;
      }
      setModalOpen(false);
      loadSessions();
  };

  const confirmDelete = async () => {
      if (deleteSessionId) {
          const { error } = await db.sessions.delete(deleteSessionId);
          if (error) {
              showToast(`Failed to delete session: ${error.message}`, 'error');
              setDeleteSessionId(null);
              return;
          }
          setDeleteSessionId(null);
          setModalOpen(false);
          loadSessions();
      }
  };

  // Render Calendar Grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-32 bg-zinc-950/30 border border-zinc-900"></div>);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daysSessions = sessions.filter(s => s.date === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        days.push(
            <div
                key={day}
                className={`h-32 border border-zinc-800 p-2 relative group transition-colors ${isToday ? 'bg-indigo-900/10' : 'bg-zinc-950'}`}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-semibold ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>{day}</span>
                    {daysSessions.length === 0 && (
                        <button
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-500 hover:text-white transition-opacity"
                            aria-label={`Schedule session on ${dateStr}`}
                            onClick={() => openNewSession(day)}
                        >
                            <CalendarIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
                    {daysSessions.map(session => (
                        <button
                            type="button"
                            key={session.id}
                            onClick={() => openEditSession(session)}
                            aria-label={`Edit session on ${dateStr}: ${session.summary || 'No Summary'}`}
                            className="block w-full text-left text-xs p-1.5 rounded bg-zinc-800 border border-zinc-700 hover:border-indigo-500 hover:bg-zinc-700 focus:border-indigo-500 cursor-pointer transition-all"
                        >
                            <div className="font-semibold text-zinc-200 truncate">{session.summary || "No Summary"}</div>
                            {session.notes && <div className="text-[10px] text-zinc-400 truncate mt-0.5">{session.notes}</div>}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-500" />
            Sessions Calendar
        </h2>
        <Button onClick={() => openNewSession()}><CalendarIcon className="w-4 h-4 mr-2"/> Schedule Session</Button>
      </div>

      <Card className="p-0 overflow-hidden border-zinc-800">
          {/* Calendar Header */}
          <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5"/></button>
              <h3 className="text-xl font-bold text-zinc-100">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><ChevronRight className="w-5 h-5"/></button>
          </div>
          
          {/* Days Header */}
          <div className="grid grid-cols-7 bg-zinc-925 text-zinc-500 text-xs uppercase font-bold text-center py-2 border-b border-zinc-800">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 bg-zinc-900">
              {renderCalendar()}
          </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingSession.id ? "Edit Session" : "Schedule Session"}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input 
                    type="date" 
                    label="Date" 
                    value={editingSession.date || ''} 
                    onChange={e => setEditingSession({...editingSession, date: e.target.value})}
                />
                 {editingSession.id && (
                     <div className="flex items-end justify-end pb-2">
                        <button onClick={() => setDeleteSessionId(editingSession.id as string)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                            <Trash2 className="w-4 h-4"/> Delete Session
                        </button>
                     </div>
                 )}
            </div>

            <Textarea 
                label="Summary" 
                placeholder="Brief summary of what happened..." 
                value={editingSession.summary || ''} 
                onChange={e => setEditingSession({...editingSession, summary: e.target.value})}
            />

            <Textarea 
                label="DM Notes & Comments" 
                placeholder="Private notes, observations, or things to remember..." 
                className="font-mono text-zinc-300 bg-zinc-950/50"
                value={editingSession.notes || ''} 
                onChange={e => setEditingSession({...editingSession, notes: e.target.value})}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea 
                    label="Key Decisions" 
                    placeholder="Important choices the party made..." 
                    value={editingSession.decisions || ''} 
                    onChange={e => setEditingSession({...editingSession, decisions: e.target.value})}
                />
                <Textarea 
                    label="Next Session Hooks" 
                    placeholder="What immediate threads need to be picked up?" 
                    value={editingSession.next_hooks || ''} 
                    onChange={e => setEditingSession({...editingSession, next_hooks: e.target.value})}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={saveSession}>Save Session</Button>
            </div>
          </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Are you sure? This will permanently delete this session record."
      />
    </div>
  );
};
