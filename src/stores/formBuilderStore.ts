/**
 * @fileoverview Zustand store for form builder state management
 * Based on the advanced form builder from Zappy-Dashboard
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { FormSchema, FormField, FormSection, FormBuilderState, FieldType } from '@/types/formTypes';
import { nanoid } from 'nanoid';

interface FormBuilderStore extends FormBuilderState {
  // Schema operations
  createNewForm: (title: string) => void;
  loadForm: (schema: FormSchema) => void;
  updateFormMetadata: (updates: Partial<FormSchema>) => void;
  
  // Section operations
  addSection: (title: string, description?: string) => void;
  updateSection: (sectionId: string, updates: Partial<FormSection>) => void;
  deleteSection: (sectionId: string) => void;
  moveSection: (sectionId: string, newIndex: number) => void;
  
  // Field operations
  addField: (sectionId: string, fieldType: FieldType, index?: number) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  deleteField: (fieldId: string) => void;
  moveField: (fieldId: string, targetSectionId: string, newIndex: number) => void;
  duplicateField: (fieldId: string) => void;
  
  // Selection
  selectField: (fieldId: string | undefined) => void;
  selectSection: (sectionId: string | undefined) => void;
  
  // UI State
  setPreviewMode: (enabled: boolean) => void;
  toggleSectionCollapse: (sectionId: string) => void;
  
  // History (Undo/Redo)
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Validation
  validateForm: () => void;
  
  // Import/Export
  exportForm: () => string;
  importForm: (jsonString: string) => boolean;
}

const createDefaultForm = (title: string): FormSchema => ({
  id: nanoid(),
  title,
  description: '',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'current-user', // This should come from auth context
  sections: [],
  settings: {
    multiStep: false,
    showProgress: true,
    saveProgress: true,
    allowPartialSubmission: false,
    requireAuthentication: false,
    theme: 'default',
    submitButtonText: 'Submit',
    successMessage: 'Form submitted successfully!',
    errorMessage: 'Please fix the errors and try again.',
  },
  tags: [],
  category: 'general',
  isTemplate: false,
  isPublished: false,
  usage: {
    submissions: 0,
    views: 0,
    averageCompletionTime: 0,
    dropoffRate: 0,
  },
});

const createDefaultField = (type: FieldType): FormField => {
  const baseField: FormField = {
    id: nanoid(),
    type,
    label: getDefaultLabel(type),
    placeholder: getDefaultPlaceholder(type),
    required: false,
    disabled: false,
    readonly: false,
    width: 'full',
    order: 0,
  };

  // Add type-specific defaults
  switch (type) {
    case 'select':
    case 'multiselect':
    case 'radio':
    case 'checkbox':
      baseField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
      break;
    case 'number':
    case 'range':
      baseField.min = 0;
      baseField.max = 100;
      break;
    case 'textarea':
      baseField.rows = 4;
      break;
    case 'file':
      baseField.accept = '*';
      break;
  }

  return baseField;
};

const getDefaultLabel = (type: FieldType): string => {
  const labels: Record<FieldType, string> = {
    text: 'Text Input',
    textarea: 'Text Area',
    email: 'Email Address',
    tel: 'Phone Number',
    number: 'Number',
    password: 'Password',
    url: 'Website URL',
    date: 'Date',
    'datetime-local': 'Date and Time',
    time: 'Time',
    select: 'Dropdown',
    multiselect: 'Multi-Select',
    radio: 'Radio Buttons',
    checkbox: 'Checkboxes',
    file: 'File Upload',
    range: 'Range Slider',
    color: 'Color Picker',
    hidden: 'Hidden Field',
    'section-header': 'Section Header',
    divider: 'Divider',
    'html-content': 'HTML Content',
    signature: 'Digital Signature',
    rating: 'Rating',
    matrix: 'Matrix/Grid',
  };
  return labels[type] || 'Field';
};

const getDefaultPlaceholder = (type: FieldType): string => {
  const placeholders: Record<string, string> = {
    text: 'Enter text...',
    textarea: 'Enter your message...',
    email: 'example@email.com',
    tel: '+1 (555) 123-4567',
    number: '0',
    password: 'Enter password...',
    url: 'https://example.com',
    date: 'mm/dd/yyyy',
    time: 'hh:mm',
  };
  return placeholders[type] || '';
};

export const useFormBuilderStore = create<FormBuilderStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        schema: createDefaultForm('New Form'),
        selectedField: undefined,
        selectedSection: undefined,
        isDirty: false,
        isPreviewMode: false,
        validationErrors: [],
        history: [],
        historyIndex: -1,
        collapsedSections: new Set(),
        draggedField: undefined,

        // Schema operations
        createNewForm: (title: string) => {
          set((state) => {
            state.schema = createDefaultForm(title);
            state.selectedField = undefined;
            state.selectedSection = undefined;
            state.isDirty = false;
            state.validationErrors = [];
            state.history = [structuredClone(state.schema)];
            state.historyIndex = 0;
          });
        },

        loadForm: (schema: FormSchema) => {
          set((state) => {
            state.schema = schema;
            state.selectedField = undefined;
            state.selectedSection = undefined;
            state.isDirty = false;
            state.validationErrors = [];
            state.history = [structuredClone(schema)];
            state.historyIndex = 0;
          });
        },

        updateFormMetadata: (updates: Partial<FormSchema>) => {
          set((state) => {
            Object.assign(state.schema, updates);
            state.schema.updatedAt = new Date();
            state.isDirty = true;
          });
        },

        // Section operations
        addSection: (title: string, description?: string) => {
          set((state) => {
            const newSection: FormSection = {
              id: nanoid(),
              title,
              description: description || '',
              fields: [],
              order: state.schema.sections.length,
            };
            state.schema.sections.push(newSection);
            state.selectedSection = newSection.id;
            state.isDirty = true;
          });
          get().saveToHistory();
        },

        updateSection: (sectionId: string, updates: Partial<FormSection>) => {
          set((state) => {
            const section = state.schema.sections.find(s => s.id === sectionId);
            if (section) {
              Object.assign(section, updates);
              state.isDirty = true;
            }
          });
        },

        deleteSection: (sectionId: string) => {
          set((state) => {
            state.schema.sections = state.schema.sections.filter(s => s.id !== sectionId);
            if (state.selectedSection === sectionId) {
              state.selectedSection = undefined;
            }
            state.isDirty = true;
          });
          get().saveToHistory();
        },

        moveSection: (sectionId: string, newIndex: number) => {
          set((state) => {
            const sections = state.schema.sections;
            const currentIndex = sections.findIndex(s => s.id === sectionId);
            if (currentIndex === -1) return;

            const [moved] = sections.splice(currentIndex, 1);
            sections.splice(newIndex, 0, moved);

            // Update order property
            sections.forEach((section, index) => {
              section.order = index;
            });

            state.isDirty = true;
          });
        },

        // Field operations
        addField: (sectionId: string, fieldType: FieldType, index?: number) => {
          set((state) => {
            const section = state.schema.sections.find(s => s.id === sectionId);
            if (!section) return;

            const newField = createDefaultField(fieldType);
            newField.order = index ?? section.fields.length;

            if (index !== undefined) {
              section.fields.splice(index, 0, newField);
              // Update order for subsequent fields
              section.fields.forEach((field, i) => {
                field.order = i;
              });
            } else {
              section.fields.push(newField);
            }

            state.selectedField = newField.id;
            state.isDirty = true;
          });
          get().saveToHistory();
        },

        updateField: (fieldId: string, updates: Partial<FormField>) => {
          set((state) => {
            for (const section of state.schema.sections) {
              const field = section.fields.find(f => f.id === fieldId);
              if (field) {
                Object.assign(field, updates);
                state.isDirty = true;
                break;
              }
            }
          });
        },

        deleteField: (fieldId: string) => {
          set((state) => {
            for (const section of state.schema.sections) {
              const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
              if (fieldIndex !== -1) {
                section.fields.splice(fieldIndex, 1);
                // Update order for remaining fields
                section.fields.forEach((field, i) => {
                  field.order = i;
                });
                break;
              }
            }
            if (state.selectedField === fieldId) {
              state.selectedField = undefined;
            }
            state.isDirty = true;
          });
          get().saveToHistory();
        },

        moveField: (fieldId: string, targetSectionId: string, newIndex: number) => {
          set((state) => {
            // Find and remove field from current section
            let field: FormField | undefined;
            for (const section of state.schema.sections) {
              const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
              if (fieldIndex !== -1) {
                [field] = section.fields.splice(fieldIndex, 1);
                // Update order for remaining fields
                section.fields.forEach((f, i) => {
                  f.order = i;
                });
                break;
              }
            }

            if (!field) return;

            // Add field to target section
            const targetSection = state.schema.sections.find(s => s.id === targetSectionId);
            if (targetSection) {
              targetSection.fields.splice(newIndex, 0, field);
              // Update order for all fields in target section
              targetSection.fields.forEach((f, i) => {
                f.order = i;
              });
            }

            state.isDirty = true;
          });
        },

        duplicateField: (fieldId: string) => {
          set((state) => {
            for (const section of state.schema.sections) {
              const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
              if (fieldIndex !== -1) {
                const field = section.fields[fieldIndex];
                const duplicated = {
                  ...structuredClone(field),
                  id: nanoid(),
                  label: `${field.label} (Copy)`,
                };
                section.fields.splice(fieldIndex + 1, 0, duplicated);
                // Update order for subsequent fields
                section.fields.forEach((f, i) => {
                  f.order = i;
                });
                state.selectedField = duplicated.id;
                break;
              }
            }
            state.isDirty = true;
          });
          get().saveToHistory();
        },

        // Selection
        selectField: (fieldId: string | undefined) => {
          set((state) => {
            state.selectedField = fieldId;
            state.selectedSection = undefined;
          });
        },

        selectSection: (sectionId: string | undefined) => {
          set((state) => {
            state.selectedSection = sectionId;
            state.selectedField = undefined;
          });
        },

        // UI State
        setPreviewMode: (enabled: boolean) => {
          set((state) => {
            state.isPreviewMode = enabled;
            if (enabled) {
              state.selectedField = undefined;
              state.selectedSection = undefined;
            }
          });
        },

        toggleSectionCollapse: (sectionId: string) => {
          set((state) => {
            if (state.collapsedSections.has(sectionId)) {
              state.collapsedSections.delete(sectionId);
            } else {
              state.collapsedSections.add(sectionId);
            }
          });
        },

        // History
        saveToHistory: () => {
          set((state) => {
            const currentSchema = structuredClone(state.schema);
            state.history = state.history.slice(0, state.historyIndex + 1);
            state.history.push(currentSchema);
            state.historyIndex = state.history.length - 1;
            
            // Limit history size
            if (state.history.length > 50) {
              state.history = state.history.slice(-50);
              state.historyIndex = state.history.length - 1;
            }
          });
        },

        undo: () => {
          const { history, historyIndex } = get();
          if (historyIndex > 0) {
            set((state) => {
              state.historyIndex--;
              state.schema = structuredClone(state.history[state.historyIndex]);
              state.selectedField = undefined;
              state.selectedSection = undefined;
              state.isDirty = true;
            });
          }
        },

        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            set((state) => {
              state.historyIndex++;
              state.schema = structuredClone(state.history[state.historyIndex]);
              state.selectedField = undefined;
              state.selectedSection = undefined;
              state.isDirty = true;
            });
          }
        },

        canUndo: () => {
          const { historyIndex } = get();
          return historyIndex > 0;
        },

        canRedo: () => {
          const { history, historyIndex } = get();
          return historyIndex < history.length - 1;
        },

        // Validation
        validateForm: () => {
          set((state) => {
            const errors = [];
            
            // Basic validation
            if (!state.schema.title.trim()) {
              errors.push({
                fieldId: 'form-title',
                fieldLabel: 'Form Title',
                message: 'Form title is required',
                severity: 'error' as const,
                type: 'required'
              });
            }

            if (state.schema.sections.length === 0) {
              errors.push({
                fieldId: 'form-sections',
                fieldLabel: 'Form Sections',
                message: 'Form must have at least one section',
                severity: 'error' as const,
                type: 'required'
              });
            }

            // Check for sections without fields
            state.schema.sections.forEach(section => {
              if (section.fields.length === 0) {
                errors.push({
                  fieldId: section.id,
                  fieldLabel: section.title,
                  message: 'Section must have at least one field',
                  severity: 'warning' as const,
                  type: 'empty_section'
                });
              }
            });

            state.validationErrors = errors;
          });
        },

        // Import/Export
        exportForm: () => {
          const { schema } = get();
          return JSON.stringify({
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            schema,
          }, null, 2);
        },

        importForm: (jsonString: string) => {
          try {
            const data = JSON.parse(jsonString);
            if (data.schema) {
              get().loadForm(data.schema);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        },
      })),
      {
        name: 'form-builder-store',
      }
    )
  )
);

// Selector hooks for optimized subscriptions
export const useFormSchema = () => useFormBuilderStore(state => state.schema);
export const useSelectedField = () => useFormBuilderStore(state => state.selectedField);
export const useSelectedSection = () => useFormBuilderStore(state => state.selectedSection);
export const useFormValidation = () => useFormBuilderStore(state => state.validationErrors);
export const useFormHistory = () => useFormBuilderStore(state => ({
  canUndo: state.canUndo(),
  canRedo: state.canRedo(),
  undo: state.undo,
  redo: state.redo,
}));