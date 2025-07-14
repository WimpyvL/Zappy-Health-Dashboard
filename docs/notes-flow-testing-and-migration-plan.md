# Notes Flow Testing and Migration Plan

This document outlines the testing strategy, migration plan, and timeline for implementing the new notes flow system.

## Testing Strategy

### 1. Unit Testing (Week 5)

#### 1.1 Type Validation Tests

Create unit tests for the type validation functions to ensure data integrity:

```typescript
// src/__tests__/types/notesFlow.test.ts

import { validateConsultationTemplate, validateProcessedTemplate } from '../../types/notesFlow.validators';

describe('ConsultationTemplate validation', () => {
  test('validates a valid consultation template', () => {
    const template = {
      id: 'template-1',
      name: 'Weight Management Initial',
      description: 'Template for weight management initial consultations',
      category: 'weight_management',
      type: 'consultation',
      encounterType: 'initial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      sections: [
        {
          id: 'section-1',
          sectionType: 'patient_info',
          title: 'Patient History',
          content: 'Patient reports [HISTORY]',
          placeholders: ['[HISTORY]'],
          visibilityRule: 'shared',
          order: 1,
          isRequired: true
        }
      ]
    };
    
    expect(validateConsultationTemplate(template)).toBe(true);
  });
  
  test('rejects invalid consultation template', () => {
    const template = {
      id: 'template-1',
      name: 'Weight Management Initial',
      // Missing required fields
      type: 'consultation',
      sections: []
    };
    
    expect(() => validateConsultationTemplate(template)).toThrow();
  });
});
```

#### 1.2 Data Transformation Tests

Test the data transformation functions to ensure proper processing:

```typescript
// src/__tests__/apis/noteTemplates/api.test.js

import { processTemplate, generatePatientView, simplifyLanguage } from '../../../apis/noteTemplates/api';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis()
  }
}));

describe('Template API', () => {
  test('processTemplate replaces placeholders correctly', async () => {
    // Mock data
    const mockTemplate = {
      id: 'template-1',
      name: 'Test Template',
      template_sections: [
        {
          id: 'section-1',
          section_type: 'patient_info',
          title: 'Patient Info',
          content: 'Hello [PATIENT_NAME], your appointment was on [CONSULTATION_DATE].',
          visibility_rule: 'shared',
          order_index: 1,
          is_required: true
        }
      ]
    };
    
    const mockPatient = { id: 'patient-1', name: 'John Doe' };
    const mockConsultation = { 
      id: 'consult-1', 
      provider_name: 'Dr. Smith',
      created_at: '2025-06-10T12:00:00Z'
    };
    
    // Setup mocks
    supabase.from().select().eq().single
      .mockImplementationOnce(() => Promise.resolve({ data: mockTemplate, error: null }))
      .mockImplementationOnce(() => Promise.resolve({ data: mockPatient, error: null }))
      .mockImplementationOnce(() => Promise.resolve({ data: mockConsultation, error: null }))
      .mockImplementationOnce(() => Promise.resolve({ data: { id: 'processed-1' }, error: null }));
    
    // Call function
    const result = await processTemplate('template-1', 'patient-1', 'consult-1');
    
    // Assertions
    expect(result.sections[0].processedContent).toContain('Hello John Doe');
    expect(result.sections[0].processedContent).toContain('your appointment was on');
  });
  
  test('simplifyLanguage replaces medical terms with simpler alternatives', () => {
    const medicalText = 'Patient has hypertension and dyslipidemia. Take medication prn.';
    const simplifiedText = simplifyLanguage(medicalText);
    
    expect(simplifiedText).toContain('high blood pressure');
    expect(simplifiedText).toContain('high cholesterol');
    expect(simplifiedText).toContain('as needed');
  });
});
```

#### 1.3 State Management Tests

Test the state management actions and reducers:

```javascript
// src/__tests__/hooks/useConsultationState.test.js

import { consultationReducer, ACTIONS } from '../../hooks/useConsultationState';

describe('consultationReducer', () => {
  test('SET_SELECTED_TEMPLATE action updates state correctly', () => {
    const initialState = {
      selectedTemplate: null,
      otherState: 'value'
    };
    
    const template = { id: 'template-1', name: 'Test Template' };
    const action = { type: ACTIONS.SET_SELECTED_TEMPLATE, payload: template };
    
    const newState = consultationReducer(initialState, action);
    
    expect(newState.selectedTemplate).toEqual(template);
    expect(newState.otherState).toEqual('value'); // Other state preserved
  });
  
  test('SET_SECTION_VISIBILITY action updates visibility correctly', () => {
    const initialState = {
      sectionVisibility: {
        patientHistory: 'shared',
        assessment: 'shared'
      }
    };
    
    const action = { 
      type: ACTIONS.SET_SECTION_VISIBILITY, 
      payload: { section: 'patientHistory', visibility: 'provider_only' } 
    };
    
    const newState = consultationReducer(initialState, action);
    
    expect(newState.sectionVisibility.patientHistory).toEqual('provider_only');
    expect(newState.sectionVisibility.assessment).toEqual('shared'); // Unchanged
  });
});
```

