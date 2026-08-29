
import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase';
import { Modal, Input, Button, ConfirmModal } from './ui';
import { Database, Settings } from 'lucide-react';

export const SupabaseSetup: React.FC = () => {
    const [isConfigured, setIsConfigured] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);

    useEffect(() => {
        const configured = isSupabaseConfigured();
        setIsConfigured(configured);
        if (!configured) {
            setIsOpen(true);
        }
    }, []);

    const handleSave = () => {
        if (url && key) {
            saveSupabaseConfig(url, key);
        }
    };

    const handleReset = () => {
        clearSupabaseConfig();
    }

    if (isConfigured) {
        return (
            <>
                <button
                    onClick={() => setResetConfirmOpen(true)}
                    aria-label="Disconnect database"
                    className="fixed bottom-4 left-4 z-50 p-2 text-zinc-600 hover:text-zinc-400 bg-zinc-900/50 rounded-full border border-zinc-800 hover:border-zinc-600 transition-colors"
                    title="Disconnect Database"
                >
                    <Database className="w-4 h-4" />
                </button>
                <ConfirmModal
                    isOpen={isResetConfirmOpen}
                    onClose={() => setResetConfirmOpen(false)}
                    onConfirm={handleReset}
                    title="Disconnect Database"
                    message="Are you sure you want to disconnect? This will clear stored credentials."
                    confirmText="Disconnect"
                />
            </>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={() => {}} title="Connect to Database">
            <div className="space-y-4">
                <div className="bg-indigo-900/20 p-4 rounded border border-indigo-900/50 text-indigo-200 text-sm">
                    <p className="font-bold mb-1">Welcome to DM OS!</p>
                    <p>To persist your campaign data, please connect your Supabase project.</p>
                </div>
                
                <div className="space-y-4">
                    <Input 
                        label="Project URL" 
                        placeholder="https://xyz.supabase.co" 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                    />
                    <Input 
                        label="Anon Public Key" 
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5..." 
                        value={key} 
                        onChange={e => setKey(e.target.value)} 
                    />
                </div>

                <div className="text-xs text-zinc-500">
                    <p className="mb-2">How to get these:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Create a project at <a href="https://supabase.com" target="_blank" className="text-indigo-400 underline">supabase.com</a></li>
                        <li>Run the SQL setup script in the SQL Editor.</li>
                        <li>Go to Project Settings &gt; API.</li>
                        <li>Copy the URL and anon/public Key.</li>
                    </ol>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={!url || !key}>Connect & Restart</Button>
                </div>
            </div>
        </Modal>
    );
};
