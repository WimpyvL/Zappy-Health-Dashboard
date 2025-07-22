/**
 * @fileoverview Comprehensive type definitions for the Dynamic Form System
 * Based on the enhanced form system from Zappy-Dashboard repository
 */

export type FieldType = 
  | 'text'
  | 'textarea' 
  | 'email'
  | 'tel'
  | 'number'
  | 'password'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'range'
  | 'color'
  | 'hidden'
  | 'section-header'
  | 'divider'
  | 'html-content'
  | 'signature'
  | 'rating'
  | 'matrix'
  | 'weight'
  | 'progress-rating'
  | 'progress-photo'
  | 'lab-upload';

export interface FieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: FieldOption[];
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  defaultValue?: any;
  
  // Layout properties
  width?: 'full' | 'half' | 'third' | 'quarter';
  order?: number;
  
  // Type-specific properties
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  accept?: string; // For file inputs
  multiple?: boolean;
  rows?: number; // For textarea
  
  // Advanced properties
  calculated?: {
    formula: string;
    dependencies: string[];
  };
  masked?: {
    pattern: string;
    placeholder: string;
  };
  
  // Medical-specific properties
  medicalCategory?: 'vital' | 'symptom' | 'medication' | 'allergy' | 'medical_history' | 'demographic';
  clinicalRelevance?: 'high' | 'medium' | 'low';
  
  // Custom properties
  customAttributes?: Record<string, any>;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  conditionalLogic?: ConditionalLogic[];
  order?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  
  // Progress tracking
  completionPercentage?: number;
  estimatedTime?: number; // in minutes
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Form structure
  sections: FormSection[];
  
  // Form configuration
  settings: {
    multiStep: boolean;
    showProgress: boolean;
    saveProgress: boolean;
    allowPartialSubmission: boolean;
    requireAuthentication: boolean;
    
    // Styling
    theme: 'default' | 'medical' | 'modern' | 'minimal';
    customCSS?: string;
    
    // Behavior
    submitButtonText: string;
    successMessage: string;
    errorMessage: string;
    
    // Integration
    webhookUrl?: string;
    emailNotifications?: {
      enabled: boolean;
      recipients: string[];
      template?: string;
    };
    
    // Medical specific
    medicalFormType?: 'intake' | 'assessment' | 'follow_up' | 'screening' | 'consent';
    clinicalWorkflow?: string;
  };
  
  // Metadata
  tags: string[];
  category: string;
  isTemplate: boolean;
  isPublished: boolean;
  
  // Analytics
  usage: {
    submissions: number;
    views: number;
    averageCompletionTime: number;
    dropoffRate: number;
  };
}

export interface FormSubmission {
  id: string;
  formId: string;
  formVersion: string;
  submittedAt: Date;
  submittedBy?: string;
  
  // Data
  data: Record<string, any>;
  metadata: {
    userAgent: string;
    ipAddress: string;
    completionTime: number;
    partialSubmission: boolean;
    deviceType: 'desktop' | 'tablet' | 'mobile';
  };
  
  // Processing
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedAt?: Date;
  processingErrors?: string[];
  
  // Medical specific
  patientId?: string;
  providerId?: string;
  consultationId?: string;
  clinicalPriority?: 'routine' | 'urgent' | 'emergency';
}

export interface FormValidationError {
  fieldId: string;
  fieldLabel: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
}

export interface FormBuilderState {
  schema: FormSchema;
  selectedField?: string;
  selectedSection?: string;
  isDirty: boolean;
  isPreviewMode: boolean;
  validationErrors: FormValidationError[];
  
  // Undo/Redo
  history: FormSchema[];
  historyIndex: number;
  
  // UI State
  collapsedSections: Set<string>;
  draggedField?: FormField;
}

export interface FormRenderProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onFieldChange?: (fieldId: string, value: any) => void;
  onSectionChange?: (sectionId: string) => void;
  isSubmitting?: boolean;
  showNavigation?: boolean;
  currentSection?: number;
  validationMode?: 'onSubmit' | 'onChange' | 'onBlur';
  
  // Customization
  theme?: string;
  customComponents?: Record<string, React.ComponentType<any>>;
  
  // Callbacks
  onValidationError?: (errors: FormValidationError[]) => void;
  onProgress?: (progress: { currentSection: number; totalSections: number; completionPercentage: number }) => void;
}

export interface DragItem {
  id: string;
  type: 'field' | 'section';
  fieldType?: FieldType;
  data?: FormField | FormSection;
}

export interface DropZone {
  id: string;
  type: 'section' | 'field';
  accepts: ('field' | 'section')[];
  index?: number;
  sectionId?: string;
}

// Form Template System
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: FormSchema;
  preview: string; // Base64 screenshot or URL
  tags: string[];
  isOfficial: boolean;
  downloads: number;
  rating: number;
  createdBy: string;
  createdAt: Date;
}

// Integration Types
export interface FormIntegration {
  id: string;
  formId: string;
  type: 'webhook' | 'email' | 'database' | 'api' | 'consultation';
  configuration: Record<string, any>;
  isActive: boolean;
  
  // Medical integrations
  clinicalSystem?: 'ehr' | 'pharmacy' | 'lab' | 'imaging';
  dataMapping?: Record<string, string>;
}

// Export/Import Types
export interface FormExport {
  version: string;
  exportedAt: Date;
  exportedBy: string;
  schema: FormSchema;
  submissions?: FormSubmission[];
  templates?: FormTemplate[];
}

export interface FormImportResult {
  success: boolean;
  formId?: string;
  errors?: string[];
  warnings?: string[];
  imported: {
    forms: number;
    templates: number;
    submissions: number;
  };
}
