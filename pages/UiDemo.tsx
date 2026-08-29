import React, { useState } from 'react';
import { Card, Button } from '../components/ui';
import { Sparkles, Heart, Zap } from 'lucide-react';

/**
 * UiDemo - Demonstration page for polished UI components
 * 
 * Showcases:
 * - Card component with fancy gradient borders
 * - Button component with Framer Motion animations
 * - Loading states
 * - Different variants and sizes
 */

export const UiDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(0);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-obsidian p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-cinzel font-bold text-gold mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8" />
            UI Component Demo
            <Sparkles className="w-8 h-8" />
          </h1>
          <p className="text-white/60 font-sans">
            Polished Card and Button components with Tailwind CSS and Framer Motion
          </p>
        </div>

        {/* Card Examples */}
        <section>
          <h2 className="text-2xl font-cinzel font-semibold text-violet-light mb-6">
            Card Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Card */}
            <Card title="Basic Card">
              <p className="text-white/80 leading-relaxed">
                This is a basic card with a fancy gradient border. 
                Hover to see the border glow effect.
              </p>
            </Card>

            {/* Card with Action */}
            <Card 
              title="With Action" 
              action={<Button size="sm" variant="secondary">Edit</Button>}
            >
              <p className="text-white/80 leading-relaxed">
                Cards can have action buttons in the header for quick interactions.
              </p>
            </Card>

            {/* Clickable Card */}
            <Card 
              title="Clickable Card" 
              onClick={() => setCounter(counter + 1)}
            >
              <div className="space-y-2">
                <p className="text-white/80">
                  This card is clickable. Try clicking it!
                </p>
                <div className="text-gold font-cinzel">
                  Clicks: {counter}
                </div>
              </div>
            </Card>

            {/* Card with Icon */}
            <Card title="Character Stats">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Strength</span>
                  <span className="text-gold font-semibold">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Dexterity</span>
                  <span className="text-gold font-semibold">14</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Constitution</span>
                  <span className="text-gold font-semibold">16</span>
                </div>
              </div>
            </Card>

            {/* Rich Content Card */}
            <Card 
              title="Quest: The Ancient Tome" 
              action={<Button size="sm" variant="primary">Accept</Button>}
            >
              <div className="space-y-2">
                <p className="text-white/80 text-sm leading-relaxed">
                  Seek the legendary tome in the depths of the Shadowveil Library.
                </p>
                <div className="flex items-center gap-2 text-xs text-violet-light">
                  <Zap className="w-3 h-3" />
                  <span>Reward: 500 XP</span>
                </div>
              </div>
            </Card>

            {/* Status Card */}
            <Card title="Campaign Status">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white/70 text-sm">Active Campaign</span>
                </div>
                <div className="text-xs text-white/50">
                  Last session: 2 days ago
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Button Examples */}
        <section>
          <h2 className="text-2xl font-cinzel font-semibold text-violet-light mb-6">
            Button Components
          </h2>
          
          <Card title="Button Variants & Sizes">
            <div className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">Primary Variant</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="sm">Small Button</Button>
                  <Button variant="primary" size="md">Medium Button</Button>
                  <Button variant="primary" size="lg">Large Button</Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">Secondary Variant</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm">Small Button</Button>
                  <Button variant="secondary" size="md">Medium Button</Button>
                  <Button variant="secondary" size="lg">Large Button</Button>
                </div>
              </div>

              {/* Danger Buttons */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">Danger Variant</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="danger" size="sm">Delete</Button>
                  <Button variant="danger" size="md">Remove Item</Button>
                  <Button variant="danger" size="lg">Destroy Campaign</Button>
                </div>
              </div>

              {/* Ghost Buttons */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">Ghost Variant</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" size="sm">Cancel</Button>
                  <Button variant="ghost" size="md">Dismiss</Button>
                  <Button variant="ghost" size="lg">Skip</Button>
                </div>
              </div>

              {/* Loading State */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">Loading State</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="primary" 
                    loading={loading}
                    onClick={handleLoadingClick}
                  >
                    {loading ? 'Saving...' : 'Click to Test Loading'}
                  </Button>
                  <Button variant="secondary" loading={true}>
                    Always Loading
                  </Button>
                </div>
              </div>

              {/* With Icons */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">With Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">
                    <Heart className="w-4 h-4 mr-2" />
                    Favorite
                  </Button>
                  <Button variant="secondary">
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Action
                  </Button>
                  <Button variant="danger">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Cast Spell
                  </Button>
                </div>
              </div>

              {/* Disabled State */}
              <div>
                <h3 className="text-sm font-cinzel text-gold mb-3">Disabled State</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" disabled>Disabled Primary</Button>
                  <Button variant="secondary" disabled>Disabled Secondary</Button>
                  <Button variant="danger" disabled>Disabled Danger</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Interactive Example */}
        <section>
          <h2 className="text-2xl font-cinzel font-semibold text-violet-light mb-6">
            Interactive Example
          </h2>
          
          <Card title="Create New Campaign">
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                Experience the smooth animations and polished feel of the new components.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-cinzel text-gold mb-2 uppercase tracking-widest">
                    Campaign Name
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter campaign name..."
                    className="w-full px-3 py-2 bg-obsidian border border-twilight/50 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-cinzel text-gold mb-2 uppercase tracking-widest">
                    Game System
                  </label>
                  <select className="w-full px-3 py-2 bg-obsidian border border-twilight/50 rounded-lg text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors">
                    <option>D&D 5e</option>
                    <option>Pathfinder</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-white/40 text-sm pt-8">
          <p>Hover over buttons to see the scale animation. Click them to feel the press effect.</p>
          <p className="mt-2">All components use Tailwind CSS and Framer Motion for smooth, polished interactions.</p>
        </div>
      </div>
    </div>
  );
};

export default UiDemo;