### 2. Integration Testing (Week 6)

#### 2.1 API Endpoint Tests

Test the API endpoints with mock data:

```javascript
// src/__tests__/apis/noteTemplates/integration.test.js

import { createTemplate, processTemplate, generatePatientView } from '../../../apis/noteTemplates/api';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
jest.mock('../../../lib/supabase');

describe('Template API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('createTemplate creates template and sections', async () => {
    // Setup mocks
    supabase.from().insert().select().single
      .mockResolvedValueOnce({ data: { id: 'template-1' }, error: null });
    
    supabase.from().insert()
      .mockResolvedValueOnce({ error: null });
    
    supabase.from().select().eq().single
      .mockResolvedValueOnce({ 
        data: { 
          id: 'template-1', 
          template_sections: [{ id: 'section-1' }] 
        }, 
        error: null 
      });
    
    // Call function
    const template = {
      name: 'Test Template',
      description: 'Test Description',
      category: 'test',
      type: 'consultation',
      encounterType: 'initial',
      sections: [
        {
          sectionType: 'patient_info',
          title: 'Patient Info',
          content: 'Test content',
          visibilityRule: 'shared'
        }
      ]
    };
    
    const result = await createTemplate(template);
    
    // Assertions
    expect(result.id).toEqual('template-1');
    expect(supabase.from).toHaveBeenCalledWith('note_templates');
    expect(supabase.from).toHaveBeenCalledWith('template_sections');
  });
  
  // Additional integration tests...
});
```

#### 2.2 Template Processing Tests

Test the template processing with sample templates:

```javascript
// src/__tests__/apis/noteTemplates/processing.test.js

import { processTemplate } from '../../../apis/noteTemplates/api';
import { mockTemplateData, mockPatientData, mockConsultationData } from '../../mocks/data';

// Mock API calls
jest.mock('../../../apis/noteTemplates/api', () => ({
  ...jest.requireActual('../../../apis/noteTemplates/api'),
  getTemplateById: jest.fn(),
}));

import { getTemplateById } from '../../../apis/noteTemplates/api';

describe('Template Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('processes weight management template correctly', async () => {
    // Setup mocks
    getTemplateById.mockResolvedValueOnce(mockTemplateData.weightManagement);
    
    // Mock Supabase responses
    supabase.from().select().eq().single
      .mockImplementationOnce(() => Promise.resolve({ data: mockPatientData.weightManagement, error: null }))
      .mockImplementationOnce(() => Promise.resolve({ data: mockConsultationData.initial, error: null }))
      .mockImplementationOnce(() => Promise.resolve({ data: { id: 'processed-1' }, error: null }));
    
    // Call function
    const result = await processTemplate(
      'weight-management-template', 
      'patient-1', 
      'consult-1',
      { selectedServices: ['wm'] }
    );
    
    // Assertions
    expect(result.sections.length).toEqual(mockTemplateData.weightManagement.template_sections.length);
    expect(result.sections[0].processedContent).toContain(mockPatientData.weightManagement.name);
    expect(result.sections[0].processedContent).not.toContain('[PATIENT_NAME]');
  });
});
```

#### 2.3 AI Recommendation Tests

Test AI recommendation generation:

```javascript
// src/__tests__/apis/ai/summaryService.test.js

import { generateAIRecommendations } from '../../../apis/ai/summaryService';
import { generateIntakeSummary, generateAssessment, generatePlan } from '../../../apis/ai/summaryService';

// Mock the underlying functions
jest.mock('../../../apis/ai/summaryService', () => ({
  ...jest.requireActual('../../../apis/ai/summaryService'),
  generateIntakeSummary: jest.fn(),
  generateAssessment: jest.fn(),
  generatePlan: jest.fn(),
}));

describe('AI Recommendation Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('generates and formats recommendations correctly', async () => {
    // Setup mocks
    supabase.from().select().eq().single
      .mockResolvedValueOnce({ data: { id: 'form-1', data: {} }, error: null })
      .mockResolvedValueOnce({ data: { id: 'ai-rec-1' }, error: null });
    
    generateIntakeSummary.mockResolvedValueOnce({
      recommendations: [{ text: 'Semaglutide 0.25mg weekly', confidence: 95 }],
      reasoning: 'Patient has obesity'
    });
    
    generateAssessment.mockResolvedValueOnce('Patient has BMI of 32.5');
    generatePlan.mockResolvedValueOnce('Start Semaglutide 0.25mg weekly');
    
    // Call function
    const result = await generateAIRecommendations(
      'form-1',
      'patient-1',
      'consult-1',
      'weight_management',
      'initial'
    );
    
    // Assertions
    expect(result.sections.length).toEqual(3);
    expect(result.sections[0].sectionType).toEqual('summary');
    expect(result.sections[1].sectionType).toEqual('assessment');
    expect(result.sections[2].sectionType).toEqual('plan');
    expect(result.sections[0].recommendations[0].text).toEqual('Semaglutide 0.25mg weekly');
  });
});
```

### 3. UI Testing (Week 7)

#### 3.1 Component Tests

Test the new UI components:

```jsx
// src/__tests__/components/consultation-notes/TemplateSelector.test.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateSelector from '../../../pages/consultations/components/consultation-notes/TemplateSelector';

describe('TemplateSelector', () => {
  const mockTemplates = [
    { id: 'template-1', name: 'Template 1' },
    { id: 'template-2', name: 'Template 2' }
  ];
  
  const mockOnSelect = jest.fn();
  
  test('renders template options correctly', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedId=""
        onSelect={mockOnSelect}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('Select a template...')).toBeInTheDocument();
    expect(screen.getByText('Template 1')).toBeInTheDocument();
    expect(screen.getByText('Template 2')).toBeInTheDocument();
  });
  
  test('calls onSelect when template is selected', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedId=""
        onSelect={mockOnSelect}
        isLoading={false}
      />
    );
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'template-1' } });
    
    expect(mockOnSelect).toHaveBeenCalledWith('template-1');
  });
  
  test('shows loading indicator when isLoading is true', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedId=""
        onSelect={mockOnSelect}
        isLoading={true}
      />
    );
    
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
```

#### 3.2 Integration with InitialConsultationNotes

Test the integration with the main component:

```jsx
// src/__tests__/pages/consultations/InitialConsultationNotes.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import InitialConsultationNotes from '../../../pages/consultations/InitialConsultationNotes';
import { useNoteTemplates, useProcessTemplate } from '../../../apis/noteTemplates/hooks';

// Mock hooks
jest.mock('../../../apis/noteTemplates/hooks', () => ({
  useNoteTemplates: jest.fn(),
  useProcessTemplate: jest.fn(),
  useGenerateAIRecommendations: jest.fn(),
  useGeneratePatientView: jest.fn()
}));

jest.mock('../../../hooks/useConsultationState', () => ({
  useConsultationState: jest.fn()
}));

import { useConsultationState } from '../../../hooks/useConsultationState';

describe('InitialConsultationNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useNoteTemplates
    useNoteTemplates.mockReturnValue({
      templates: [
        { id: 'template-1', name: 'Template 1' },
        { id: 'template-2', name: 'Template 2' }
      ],
      loading: false
    });
    
    // Mock useProcessTemplate
    useProcessTemplate.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        sections: [
          {
            sectionType: 'patient_info',
            processedContent: 'Processed patient history'
          }
        ]
      }),
      isLoading: false
    });
    
    // Mock useConsultationState
    useConsultationState.mockReturnValue({
      state: {
        patientHistory: 'Initial history',
        assessment: 'Initial assessment',
        patientMessage: 'Initial message',
        selectedServices: ['wm'],
        sectionVisibility: {
          patientHistory: 'shared',
          assessment: 'shared'
        }
      },
      actions: {
        setSelectedTemplate: jest.fn(),
        setProcessedTemplate: jest.fn(),
        setPatientHistory: jest.fn(),
        setAssessment: jest.fn(),
        setPatientMessage: jest.fn(),
        setSectionVisibility: jest.fn()
      }
    });
  });
  
  test('renders template selector', () => {
    render(
      <MemoryRouter initialEntries={['/consultations/123']}>
        <Route path="/consultations/:consultationId">
          <InitialConsultationNotes />
        </Route>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Note Template')).toBeInTheDocument();
    expect(screen.getByText('Select a template...')).toBeInTheDocument();
  });
  
  test('processes template when selected', async () => {
    const { actions } = useConsultationState();
    const { mutateAsync } = useProcessTemplate();
    
    render(
      <MemoryRouter initialEntries={['/consultations/123']}>
        <Route path="/consultations/:consultationId">
          <InitialConsultationNotes />
        </Route>
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'template-1' } });
    
    await waitFor(() => {
      expect(actions.setSelectedTemplate).toHaveBeenCalled();
      expect(mutateAsync).toHaveBeenCalled();
      expect(actions.setProcessedTemplate).toHaveBeenCalled();
      expect(actions.setPatientHistory).toHaveBeenCalled();
    });
  });
  
  test('changes section visibility', () => {
    const { actions } = useConsultationState();
    
    render(
      <MemoryRouter initialEntries={['/consultations/123']}>
        <Route path="/consultations/:consultationId">
          <InitialConsultationNotes />
        </Route>
      </MemoryRouter>
    );
    
    // Find the visibility dropdown for patient history
    const visibilityDropdown = screen.getAllByRole('combobox')[1]; // First is template selector
    
    fireEvent.change(visibilityDropdown, { target: { value: 'provider_only' } });
    
    expect(actions.setSectionVisibility).toHaveBeenCalledWith('patientHistory', 'provider_only');
  });
});
```

