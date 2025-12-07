import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, generateId } from '../services/store';
import { Session, SessionScene, UUID } from '../types';
import { Card, Button, Input, Textarea } from '../components/ui';
import { SceneCard } from '../components/SceneCard';
import { ArrowLeft, Plus, Save, FileText, BookOpen } from 'lucide-react';

export const SessionDetail: React.FC = () => {
  const { id: campaignId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [scenes, setScenes] = useState<SessionScene[]>([]);
  const [activeTab, setActiveTab] = useState<'prep' | 'log'>('prep');
  const [expandedScenes, setExpandedScenes] = useState<Set<UUID>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (sessionId) {
      loadSession();
      loadScenes();
    }
  }, [sessionId]);

  const loadSession = async () => {
    if (!campaignId) return;
    const sessions = await db.sessions.list(campaignId);
    const found = sessions.find(s => s.id === sessionId);
    if (found) {
      setSession(found);
    }
  };

  const loadScenes = async () => {
    if (!sessionId) return;
    const scenesList = await db.scenes.list(sessionId);
    setScenes(scenesList);
  };

  // Debounced autosave - keep reference stable
  const autosaveRef = React.useRef<((s: Session) => void) | null>(null);
  
  React.useEffect(() => {
    autosaveRef.current = debounce(async (sessionData: Session) => {
      setSaving(true);
      await db.sessions.update(sessionData);
      setSaving(false);
      setSaveMessage('Saved ✓');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 500);
  }, []);

  const handleSessionChange = (field: keyof Session, value: any) => {
    if (session) {
      const updated = { ...session, [field]: value };
      setSession(updated);
      if (autosaveRef.current) {
        autosaveRef.current(updated);
      }
    }
  };

  const handleAddScene = async () => {
    if (!sessionId) return;
    
    const newScene: SessionScene = {
      id: generateId(),
      session_id: sessionId,
      title: '',
      type: 'Other',
      description: '',
      objective: '',
      npcs: [],
      beats: [],
      branches: '',
      hooks: '',
      order_index: scenes.length,
    };

    await db.scenes.add(newScene);
    setScenes([...scenes, newScene]);
    setExpandedScenes(new Set([...expandedScenes, newScene.id]));
  };

  const handleUpdateScene = async (updatedScene: SessionScene) => {
    await db.scenes.update(updatedScene);
    setScenes(scenes.map(s => s.id === updatedScene.id ? updatedScene : s));
  };

  const handleDeleteScene = async (sceneId: UUID) => {
    if (!confirm('Delete this scene?')) return;
    await db.scenes.delete(sceneId);
    
    // Reindex remaining scenes (filter once and batch updates)
    const remainingScenes = scenes.filter(s => s.id !== sceneId);
    const reindexed = remainingScenes.map((s, idx) => ({ ...s, order_index: idx }));
    
    // Batch update reindexed scenes
    await Promise.all(reindexed.map(scene => db.scenes.update(scene)));
    setScenes(reindexed);
  };

  const toggleSceneExpand = (sceneId: UUID) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/campaign/${campaignId}/sessions`)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white font-cinzel">
              {session.title || `Session ${session.session_number ?? ''}`}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {new Date(session.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-zinc-500 animate-pulse">Saving...</span>}
          {saveMessage && <span className="text-sm text-green-400">{saveMessage}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('prep')}
          className={`px-4 py-2 font-cinzel font-semibold transition-colors border-b-2 ${
            activeTab === 'prep'
              ? 'border-gold text-gold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Prep
        </button>
        <button
          onClick={() => setActiveTab('log')}
          disabled
          className="px-4 py-2 font-cinzel font-semibold text-zinc-600 cursor-not-allowed border-b-2 border-transparent"
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Log <span className="text-xs ml-1">(Coming Soon)</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'prep' ? (
        <div className="space-y-8">
          {/* Session Overview */}
          <Card title="Session Overview">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Session Number"
                  type="number"
                  value={session.session_number ?? ''}
                  onChange={e => handleSessionChange('session_number', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
                <Input 
                  label="Session Title"
                  value={session.title ?? ''}
                  onChange={e => handleSessionChange('title', e.target.value)}
                  placeholder="e.g., The Forgotten Conflict"
                />
              </div>

              <Textarea 
                label="DM Goal (What you want to accomplish narratively)"
                value={session.goal_dm ?? ''}
                onChange={e => handleSessionChange('goal_dm', e.target.value)}
                placeholder="Your narrative objectives for this session..."
                rows={2}
              />

              <Textarea 
                label="Player Focus (What players should experience/discover)"
                value={session.focus_players ?? ''}
                onChange={e => handleSessionChange('focus_players', e.target.value)}
                placeholder="What should be memorable or important for players..."
                rows={2}
              />

              <Textarea 
                label="Synopsis (1-3 paragraphs of overall plan)"
                value={session.synopsis ?? ''}
                onChange={e => handleSessionChange('synopsis', e.target.value)}
                placeholder="High-level overview of the session flow..."
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea 
                  label="Expected Start State"
                  value={session.expected_start_state ?? ''}
                  onChange={e => handleSessionChange('expected_start_state', e.target.value)}
                  placeholder="Where/how does the session begin?"
                  rows={3}
                />
                <Textarea 
                  label="Expected End State"
                  value={session.expected_end_state ?? ''}
                  onChange={e => handleSessionChange('expected_end_state', e.target.value)}
                  placeholder="What should be resolved by the end?"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Scenes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white font-cinzel">Scenes</h2>
              <Button onClick={handleAddScene}>
                <Plus className="w-4 h-4 mr-2" /> Add Scene
              </Button>
            </div>

            {scenes.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-zinc-500 mb-4">No scenes yet</div>
                <Button onClick={handleAddScene}>
                  <Plus className="w-4 h-4 mr-2" /> Create First Scene
                </Button>
              </Card>
            ) : (
              <div className="space-y-0">
                {scenes.map(scene => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onUpdate={handleUpdateScene}
                    onDelete={handleDeleteScene}
                    isExpanded={expandedScenes.has(scene.id)}
                    onToggleExpand={() => toggleSceneExpand(scene.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="text-zinc-500">
            Session Log feature coming soon...
          </div>
        </Card>
      )}
    </div>
  );
};

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
