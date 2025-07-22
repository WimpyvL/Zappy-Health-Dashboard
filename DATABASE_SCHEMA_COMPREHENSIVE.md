# Comprehensive Database Schema for Telehealth Portal

This document defines a rigorous database schema for the telehealth portal system based on comprehensive codebase analysis.

## Overview

The telehealth portal is a comprehensive healthcare management platform with the following core domains:
- **User Management**: Patients, Providers, and Administrators
- **Healthcare Services**: Consultations, Sessions, Prescriptions
- **Commerce**: Products, Orders, Subscriptions, Invoices
- **Communication**: Messages, Notifications
- **Workflow Management**: Telehealth Flows, Tasks, Audit Logs
- **Forms & Data Collection**: Dynamic Forms, Form Submissions
- **Administrative**: Tags, Categories, Insurance

## Core Database Tables

### 1. User Management

#### `users` (Base User Table)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- null for SSO users
    role user_role_enum NOT NULL DEFAULT 'patient',
    status user_status_enum NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false,
    profile_picture_url TEXT,
    last_login_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$')
);

CREATE TYPE user_role_enum AS ENUM ('patient', 'provider', 'admin', 'super_admin');
CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'pending', 'suspended', 'deleted');
```

#### `patients`
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_enum,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    primary_pharmacy_id UUID REFERENCES pharmacies(id),
    primary_provider_id UUID REFERENCES providers(id),
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT age_constraint CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '13 years'),
    CONSTRAINT valid_postal_code CHECK (postal_code ~ '^[A-Z0-9\s-]{3,20}$')
);

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
```

#### `providers`
```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    npi_number VARCHAR(10) UNIQUE, -- National Provider Identifier
    license_number VARCHAR(50) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    license_expiry_date DATE NOT NULL,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    education TEXT,
    certifications TEXT[],
    years_experience INTEGER CHECK (years_experience >= 0),
    languages_spoken TEXT[] DEFAULT '{"English"}',
    consultation_fee DECIMAL(10,2) CHECK (consultation_fee >= 0),
    availability_schedule JSONB, -- Store weekly availability
    is_accepting_patients BOOLEAN DEFAULT true,
    average_rating DECIMAL(3,2) CHECK (average_rating >= 0 AND average_rating <= 5),
    total_consultations INTEGER DEFAULT 0 CHECK (total_consultations >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_npi CHECK (npi_number IS NULL OR npi_number ~ '^\d{10}$'),
    CONSTRAINT valid_license_state CHECK (license_state ~ '^[A-Z]{2}$')
);
```

#### `administrators`
```sql
CREATE TABLE administrators (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    department VARCHAR(100),
    manager_id UUID REFERENCES administrators(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Healthcare Services

#### `consultations`
```sql
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    consultation_type consultation_type_enum NOT NULL,
    status consultation_status_enum NOT NULL DEFAULT 'scheduled',
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    chief_complaint TEXT,
    history_present_illness TEXT,
    assessment TEXT,
    plan TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    video_call_url TEXT,
    recording_url TEXT,
    notes TEXT,
    fee DECIMAL(10,2) NOT NULL CHECK (fee >= 0),
    insurance_covered BOOLEAN DEFAULT false,
    prescription_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_duration CHECK (
        (started_at IS NULL AND ended_at IS NULL AND duration_minutes IS NULL) OR
        (started_at IS NOT NULL AND ended_at IS NOT NULL AND duration_minutes IS NOT NULL)
    ),
    CONSTRAINT ended_after_started CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT scheduled_in_future CHECK (scheduled_at > created_at)
);

CREATE TYPE consultation_type_enum AS ENUM ('initial', 'follow_up', 'urgent', 'routine', 'specialist');
CREATE TYPE consultation_status_enum AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');
```

#### `prescriptions`
```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    strength VARCHAR(100) NOT NULL,
    dosage_form dosage_form_enum NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    days_supply INTEGER NOT NULL CHECK (days_supply > 0),
    instructions TEXT NOT NULL,
    refills_remaining INTEGER NOT NULL DEFAULT 0 CHECK (refills_remaining >= 0),
    total_refills INTEGER NOT NULL DEFAULT 0 CHECK (total_refills >= 0),
    status prescription_status_enum NOT NULL DEFAULT 'active',
    prescribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    pharmacy_id UUID REFERENCES pharmacies(id),
    ndc_number VARCHAR(11), -- National Drug Code
    controlled_substance_schedule controlled_schedule_enum,
    contraindications TEXT[],
    drug_interactions TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT expires_after_prescribed CHECK (expires_at > prescribed_at),
    CONSTRAINT valid_ndc CHECK (ndc_number IS NULL OR ndc_number ~ '^\d{4,5}-\d{3,4}-\d{1,2}$'),
    CONSTRAINT refills_logic CHECK (refills_remaining <= total_refills)
);

