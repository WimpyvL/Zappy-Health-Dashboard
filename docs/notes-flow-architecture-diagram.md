# Notes Flow System: Architecture Diagram

This document provides visual diagrams of the Notes Flow System architecture, showing the data flow between components and the overall system structure.

## Data Flow Diagram

```mermaid
flowchart TD
    %% Main Components
    IntakeForms[Intake Forms] --> FormData[(Form Data)]
    FormData --> AIService{AI Service}
    FormData --> TemplateProcessor{Template Processor}
    
    %% Template Management
    TemplateDB[(Template Database)] --> TemplateProcessor
    TemplateSelector[Template Selector UI] --> TemplateProcessor
    
    %% AI Processing
    AIService --> AIRecommendations[(AI Recommendations)]
    AIRecommendations --> ConsultationNotes[Consultation Notes UI]
    
    %% Template Processing
    TemplateProcessor --> ProcessedTemplate[(Processed Template)]
    ProcessedTemplate --> ConsultationNotes
    
    %% Consultation Notes
    ConsultationNotes --> SavedNotes[(Saved Notes)]
    VisibilityControls[Visibility Controls UI] --> ConsultationNotes
    
    %% Patient View Generation
    SavedNotes --> PatientViewGenerator{Patient View Generator}
    VisibilityRules[(Visibility Rules)] --> PatientViewGenerator
    
    %% Final Outputs
    PatientViewGenerator --> PatientView[(Patient View)]
    PatientView --> PatientPortal[Patient Portal]
    SavedNotes --> ProviderDashboard[Provider Dashboard]
    
    %% Styling
    classDef database fill:#f9f,stroke:#333,stroke-width:2px
    classDef service fill:#bbf,stroke:#33f,stroke-width:2px
    classDef ui fill:#bfb,stroke:#3f3,stroke-width:2px
    classDef data fill:#fbb,stroke:#f33,stroke-width:2px
    
    class IntakeForms,TemplateSelector,VisibilityControls,ConsultationNotes,PatientPortal,ProviderDashboard ui
    class AIService,TemplateProcessor,PatientViewGenerator service
    class FormData,AIRecommendations,ProcessedTemplate,SavedNotes,PatientView,VisibilityRules data
    class TemplateDB database
```

## Component Architecture

```mermaid
flowchart TB
    %% Main Layers
    subgraph UI["UI Layer"]
        TemplateSelector[Template Selector]
        VisibilityControls[Visibility Controls]
        ConsultationNotes[Consultation Notes]
        AIPanel[AI Panel]
    end
    
    subgraph API["API Layer"]
        TemplateAPI[Template API]
        AIServiceAPI[AI Service API]
        PatientViewAPI[Patient View API]
    end
    
    subgraph Data["Data Layer"]
        TemplateDB[(Template Database)]
        ProcessedTemplateDB[(Processed Template DB)]
        AIRecommendationsDB[(AI Recommendations DB)]
        PatientViewDB[(Patient View DB)]
    end
    
    %% Connections between layers
    TemplateSelector --> TemplateAPI
    VisibilityControls --> PatientViewAPI
    ConsultationNotes --> TemplateAPI
    ConsultationNotes --> AIServiceAPI
    ConsultationNotes --> PatientViewAPI
    AIPanel --> AIServiceAPI
    
    TemplateAPI --> TemplateDB
    TemplateAPI --> ProcessedTemplateDB
    AIServiceAPI --> AIRecommendationsDB
    PatientViewAPI --> PatientViewDB
    PatientViewAPI --> ProcessedTemplateDB
    
    %% External Systems
    IntakeForms[Intake Forms] --> AIServiceAPI
    PatientViewDB --> PatientPortal[Patient Portal]
    
    %% Styling
    classDef ui fill:#bfb,stroke:#3f3,stroke-width:2px
    classDef api fill:#bbf,stroke:#33f,stroke-width:2px
    classDef db fill:#f9f,stroke:#333,stroke-width:2px
    classDef external fill:#fbb,stroke:#f33,stroke-width:2px
    
    class TemplateSelector,VisibilityControls,ConsultationNotes,AIPanel ui
    class TemplateAPI,AIServiceAPI,PatientViewAPI api
    class TemplateDB,ProcessedTemplateDB,AIRecommendationsDB,PatientViewDB db
    class IntakeForms,PatientPortal external
```

