
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, Map, Flag, Box, Swords, BookOpen, LogOut, Dices, Ghost, Menu, X, Settings, Trash2, ChevronDown, ChevronRight, Book } from 'lucide-react';
import { Campaign } from '../types';
import { DiceRoller } from './DiceRoller';
import { getCurrentUser, signOut, deleteAccount } from '../services/supabase';
import { ConfirmModal } from './ui';

interface LayoutProps {
  children: React.ReactNode;
  activeCampaign?: Campaign | null;
}

const DELETE_ACCOUNT_WARNING = "Are you absolutely sure you want to delete your account? This will permanently remove your authentication credentials. All campaign data will remain in the database but will become orphaned. This action cannot be undone.";

export const Layout: React.FC<LayoutProps> = ({ children, activeCampaign }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: campaignId } = useParams();
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCodexExpanded, setIsCodexExpanded] = useState(false);

  useEffect(() => {
    // Get current user for sidebar display
    getCurrentUser().then(user => {
        if(user && user.email) setUserEmail(user.email);
    });

    const handleOpenDiceRoller = () => setIsDiceRollerOpen(true);
    window.addEventListener('open-dice-roller', handleOpenDiceRoller);
    return () => window.removeEventListener('open-dice-roller', handleOpenDiceRoller);
  }, []);

  // Auto-expand Codex if on a codex route
  useEffect(() => {
    if (location.pathname.includes('/codex')) {
      setIsCodexExpanded(true);
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
      await signOut();
      window.location.reload(); // Force reload to trigger auth state check in App.tsx
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      // Redireciona para página inicial
      navigate('/');
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: `/campaign/${campaignId}` },
    { icon: User, label: 'Characters', path: `/campaign/${campaignId}/characters` },
    { icon: Users, label: 'NPCs', path: `/campaign/${campaignId}/npcs` },
    { icon: Ghost, label: 'Monsters', path: `/campaign/${campaignId}/monsters` },
    { icon: Map, label: 'Locations', path: `/campaign/${campaignId}/locations` },
    { icon: Flag, label: 'Factions', path: `/campaign/${campaignId}/factions` },
    { icon: Box, label: 'Items', path: `/campaign/${campaignId}/items` },
    { icon: Swords, label: 'Combat', path: `/campaign/${campaignId}/combat` },
    { icon: BookOpen, label: 'Sessions', path: `/campaign/${campaignId}/sessions` },
  ];

  const codexSubItems = [
    { label: 'Main Arc', path: `/campaign/${campaignId}/codex/main-arc` },
    { label: 'Major Plots', path: `/campaign/${campaignId}/codex/major-plots` },
    { label: 'World Lore', path: `/campaign/${campaignId}/codex/world-lore` },
    { label: 'Magic & Technology', path: `/campaign/${campaignId}/codex/magic-tech` },
    { label: 'Politics & Factions', path: `/campaign/${campaignId}/codex/politics-factions` },
    { label: 'Secrets of the World', path: `/campaign/${campaignId}/codex/secrets` },
    { label: 'Tone & Aesthetic', path: `/campaign/${campaignId}/codex/tone-aesthetic` },
    { label: 'World Timeline', path: `/campaign/${campaignId}/codex/world-timeline` },
    { label: 'Home Rules', path: `/campaign/${campaignId}/codex/home-rules` },
    { label: 'Notes & Scraps', path: `/campaign/${campaignId}/codex/notes` },
  ];

  const handleCodexClick = () => {
    if (!isCodexExpanded) {
      setIsCodexExpanded(true);
      navigate(`/campaign/${campaignId}/codex/main-arc`);
    } else {
      setIsCodexExpanded(!isCodexExpanded);
    }
  };

  // Helper to render navigation content to avoid duplication between Desktop and Mobile
  const renderNavContent = () => {
    const isCodexActive = location.pathname.includes('/codex');
    
    return (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/campaign/${campaignId}`}
              onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu on click
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-cinzel tracking-wide rounded-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-violet/10 text-violet-light border-l-2 border-violet shadow-[0_0_10px_-5px_rgba(110,81,163,0.5)]'
                    : 'text-silver/60 hover:bg-shadow hover:text-gold hover:border-l-2 hover:border-gold/50'
                }`
              }
            >
              <item.icon className="mr-3 h-4 w-4 flex-shrink-0 opacity-70" />
              {item.label}
            </NavLink>
          ))}
          
          {/* Codex Menu with Submenu */}
          <div className="py-1">
            <button
              onClick={handleCodexClick}
              className={`flex items-center w-full px-3 py-2 text-sm font-cinzel tracking-wide rounded-sm transition-all duration-300 ${
                isCodexActive
                  ? 'bg-violet/10 text-violet-light border-l-2 border-violet shadow-[0_0_10px_-5px_rgba(110,81,163,0.5)]'
                  : 'text-silver/60 hover:bg-shadow hover:text-gold hover:border-l-2 hover:border-gold/50'
              }`}
            >
              <Book className="mr-3 h-4 w-4 flex-shrink-0 opacity-70" />
              <span className="flex-1 text-left">Codex</span>
              {isCodexExpanded ? (
                <ChevronDown className="h-3 w-3 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 opacity-70" />
              )}
            </button>
            
            {/* Codex Submenu */}
            {isCodexExpanded && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-gold/10 pl-2">
                {codexSubItems.map((subItem) => (
                  <NavLink
                    key={subItem.path}
                    to={subItem.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-1.5 text-xs font-cinzel tracking-wide rounded-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-violet/10 text-violet-light border-l-2 border-violet'
                          : 'text-silver/50 hover:bg-shadow hover:text-gold hover:border-l-2 hover:border-gold/30'
                      }`
                    }
                  >
                    {subItem.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4 mt-4 border-t border-gold/10">
             <button
                onClick={() => { setIsDiceRollerOpen(!isDiceRollerOpen); setIsMobileMenuOpen(false); }}
                className={`flex items-center w-full px-3 py-2 text-sm font-cinzel tracking-wide rounded-sm transition-all ${isDiceRollerOpen ? 'bg-violet/10 text-violet-light border-l-2 border-violet' : 'text-silver/60 hover:bg-shadow hover:text-gold'}`}
              >
                <Dices className="mr-3 h-4 w-4 opacity-70" />
                Dice Roller
              </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gold/10 bg-shadow/30">
          <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-gold/30 flex items-center justify-center text-gold font-cinzel">
                  {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                  <p className="text-xs text-silver truncate max-w-[120px]">{userEmail}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Game Master</p>
              </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-3 py-2 text-xs font-cinzel font-medium rounded-sm text-silver/60 hover:text-white hover:bg-white/5 w-full transition-colors mb-1"
          >
             Exit Campaign
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-2 text-xs font-cinzel font-medium rounded-sm text-red-400/70 hover:text-red-400 hover:bg-red-950/20 w-full transition-colors mb-1"
          >
            <LogOut className="mr-3 h-3 w-3" />
            Sign Out
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center px-3 py-2 text-xs font-cinzel font-medium rounded-sm text-red-500/70 hover:text-red-500 hover:bg-red-950/30 w-full transition-colors border-t border-red-900/20 mt-1 pt-2"
          >
            <Trash2 className="mr-3 h-3 w-3" />
            Delete Account
          </button>
        </div>
    </>
  );
  };

  if (!campaignId) {
    return (
        <main className="min-h-screen bg-obsidian text-silver p-6 bg-vignette relative">
            <div className="absolute top-4 right-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{userEmail}</span>
                    <button onClick={handleSignOut} className="text-red-400 hover:text-red-300 text-xs uppercase font-bold border border-red-900/30 px-3 py-1 rounded bg-red-950/20">Sign Out</button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-400 text-xs uppercase font-bold border border-red-900/30 px-3 py-1 rounded bg-red-950/30 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Delete Account
                    </button>
                </div>
            </div>
            {children}
            
            {/* Delete Account Confirmation */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message={DELETE_ACCOUNT_WARNING}
                confirmText="Delete Account"
            />
        </main>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-obsidian text-silver relative bg-vignette">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-shadow border-b border-gold/20 sticky top-0 z-20">
         <div className="font-cinzel font-bold text-gold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5"/>
            <span className="truncate max-w-[200px] tracking-wider">{activeCampaign?.name || 'DM OS'}</span>
         </div>
         <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="text-silver hover:text-gold p-1 rounded hover:bg-white/5 transition-colors"
         >
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-gold/10 bg-shadow/40 backdrop-blur-sm hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-gold/10">
          <h1 className="text-xl font-cinzel font-bold tracking-widest text-gold truncate drop-shadow-sm">
            {activeCampaign?.name || 'DM OS'}
          </h1>
          <p className="text-[10px] text-twilight mt-1 uppercase tracking-[0.2em] font-bold">Lumen Regnum v1.0</p>
        </div>
        {renderNavContent()}
      </aside>

      {/* Mobile Menu Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex justify-end md:hidden">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-obsidian/90 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={() => setIsMobileMenuOpen(false)} 
            />
            
            {/* Drawer - Opens from Right */}
            <aside className="relative flex flex-col w-64 h-full bg-shadow border-l border-gold/20 shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center p-4 border-b border-gold/10">
                    <span className="font-cinzel font-bold text-gold tracking-wide">Menu</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-twilight hover:text-gold transition-colors">
                        <X className="w-6 h-6"/>
                    </button>
                </div>
                {renderNavContent()}
            </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen p-4 md:p-8 scroll-smooth">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* Global Dice Roller */}
      <DiceRoller isOpen={isDiceRollerOpen} onToggle={() => setIsDiceRollerOpen(!isDiceRollerOpen)} />
      
      {/* Delete Account Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message={DELETE_ACCOUNT_WARNING}
        confirmText="Delete Account"
      />
    </div>
  );
};