CREATE TYPE dosage_form_enum AS ENUM ('tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'patch', 'drops');
CREATE TYPE prescription_status_enum AS ENUM ('active', 'completed', 'cancelled', 'expired');
CREATE TYPE controlled_schedule_enum AS ENUM ('CI', 'CII', 'CIII', 'CIV', 'CV');
```

#### `sessions` (Treatment Sessions)
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    telehealth_flow_id UUID REFERENCES telehealth_flows(id) ON DELETE SET NULL,
    session_type session_type_enum NOT NULL,
    status session_status_enum NOT NULL DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    plan VARCHAR(200),
    progress_notes TEXT,
    assessment_and_plan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE session_type_enum AS ENUM ('consultation', 'follow_up', 'therapy', 'check_in', 'screening');
CREATE TYPE session_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'followup');
```

### 3. Commerce & Products

#### `categories`
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(200) UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);
```

#### `products`
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    product_type product_type_enum NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
    requires_prescription BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    weight_grams INTEGER CHECK (weight_grams > 0),
    dimensions JSONB, -- {length, width, height}
    image_urls TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_sku CHECK (sku ~ '^[A-Z0-9-]{3,20}$')
);

CREATE TYPE product_type_enum AS ENUM ('prescription', 'supplement', 'medical_device', 'consultation', 'lab_test', 'telehealth_session');
```

#### `subscription_plans`
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    billing_cycle billing_cycle_enum NOT NULL,
    duration_months INTEGER CHECK (duration_months > 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    features TEXT[] DEFAULT '{}',
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_consultations INTEGER, -- null for unlimited
    includes_shipping BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual');
```

#### `orders`
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    telehealth_flow_id UUID REFERENCES telehealth_flows(id) ON DELETE SET NULL,
    order_type order_type_enum NOT NULL,
    status order_status_enum NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(100), -- Stripe payment intent ID
    shipping_address JSONB,
    billing_address JSONB,
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_order_number CHECK (order_number ~ '^ORD-[0-9]{8,12}$'),
    CONSTRAINT total_calculation CHECK (total_amount = subtotal + tax_amount - discount_amount + shipping_amount)
);

CREATE TYPE order_type_enum AS ENUM ('prescription', 'consultation', 'lab_test', 'supplement', 'medical_device', 'telehealth_session');
CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');
```

#### `order_items`
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL, -- Store name at time of order
    description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    dosage_instructions TEXT, -- For prescription items
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT price_calculation CHECK (total_price = quantity * unit_price)
);
```

#### `invoices`
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status invoice_status_enum NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_invoice_number CHECK (invoice_number ~ '^INV-[0-9]{8,12}$'),
    CONSTRAINT due_after_issue CHECK (due_date >= issue_date),
    CONSTRAINT paid_logic CHECK ((status = 'paid' AND paid_date IS NOT NULL) OR (status != 'paid' AND paid_date IS NULL))
);

CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled');
```

### 4. Communication & Messaging

#### `conversations`
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(500),
    participant_ids UUID[] NOT NULL,
    conversation_type conversation_type_enum DEFAULT 'direct',
    is_group BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    last_message_id UUID,
    last_message_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT min_participants CHECK (array_length(participant_ids, 1) >= 2),
    CONSTRAINT group_logic CHECK ((is_group = true AND array_length(participant_ids, 1) > 2) OR (is_group = false))
);

CREATE TYPE conversation_type_enum AS ENUM ('direct', 'group', 'support', 'consultation');
```

#### `messages`
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message_type message_type_enum DEFAULT 'text',
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]', -- Array of attachment objects
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    read_by JSONB DEFAULT '{}', -- {user_id: timestamp}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0 OR message_type != 'text'),
    CONSTRAINT edit_logic CHECK ((is_edited = true AND edited_at IS NOT NULL) OR (is_edited = false AND edited_at IS NULL))
);

CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file', 'system', 'prescription', 'appointment');
```

#### `notifications`
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type_enum NOT NULL,
    channels notification_channel_enum[] NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional context data
    status notification_status_enum NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT future_scheduled CHECK (scheduled_at >= created_at),
    CONSTRAINT sent_logic CHECK ((status = 'sent' AND sent_at IS NOT NULL) OR (status != 'sent'))
);

