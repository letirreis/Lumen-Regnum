
import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase';
import { Modal, Input, Button, ConfirmModal } from './ui';
import { Database, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

export const SupabaseSetup: React.FC = () => {
    const { t } = useI18n();
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
                    aria-label={t('setup.disconnectTitle')}
                    className="fixed bottom-4 left-4 z-50 p-2 text-zinc-600 hover:text-zinc-400 bg-zinc-900/50 rounded-full border border-zinc-800 hover:border-zinc-600 transition-colors"
                    title={t('setup.disconnectTitle')}
                >
                    <Database className="w-4 h-4" />
                </button>
                <ConfirmModal
                    isOpen={isResetConfirmOpen}
                    onClose={() => setResetConfirmOpen(false)}
                    onConfirm={handleReset}
                    title={t('setup.disconnectTitle')}
                    message={t('setup.disconnectMessage')}
                    confirmText={t('setup.disconnect')}
                />
            </>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={() => {}} title={t('setup.connectTitle')}>
            <div className="space-y-4">
                <div className="bg-indigo-900/20 p-4 rounded border border-indigo-900/50 text-indigo-200 text-sm">
                    <p className="font-bold mb-1">{t('setup.welcome')}</p>
                    <p>{t('setup.welcomeText')}</p>
                </div>
                
                <div className="space-y-4">
                    <Input 
                        label={t('setup.projectUrl')} 
                        placeholder="https://xyz.supabase.co" 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                    />
                    <Input 
                        label={t('setup.anonKey')} 
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5..." 
                        value={key} 
                        onChange={e => setKey(e.target.value)} 
                    />
                </div>

                <div className="text-xs text-zinc-500">
                    <p className="mb-2">{t('setup.howTo')}</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>{t('setup.step1')} <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">supabase.com</a></li>
                        <li>{t('setup.step2')}</li>
                        <li>{t('setup.step3')}</li>
                        <li>{t('setup.step4')}</li>
                    </ol>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={!url || !key}>{t('setup.connectRestart')}</Button>
                </div>
            </div>
        </Modal>
    );
};
