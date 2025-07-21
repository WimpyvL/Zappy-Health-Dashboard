/**
 * @fileoverview Main Form Builder component with drag-and-drop interface
 * Based on the advanced form builder from Zappy-Dashboard repository
 */

'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Save, 
  Upload, 
  Download, 
  Undo, 
  Redo,
  Settings,
  Layers,
  Palette,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormBuilderStore, useFormSchema, useFormHistory } from '@/stores/formBuilderStore';
import { FieldType } from '@/types/formTypes';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { PropertyPanel } from './PropertyPanel';
import { FormPreview } from './FormPreview';
import { FormSettings } from './FormSettings';
import { cn } from '@/lib/utils';

interface FormBuilderProps {
  formId?: string;
  onSave?: (schema: any) => Promise<void>;
  onPublish?: (schema: any) => Promise<void>;
  className?: string;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  formId,
  onSave,
  onPublish,
  className
}) => {
  const [activeTab, setActiveTab] = useState('build');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const schema = useFormSchema();
  const { canUndo, canRedo, undo, redo } = useFormHistory();
  const {
    isPreviewMode,
    isDirty,
    setPreviewMode,
    addSection,
    addField,
    moveField,
    moveSection,
    saveToHistory,
    validateForm,
    exportForm,
    importForm,
  } = useFormBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggedItem(active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedItem(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle field creation from palette
    if (activeData?.type === 'palette-field' && overData?.type === 'section') {
      addField(overData.sectionId, activeData.fieldType);
      saveToHistory();
    }

    // Handle field moving between sections
    if (activeData?.type === 'field' && overData?.type === 'section') {
      const fieldId = activeData.fieldId;
      const targetSectionId = overData.sectionId;
      const newIndex = overData.index || 0;
      
      moveField(fieldId, targetSectionId, newIndex);
      saveToHistory();
    }

    // Handle section reordering
    if (activeData?.type === 'section' && overData?.type === 'section') {
      const activeSectionId = activeData.sectionId;
      const overSectionId = overData.sectionId;
      
      const activeIndex = schema.sections.findIndex(s => s.id === activeSectionId);
      const overIndex = schema.sections.findIndex(s => s.id === overSectionId);
      
      if (activeIndex !== overIndex) {
        moveSection(activeSectionId, overIndex);
        saveToHistory();
      }
    }

    setDraggedItem(null);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      validateForm();
      await onSave(schema);
    } catch (error) {
      console.error('Failed to save form:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importForm(content)) {
        // Success feedback
        console.log('Form imported successfully');
      } else {
        // Error feedback
        console.error('Failed to import form');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const jsonString = exportForm();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.title.replace(/\s+/g, '-').toLowerCase()}-form.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDeviceClass = () => {
    switch (deviceView) {
      case 'tablet':
        return 'max-w-2xl';
      case 'mobile':
        return 'max-w-sm';
      default:
        return 'max-w-full';
    }
  };

  return (
    <div className={cn('h-screen flex flex-col bg-gray-50', className)}>
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {schema.title || 'Untitled Form'}
            </h1>
            {isDirty && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Undo/Redo */}
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="w-4 h-4" />
            </Button>

            {/* Import/Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>

            {/* Preview Toggle */}
            <Button
              variant={isPreviewMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              )}
            </Button>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={isSaving || !onSave}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Device View Toggle (Preview Mode) */}
        {isPreviewMode && (
          <div className="flex items-center justify-center mt-4 space-x-2">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {!isPreviewMode ? (
            <>
              {/* Left Sidebar - Field Palette */}
              <div className="w-80 border-r bg-white overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 m-4">
                    <TabsTrigger value="build" className="flex items-center">
                      <Plus className="w-4 h-4 mr-1" />
                      Build
                    </TabsTrigger>
                    <TabsTrigger value="style" className="flex items-center">
                      <Palette className="w-4 h-4 mr-1" />
                      Style
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="build" className="h-full p-4 pt-0">
                      <FieldPalette />
                    </TabsContent>
                    <TabsContent value="style" className="h-full p-4 pt-0">
                      <div className="text-center text-gray-500 mt-8">
                        Style customization coming soon
                      </div>
                    </TabsContent>
                    <TabsContent value="settings" className="h-full p-4 pt-0">
                      <FormSettings />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Main Canvas */}
              <div className="flex-1 flex">
                <div className="flex-1 overflow-auto p-6">
                  <FormCanvas />
                </div>

                {/* Right Sidebar - Properties */}
                <div className="w-80 border-l bg-white overflow-y-auto">
                  <PropertyPanel />
                </div>
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="flex-1 flex justify-center overflow-auto p-6">
              <div className={cn('w-full transition-all duration-300', getDeviceClass())}>
                <FormPreview />
              </div>
            </div>
          )}

          {/* Drag Overlay */}
          <DragOverlay>
            {draggedItem && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.05 }}
                className="bg-white border border-blue-200 rounded-lg p-3 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">
                    {draggedItem.label || draggedItem.fieldType || 'Item'}
                  </span>
                </div>
              </motion.div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default FormBuilder;