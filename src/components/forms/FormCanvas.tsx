/**
 * @fileoverview Form Canvas component - Main editing area for form sections and fields
 * Based on the advanced form builder from Zappy-Dashboard repository
 */

'use client';

import React from 'react';
import {
  useDroppable,
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Grip, 
  Edit2, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  ChevronUp,
  ChevronDown,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFormBuilderStore, useFormSchema } from '@/stores/formBuilderStore';
import { FormField, FormSection, FieldType } from '@/types/formTypes';
import { ConditionalRules } from '@/lib/form-validation';
import { cn } from '@/lib/utils';

interface SortableFieldProps {
  field: FormField;
  sectionId: string;
  index: number;
  isSelected: boolean;
  formData?: Record<string, any>;
}

const SortableField: React.FC<SortableFieldProps> = ({ 
  field, 
  sectionId, 
  index, 
  isSelected,
  formData = {}
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      fieldId: field.id,
      sectionId,
      index,
    },
  });

  const { 
    selectField, 
    updateField, 
    deleteField, 
    duplicateField 
  } = useFormBuilderStore();

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : '',
    transition,
  };

  const shouldShow = ConditionalRules.shouldShowField(field, formData);
  const isRequired = ConditionalRules.shouldRequireField(field, formData);
  const isDisabled = ConditionalRules.shouldDisableField(field, formData);

  const getFieldIcon = (type: FieldType) => {
    const iconClass = "w-4 h-4";
    // This could be expanded with proper icons for each field type
    return <div className={cn(iconClass, "bg-gray-300 rounded")} />;
  };

  if (!shouldShow && !isSelected) {
    return null;
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group relative border rounded-lg bg-white transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        isDragging && 'shadow-lg opacity-50',
        !shouldShow && 'opacity-50 border-dashed'
      )}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Grip className="w-4 h-4 text-gray-400" />
      </div>

      {/* Field Content */}
      <div
        className="p-4 pl-10 cursor-pointer"
        onClick={() => selectField(field.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {getFieldIcon(field.type)}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{field.label}</span>
                {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                {isDisabled && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                {!shouldShow && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {field.type} • ID: {field.id.slice(0, 8)}
              </div>
              {field.helpText && (
                <div className="text-xs text-gray-600 mt-1 italic">
                  {field.helpText}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                duplicateField(field.id);
              }}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteField(field.id);
              }}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Preview of field */}
        <div className="mt-3 p-2 bg-gray-50 rounded border text-sm">
          <FieldPreview field={field} value={formData[field.id]} />
        </div>
      </div>
    </motion.div>
  );
};

interface FieldPreviewProps {
  field: FormField;
  value?: any;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({ field, value }) => {
  const getPreviewContent = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
      case 'password':
        return (
          <Input
            placeholder={field.placeholder}
            disabled
            defaultValue={value}
            className="pointer-events-none"
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled
            rows={field.rows || 3}
            defaultValue={value}
            className="pointer-events-none"
          />
        );
      case 'select':
        return (
          <div className="border rounded px-3 py-2 bg-white text-gray-500">
            {field.options?.[0]?.label || 'Select an option...'}
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-1">
            {field.options?.slice(0, 2).map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-3 h-3 border rounded-full"></div>
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
            {(field.options?.length || 0) > 2 && (
              <div className="text-xs text-gray-500">
                +{(field.options?.length || 0) - 2} more options
              </div>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-1">
            {field.options?.slice(0, 2).map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-3 h-3 border rounded"></div>
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
            {(field.options?.length || 0) > 2 && (
              <div className="text-xs text-gray-500">
                +{(field.options?.length || 0) - 2} more options
              </div>
            )}
          </div>
        );
      case 'number':
      case 'range':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            disabled
            min={field.min}
            max={field.max}
            defaultValue={value}
            className="pointer-events-none"
          />
        );
      case 'date':
      case 'datetime-local':
      case 'time':
        return (
          <Input
            type={field.type}
            disabled
            defaultValue={value}
            className="pointer-events-none"
          />
        );
      case 'file':
        return (
          <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500">
            Click to upload {field.accept ? `(${field.accept})` : ''}
          </div>
        );
      case 'section-header':
        return (
          <div>
            <h3 className="text-lg font-semibold">{field.label}</h3>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
          </div>
        );
      case 'divider':
        return <hr className="border-gray-300" />;
      case 'html-content':
        return (
          <div className="border rounded p-2 bg-yellow-50 text-xs text-gray-600">
            HTML Content Block
          </div>
        );
      default:
        return (
          <div className="text-gray-500 text-sm">
            {field.type} field preview
          </div>
        );
    }
  };

  return (
    <div>
      {field.type !== 'section-header' && field.type !== 'divider' && field.type !== 'html-content' && (
        <Label className="text-xs font-medium mb-1 block">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {getPreviewContent()}
      {field.helpText && field.type !== 'section-header' && (
        <div className="text-xs text-gray-500 mt-1">{field.helpText}</div>
      )}
    </div>
  );
};

interface DroppableSectionProps {
  section: FormSection;
  isCollapsed: boolean;
  formData?: Record<string, any>;
}

const DroppableSection: React.FC<DroppableSectionProps> = ({ 
  section, 
  isCollapsed,
  formData = {}
}) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: section.id,
    data: {
      type: 'section',
      sectionId: section.id,
    },
  });

  const {
    selectedField,
    selectSection,
    updateSection,
    deleteSection,
    addField,
    toggleSectionCollapse,
  } = useFormBuilderStore();

  const handleAddField = (fieldType: FieldType) => {
    addField(section.id, fieldType);
  };

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        'mb-6 transition-all duration-200',
        isOver && 'ring-2 ring-blue-300 bg-blue-50'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSectionCollapse(section.id)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => selectSection(section.id)}
            >
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSection(section.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          <SortableContext
            items={section.fields.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              <AnimatePresence>
                {section.fields.map((field, index) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    index={index}
                    isSelected={selectedField === field.id}
                    formData={formData}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>

          {/* Add Field Buttons */}
          <div className="mt-4 p-3 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Add a field:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddField('text')}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddField('select')}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Select
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddField('textarea')}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Textarea
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddField('checkbox')}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Checkbox
              </Button>
            </div>
          </div>

          {/* Drop zone indicator */}
          {isOver && (
            <div className="mt-3 p-4 border-2 border-blue-300 border-dashed rounded-lg bg-blue-50">
              <p className="text-blue-600 text-center text-sm">Drop field here</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const FormCanvas: React.FC = () => {
  const schema = useFormSchema();
  const { 
    collapsedSections,
    addSection,
    selectSection,
  } = useFormBuilderStore();

  const handleAddSection = () => {
    addSection('New Section', 'Add a description for this section');
  };

  if (schema.sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start building your form
          </h3>
          <p className="text-gray-500 mb-6">
            Add sections and fields to create your form. You can drag and drop fields from the palette.
          </p>
          <Button onClick={handleAddSection}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Section
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{schema.title}</h2>
        {schema.description && (
          <p className="text-gray-600">{schema.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {schema.sections.map((section: FormSection) => (
          <DroppableSection
            key={section.id}
            section={section}
            isCollapsed={collapsedSections.has(section.id)}
          />
        ))}
      </div>

      {/* Add Section Button */}
      <div className="mt-8 text-center">
        <Button 
          variant="outline" 
          onClick={handleAddSection}
          className="border-dashed border-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  );
};

export default FormCanvas;