CREATE TYPE notification_type_enum AS ENUM ('appointment_reminder', 'prescription_ready', 'lab_results', 'payment_confirmation', 'system_alert', 'marketing', 'consultation_approved', 'consultation_rejected');
CREATE TYPE notification_channel_enum AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE notification_status_enum AS ENUM ('pending', 'sent', 'delivered', 'failed', 'cancelled');
```

### 5. Workflow Management

#### `telehealth_flows`
```sql
CREATE TABLE telehealth_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    subscription_duration_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    current_status flow_status_enum NOT NULL DEFAULT 'started',
    status_history JSONB DEFAULT '[]', -- Array of {status, timestamp} objects
    intake_form_data JSONB DEFAULT '{}',
    consultation_data JSONB DEFAULT '{}',
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT completion_logic CHECK (
        (current_status = 'completed' AND completed_at IS NOT NULL) OR 
        (current_status != 'completed' AND completed_at IS NULL)
    )
);

CREATE TYPE flow_status_enum AS ENUM (
    'started', 'product_selected', 'intake_completed', 'consultation_approved', 
    'consultation_rejected', 'order_created', 'payment_pending', 
    'payment_completed', 'completed', 'cancelled'
);
```

#### `tasks`
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    task_type task_type_enum DEFAULT 'general',
    priority priority_enum DEFAULT 'medium',
    status task_status_enum NOT NULL DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    related_entity_type VARCHAR(50), -- 'patient', 'order', 'consultation', etc.
    related_entity_id UUID,
    estimated_hours DECIMAL(4,2) CHECK (estimated_hours > 0),
    actual_hours DECIMAL(4,2) CHECK (actual_hours > 0),
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT completion_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed' AND completed_at IS NULL)
    )
);

CREATE TYPE task_type_enum AS ENUM ('general', 'patient_followup', 'prescription_review', 'insurance_verification', 'administrative');
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    severity log_severity_enum DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action ~ '^[A-Z_]+$')
);

CREATE TYPE log_severity_enum AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
```

### 6. Dynamic Forms System

#### `form_schemas`
```sql
CREATE TABLE form_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    schema_definition JSONB NOT NULL, -- Complete form schema
    medical_form_type medical_form_type_enum,
    clinical_workflow VARCHAR(100),
    is_template BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    category VARCHAR(100),
    tags TEXT[],
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_version CHECK (version ~ '^\d+\.\d+\.\d+$')
);

CREATE TYPE medical_form_type_enum AS ENUM ('intake', 'assessment', 'follow_up', 'screening', 'consent');
```

#### `form_submissions`
```sql
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_schema_id UUID NOT NULL REFERENCES form_schemas(id) ON DELETE RESTRICT,
    form_version VARCHAR(20) NOT NULL,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    telehealth_flow_id UUID REFERENCES telehealth_flows(id) ON DELETE SET NULL,
    submission_data JSONB NOT NULL,
    status form_submission_status_enum DEFAULT 'pending',
    clinical_priority clinical_priority_enum DEFAULT 'routine',
    processed_at TIMESTAMPTZ,
    processing_errors TEXT[],
    completion_time_seconds INTEGER, -- Time taken to complete form
    device_type device_type_enum,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT completion_time_positive CHECK (completion_time_seconds > 0)
);

CREATE TYPE form_submission_status_enum AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE clinical_priority_enum AS ENUM ('routine', 'urgent', 'emergency');
CREATE TYPE device_type_enum AS ENUM ('desktop', 'tablet', 'mobile');
```

### 7. Insurance & Pharmacy

#### `insurance_providers`
```sql
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    payer_id VARCHAR(20) UNIQUE, -- Standard payer ID
    phone VARCHAR(20),
    website_url TEXT,
    coverage_types TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `patient_insurance`
```sql
CREATE TABLE patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insurance_provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE RESTRICT,
    policy_number VARCHAR(50) NOT NULL,
    group_number VARCHAR(50),
    subscriber_name VARCHAR(200) NOT NULL,
    subscriber_relationship relationship_enum NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    copay_amount DECIMAL(6,2) CHECK (copay_amount >= 0),
    deductible_amount DECIMAL(8,2) CHECK (deductible_amount >= 0),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (expiration_date IS NULL OR expiration_date > effective_date)
);

CREATE TYPE relationship_enum AS ENUM ('self', 'spouse', 'child', 'parent', 'other');
```

#### `pharmacies`
```sql
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    npi_number VARCHAR(10) UNIQUE,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    fax VARCHAR(20),
    email VARCHAR(255),
    hours_of_operation JSONB, -- Store hours by day
    is_24_hour BOOLEAN DEFAULT false,
    accepts_insurance BOOLEAN DEFAULT true,
    delivery_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_npi_pharmacy CHECK (npi_number IS NULL OR npi_number ~ '^\d{10}$'),
    CONSTRAINT valid_state_pharmacy CHECK (state ~ '^[A-Z]{2}$')
);
```

### 8. Tags & Categories

#### `tags`
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6b7280', -- Hex color
    description TEXT,
    category tag_category_enum,
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    is_system_tag BOOLEAN DEFAULT false, -- System tags cannot be deleted
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_color CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);

CREATE TYPE tag_category_enum AS ENUM ('medical', 'administrative', 'workflow', 'priority', 'custom');
```