### 4. End-to-End Testing (Week 8)

#### 4.1 Complete Flow Testing

Test the complete flow from intake form to patient view:

```javascript
// cypress/integration/notes-flow.spec.js

describe('Notes Flow', () => {
  beforeEach(() => {
    cy.login('provider@example.com', 'password');
    cy.visit('/consultations');
  });
  
  it('completes the full notes flow process', () => {
    // Create a new consultation
    cy.contains('New Consultation').click();
    cy.get('[data-testid="patient-search"]').type('John Doe');
    cy.contains('John Doe').click();
    cy.contains('Start Consultation').click();
    
    // Select a template
    cy.get('#template-select').select('Weight Management Initial');
    cy.contains('Processed patient history').should('be.visible');
    
    // Set section visibility
    cy.contains('Section Visibility').should('be.visible');
    cy.get('select').contains('Patient History').parent().select('Shared');
    
    // Generate AI recommendations
    cy.contains('AI Compose').click();
    cy.contains('AI is composing').should('be.visible');
    cy.contains('Use This History').click();
    
    // Edit assessment
    cy.contains('Assessment & Plan').parent().contains('Edit').click();
    cy.get('textarea').clear().type('Updated assessment and plan');
    cy.contains('Save').click();
    
    // Generate patient view
    cy.contains('Generate Patient View').click();
    cy.contains('Patient view generated successfully').should('be.visible');
    
    // Verify patient view
    cy.visit('/patients/john-doe');
    cy.contains('Consultations').click();
    cy.contains('View Notes').click();
    cy.contains('Your Medical History').should('be.visible');
    cy.contains('Processed patient history').should('be.visible');
  });
  
  it('handles different template types correctly', () => {
    // Create a new consultation
    cy.contains('New Consultation').click();
    cy.get('[data-testid="patient-search"]').type('Jane Smith');
    cy.contains('Jane Smith').click();
    cy.contains('Start Consultation').click();
    
    // Select a service template
    cy.get('#template-select').select('ED Initial Consultation');
    
    // Verify service-specific content
    cy.contains('ED').should('be.visible');
    cy.contains('Sildenafil').should('be.visible');
    
    // Complete consultation
    cy.contains('Complete Consultation').click();
    cy.contains('Consultation completed successfully').should('be.visible');
  });
});
```

#### 4.2 Different Template Types Testing

Test with different template types:

```javascript
// cypress/integration/template-types.spec.js

describe('Template Types', () => {
  beforeEach(() => {
    cy.login('provider@example.com', 'password');
    cy.visit('/templates');
  });
  
  it('creates and uses a consultation template', () => {
    // Create new consultation template
    cy.contains('New Template').click();
    cy.get('#template-type').select('Consultation');
    cy.get('#template-name').type('Custom Consultation Template');
    cy.get('#template-category').select('General');
    cy.get('#template-encounter-type').select('Initial');
    
    // Add sections
    cy.contains('Add Section').click();
    cy.get('#section-type').select('Patient Info');
    cy.get('#section-title').type('Patient Background');
    cy.get('#section-content').type('Patient [PATIENT_NAME] reports the following history: [HISTORY]');
    cy.get('#section-visibility').select('Shared');
    cy.contains('Save Section').click();
    
    // Save template
    cy.contains('Save Template').click();
    cy.contains('Template created successfully').should('be.visible');
    
    // Use the template
    cy.visit('/consultations');
    cy.contains('New Consultation').click();
    cy.get('[data-testid="patient-search"]').type('John Doe');
    cy.contains('John Doe').click();
    cy.contains('Start Consultation').click();
    
    cy.get('#template-select').select('Custom Consultation Template');
    cy.contains('Patient John Doe reports the following history').should('be.visible');
  });
  
  it('creates and uses a service template', () => {
    // Create new service template
    cy.contains('New Template').click();
    cy.get('#template-type').select('Service');
    cy.get('#template-name').type('Custom Service Template');
    cy.get('#template-category').select('Weight Management');
    cy.get('#template-service-id').select('wm');
    
    // Add content
    cy.get('#template-content').type('This service includes GLP-1 medications for [DURATION]');
    
    // Save template
    cy.contains('Save Template').click();
    cy.contains('Template created successfully').should('be.visible');
    
    // Use the template
    cy.visit('/consultations');
    cy.contains('New Consultation').click();
    cy.get('[data-testid="patient-search"]').type('John Doe');
    cy.contains('John Doe').click();
    cy.contains('Start Consultation').click();
    
    cy.contains('Weight Management').click();
    cy.contains('This service includes GLP-1 medications for').should('be.visible');
  });
});
```

## Migration Strategy

### Phase 1: Database Setup (Week 1)

1. Create new database tables
   - Run migration scripts to create note_templates, template_sections, processed_templates, ai_recommendations, and patient_views tables
   - Verify table creation with database inspection tools

2. Seed initial templates
   - Create script to seed initial templates for common use cases
   - Include weight management, ED, and general templates
   - Verify seeding with database queries

### Phase 2: API Implementation (Weeks 2-3)

1. Implement new API endpoints
   - Create template API endpoints
   - Enhance AI service with new functions
   - Create patient view generation endpoints
   - Test endpoints with Postman or similar tool

2. Create mock implementations
   - Implement mock versions of AI services for development
   - Create fallback mechanisms for database unavailability
   - Test mock implementations with unit tests

### Phase 3: UI Integration (Weeks 4-5)

1. Implement UI components
   - Create template selector component
   - Create visibility controls component
   - Update existing card components to support visibility
   - Test components in isolation

2. Integrate with InitialConsultationNotes
   - Update InitialConsultationNotes to use new components
   - Enhance useConsultationState with template support
   - Test integration with mock data

### Phase 4: Testing and Refinement (Weeks 6-8)

1. Comprehensive testing
   - Run unit tests for all new components
   - Run integration tests for API endpoints
   - Run UI tests for component interactions
   - Run end-to-end tests for complete flows

2. Performance optimization
   - Identify and fix performance bottlenecks
   - Optimize database queries
   - Implement caching where appropriate
   - Test performance with realistic data volumes

### Phase 5: Deployment (Week 9)

1. Staging deployment
   - Deploy to staging environment
   - Run smoke tests
   - Verify all functionality works as expected
   - Get feedback from test users

2. Production deployment
   - Deploy to production environment
   - Monitor for errors
   - Provide support for initial users
   - Collect feedback for future improvements

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | Data Model | Create type definitions, database migrations, seed initial data |
| 2 | API Implementation | Create template API, enhance AI service |
| 3 | API Implementation | Update template hooks, create patient view generation |
| 4 | UI Integration | Enhance useConsultationState, add template selection UI |
| 5 | UI Integration | Add visibility controls, update InitialConsultationNotes |
| 6 | Testing | Unit testing, integration testing |
| 7 | Testing | UI testing, component testing |
| 8 | Testing | End-to-end testing, performance optimization |
| 9 | Deployment | Staging deployment, production deployment |

## Risk Mitigation

1. **Database Migration Risks**
   - **Risk**: Data loss during migration
   - **Mitigation**: Create backup before migration, run migrations in transaction, have rollback plan

2. **API Integration Risks**
   - **Risk**: Breaking changes to existing API consumers
   - **Mitigation**: Version APIs, maintain backward compatibility, provide migration guides

3. **UI Integration Risks**
   - **Risk**: Regression in existing functionality
   - **Mitigation**: Comprehensive test coverage, feature flags for gradual rollout

4. **Performance Risks**
   - **Risk**: Slow performance with large templates or complex processing
   - **Mitigation**: Performance testing with realistic data, optimization of critical paths

5. **User Adoption Risks**
   - **Risk**: Users struggle with new template system
   - **Mitigation**: Provide training, create documentation, collect feedback early