## Data Model Relationships

```mermaid
erDiagram
    NOTE_TEMPLATES ||--o{ TEMPLATE_SECTIONS : contains
    NOTE_TEMPLATES {
        uuid id PK
        string name
        string description
        string category
        string type
        string encounter_type
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    TEMPLATE_SECTIONS {
        uuid id PK
        uuid template_id FK
        string section_type
        string title
        string content
        jsonb placeholders
        string visibility_rule
        int order_index
        boolean is_required
        jsonb patient_filter_rules
    }
    
    PROCESSED_TEMPLATES ||--o{ PROCESSED_SECTIONS : contains
    PROCESSED_TEMPLATES {
        uuid id PK
        uuid template_id FK
        uuid patient_id
        uuid consultation_id
        timestamp created_at
    }
    
    PROCESSED_SECTIONS {
        uuid id PK
        uuid processed_template_id FK
        string section_type
        string title
        string original_content
        string processed_content
        string visibility_rule
    }
    
    AI_RECOMMENDATIONS ||--o{ AI_RECOMMENDATION_SECTIONS : contains
    AI_RECOMMENDATIONS {
        uuid id PK
        uuid consultation_id
        uuid patient_id
        string category_id
        uuid form_id
        timestamp created_at
    }
    
    AI_RECOMMENDATION_SECTIONS {
        uuid id PK
        uuid recommendation_id FK
        string section_type
        jsonb recommendations
        string summary
    }
    
    PATIENT_VIEWS {
        uuid id PK
        uuid consultation_id
        uuid patient_id
        uuid provider_id
        jsonb sections
        jsonb config
        timestamp created_at
    }
    
    NOTE_TEMPLATES ||--o{ PROCESSED_TEMPLATES : processed_from
    PROCESSED_TEMPLATES ||--o{ PATIENT_VIEWS : generates
    AI_RECOMMENDATIONS ||--o{ PROCESSED_TEMPLATES : enhances
```

## User Flow Diagram

```mermaid
sequenceDiagram
    actor Provider
    participant ConsultUI as Consultation UI
    participant TemplateAPI as Template API
    participant AIAPI as AI Service API
    participant PatientViewAPI as Patient View API
    actor Patient
    
    Provider->>ConsultUI: Select template
    ConsultUI->>TemplateAPI: Process template
    TemplateAPI-->>ConsultUI: Return processed template
    
    Provider->>ConsultUI: Request AI recommendations
    ConsultUI->>AIAPI: Generate recommendations
    AIAPI-->>ConsultUI: Return AI recommendations
    
    Provider->>ConsultUI: Edit content
    Provider->>ConsultUI: Set section visibility
    
    Provider->>ConsultUI: Save consultation
    ConsultUI->>TemplateAPI: Save processed template
    
    Provider->>ConsultUI: Generate patient view
    ConsultUI->>PatientViewAPI: Create patient view
    PatientViewAPI-->>ConsultUI: Confirm creation
    
    Patient->>PatientViewAPI: Access patient portal
    PatientViewAPI-->>Patient: Display patient-friendly notes
```

These diagrams provide a comprehensive view of the Notes Flow System architecture, showing:

1. **Data Flow Diagram**: How data moves between different components of the system
2. **Component Architecture**: The layered structure of the system and component relationships
3. **Data Model Relationships**: The database schema and relationships between entities
4. **User Flow Diagram**: The sequence of interactions between users and system components

The architecture follows a modular design with clear separation of concerns:
- UI components for user interaction
- API layer for business logic
- Data layer for persistence
- Clear integration points with existing systems

This design ensures flexibility, maintainability, and scalability as the system evolves.