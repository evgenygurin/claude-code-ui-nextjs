'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Palette,
  Monitor,
  Moon,
  Sun,
  Code,
  Terminal,
  Bell,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Save,
  User,
  Key,
  Database,
  Wifi,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

const settingSections: SettingsSection[] = [
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel',
  },
  {
    id: 'editor',
    title: 'Editor',
    icon: Code,
    description: 'Code editor preferences',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    icon: Terminal,
    description: 'Terminal configuration',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Notification settings',
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    description: 'Security and privacy',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Wifi,
    description: 'External services',
  },
];

export default function SettingsPanel() {
  const [activeSection, setActiveSection] = useState('appearance');
  const [settings, setSettings] = useState({
    theme: 'dark',
    accentColor: 'blue',
    fontSize: 14,
    fontFamily: 'Monaco',
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: true,
    terminalShell: 'bash',
    terminalFontSize: 12,
    notifications: true,
    soundEffects: false,
    autoSave: true,
    apiKeys: {
      claude: '',
      openai: '',
    },
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, any>),
        [key]: value,
      },
    }));
  };

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateSetting('theme', value)}
              className={`
                flex items-center gap-3 p-4 rounded-lg border text-left transition-all
                ${settings.theme === value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-accent'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Accent Color</h3>
        <div className="flex gap-2">
          {['blue', 'purple', 'pink', 'green', 'orange'].map((color) => (
            <button
              key={color}
              onClick={() => updateSetting('accentColor', color)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                ${settings.accentColor === color ? 'border-foreground scale-110' : 'border-transparent'}
              `}
              style={{ backgroundColor: `var(--${color}-500)` }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Font Size: {settings.fontSize}px
        </label>
        <input
          type="range"
          min="10"
          max="20"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderEditorSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Font Family</label>
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="Monaco">Monaco</option>
          <option value="Menlo">Menlo</option>
          <option value="Ubuntu Mono">Ubuntu Mono</option>
          <option value="Consolas">Consolas</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Tab Size: {settings.tabSize}
        </label>
        <input
          type="range"
          min="2"
          max="8"
          value={settings.tabSize}
          onChange={(e) => updateSetting('tabSize', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        {[
          { key: 'wordWrap', label: 'Word Wrap' },
          { key: 'lineNumbers', label: 'Line Numbers' },
          { key: 'minimap', label: 'Minimap' },
          { key: 'autoSave', label: 'Auto Save' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings[key as keyof typeof settings] as boolean}
              onChange={(e) => updateSetting(key, e.target.checked)}
              className="w-4 h-4 rounded border border-input"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderTerminalSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Default Shell</label>
        <select
          value={settings.terminalShell}
          onChange={(e) => updateSetting('terminalShell', e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="bash">Bash</option>
          <option value="zsh">Zsh</option>
          <option value="fish">Fish</option>
          <option value="powershell">PowerShell</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Terminal Font Size: {settings.terminalFontSize}px
        </label>
        <input
          type="range"
          min="10"
          max="18"
          value={settings.terminalFontSize}
          onChange={(e) => updateSetting('terminalFontSize', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => updateSetting('notifications', e.target.checked)}
            className="w-4 h-4 rounded border border-input"
          />
          <span>Enable Notifications</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.soundEffects}
            onChange={(e) => updateSetting('soundEffects', e.target.checked)}
            className="w-4 h-4 rounded border border-input"
          />
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Sound Effects</span>
          </div>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Keys
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Claude API Key</label>
            <input
              type="password"
              value={settings.apiKeys.claude}
              onChange={(e) => updateNestedSetting('apiKeys', 'claude', e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={settings.apiKeys.openai}
              onChange={(e) => updateNestedSetting('apiKeys', 'openai', e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium mb-4">Data Management</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="w-4 h-4" />
            Export Settings
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Upload className="w-4 h-4" />
            Import Settings
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-orange-500">
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">External Services</h3>
        <div className="space-y-4">
          {[
            { name: 'GitHub', status: 'connected', color: 'green' },
            { name: 'GitLab', status: 'disconnected', color: 'gray' },
            { name: 'Vercel', status: 'connected', color: 'green' },
            { name: 'Netlify', status: 'disconnected', color: 'gray' },
          ].map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full bg-${service.color}-500`} />
                <span className="font-medium">{service.name}</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {service.status}
                </span>
              </div>
              <Button variant="outline" size="sm">
                {service.status === 'connected' ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'appearance':
        return renderAppearanceSettings();
      case 'editor':
        return renderEditorSettings();
      case 'terminal':
        return renderTerminalSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'integrations':
        return renderIntegrationsSettings();
      default:
        return renderAppearanceSettings();
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card/30 backdrop-blur-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
        </div>
        
        <nav className="p-2">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                  ${activeSection === section.id 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent/50'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-medium">{section.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {settingSections.find(s => s.id === activeSection)?.title}
              </h1>
              <p className="text-muted-foreground">
                {settingSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {renderCurrentSection()}

            <div className="flex justify-end gap-3 pt-8 border-t mt-8">
              <Button variant="outline">
                Cancel
              </Button>
              <Button className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}