#### `entity_tags` (Junction table for tagging)
```sql
CREATE TABLE entity_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    tagged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tag_id, entity_type, entity_id)
);
```

## Indexes for Performance Optimization

```sql
-- User Management Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_patients_last_active ON patients(last_active_at);
CREATE INDEX idx_patients_subscription_plan ON patients(subscription_plan_id);
CREATE INDEX idx_providers_specialties ON providers USING GIN(specialties);
CREATE INDEX idx_providers_accepting_patients ON providers(is_accepting_patients) WHERE is_accepting_patients = true;

-- Healthcare Services Indexes
CREATE INDEX idx_consultations_patient_scheduled ON consultations(patient_id, scheduled_at);
CREATE INDEX idx_consultations_provider_scheduled ON consultations(provider_id, scheduled_at);
CREATE INDEX idx_consultations_status_scheduled ON consultations(status, scheduled_at);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_provider ON prescriptions(provider_id);
CREATE INDEX idx_prescriptions_status_expires ON prescriptions(status, expires_at);
CREATE INDEX idx_sessions_patient_date ON sessions(patient_id, scheduled_date);

-- Commerce Indexes
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_type_active ON products(product_type, is_active);
CREATE INDEX idx_orders_patient_created ON orders(patient_id, created_at);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_invoices_patient_due ON invoices(patient_id, due_date);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Communication Indexes
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'pending';

-- Workflow Indexes
CREATE INDEX idx_telehealth_flows_patient_status ON telehealth_flows(patient_id, current_status);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'completed';
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);

-- Forms Indexes
CREATE INDEX idx_form_submissions_patient ON form_submissions(patient_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_clinical_priority ON form_submissions(clinical_priority);

-- Tags & Categories
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);
```

## Constraints and Business Rules

### Data Integrity Constraints

1. **User Role Consistency**: Ensure users have appropriate role-specific data
2. **Prescription Safety**: Controlled substances require special handling
3. **Financial Accuracy**: Order totals must match item calculations
4. **Scheduling Logic**: Appointments cannot be in the past
5. **Insurance Validation**: Only one primary insurance per patient
6. **Form Workflow**: Submissions must reference valid, published forms

### Triggers for Automated Updates

```sql
-- Update patient last_active_at on any activity
CREATE OR REPLACE FUNCTION update_patient_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE patients 
    SET last_active_at = NOW()
    WHERE id = COALESCE(NEW.patient_id, OLD.patient_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER tr_consultations_update_patient_activity
    AFTER INSERT OR UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_patient_last_active();

CREATE TRIGGER tr_orders_update_patient_activity
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_patient_last_active();

-- Update provider statistics
CREATE OR REPLACE FUNCTION update_provider_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE providers 
        SET total_consultations = total_consultations + 1
        WHERE id = NEW.provider_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_consultations_update_provider_stats
    AFTER INSERT OR UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_provider_stats();

-- Update conversation last_message info
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_messages_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
```

## Security and Privacy Considerations

### Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY patient_own_data ON patients
    FOR ALL TO authenticated
    USING (id = auth.uid());

CREATE POLICY provider_assigned_patients ON patients
    FOR SELECT TO authenticated
    USING (primary_provider_id = auth.uid());

-- More policies would be defined based on application requirements
```

### Data Encryption

- Sensitive fields (SSN, payment info) should be encrypted at rest
- Use application-level encryption for PII
- Implement field-level encryption for medical data

### Audit Trail

- All data modifications logged in `audit_logs`
- Include user, timestamp, old/new values
- Immutable audit records with cryptographic integrity

## Backup and Recovery Strategy

1. **Automated Daily Backups**: Full database backup with point-in-time recovery
2. **Incremental Backups**: Transaction log backups every 15 minutes
3. **Geo-redundant Storage**: Backups stored in multiple regions
4. **Recovery Testing**: Monthly recovery drills with test data
5. **Compliance**: HIPAA-compliant backup encryption and retention

## Monitoring and Maintenance

1. **Performance Monitoring**: Track slow queries and index usage
2. **Data Quality Checks**: Regular validation of referential integrity
3. **Capacity Planning**: Monitor table growth and plan scaling
4. **Security Audits**: Regular review of access patterns and permissions

This schema provides a robust foundation for a comprehensive telehealth platform with proper constraints, relationships, and performance optimizations while maintaining HIPAA compliance and data integrity.