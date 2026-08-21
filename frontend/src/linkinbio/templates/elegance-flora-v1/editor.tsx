import React, { useState, useEffect } from 'react';
import type { TemplateEditorProps } from '../../types/template.types';
import HeaderEditor from './editor-panels/HeaderEditor';
import ActionsEditor from './editor-panels/ActionsEditor';
import ServicesEditor from './editor-panels/ServicesEditor';
import { User, Phone, Scissors } from 'lucide-react';

export const EleganceFloraV1Editor: React.FC<TemplateEditorProps> = (props) => {
  const [currentTab, setCurrentTab] = useState<'header' | 'actions' | 'services'>('header');

  // Dynamic tab switching based on preview canvas click
  useEffect(() => {
    if (props.activeSection === 'header')   setCurrentTab('header');
    if (props.activeSection === 'actions')  setCurrentTab('actions');
    if (props.activeSection === 'services') setCurrentTab('services');
  }, [props.activeSection]);

  const tabs = [
    { id: 'header' as const,   label: 'Header',   icon: User },
    { id: 'actions' as const,  label: 'Actions',  icon: Phone },
    { id: 'services' as const, label: 'Services', icon: Scissors },
  ];

  return (
    <div className="space-y-5">
      {/* Section Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface border border-border-main/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#736154] text-white shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-main hover:bg-surface/60'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Section Sub-Panel */}
      <div className="pt-1">
        {currentTab === 'header' && (
          <HeaderEditor
            creator={props.creator}
            theme={props.theme}
            onThemeChange={props.onThemeChange}
            onCreatorChange={props.onCreatorChange}
          />
        )}

        {currentTab === 'actions' && (
          <ActionsEditor
            theme={props.theme}
            onThemeChange={props.onThemeChange}
          />
        )}

        {currentTab === 'services' && (
          <ServicesEditor
            blocks={props.blocks}
            theme={props.theme}
            onThemeChange={props.onThemeChange}
            onBlockAdd={props.onBlockAdd}
            onBlockUpdate={props.onBlockUpdate}
            onBlockRemove={props.onBlockRemove}
            onBlockReorder={props.onBlockReorder}
          />
        )}
      </div>
    </div>
  );
};

export default EleganceFloraV1Editor;
