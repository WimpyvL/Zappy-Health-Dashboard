# Telehealth Flow Improvement Plan

## Overview

This document outlines the comprehensive plan to improve the patient flow in the Telehealth application, from intake form submission to note delivery. The plan addresses the current issues and provides a roadmap for implementation.

## Current Issues Identified

1. **Incomplete Intake Form Implementation**
   - Many steps are placeholders with "This step will be implemented soon" messages
   - No clear connection between form steps and data flow

2. **Disconnected Components**
   - Intake form not properly connected to patient account creation
   - No clear link between intake form and services/products/plans
   - Missing integration with patient tagging system
   - No automated connection to notification system

3. **Missing End-to-End Flow**
   - No clear path from intake form to consultation note generation
   - No automated process for note delivery to patients

4. **Supabase Integration Gaps**
   - Incomplete database schema for the full patient journey
   - Missing tables and relationships for comprehensive flow

## Improvement Plan

### 1. Dynamic and Extensible Intake Form

**Goal:** Create a flexible intake form system that can be easily extended with new questions in the future.

**Implementation:**
- Create a form template system in Supabase to store form configurations
- Build a dynamic form renderer that reads from these templates
- Ensure all patient information is collected appropriately
- Implement form versioning to track changes over time

**Database Changes:**
- Create `form_templates` table to store form configurations
- Enhance `form_submissions` table to link with templates and track versions

**Code Changes:**
- Refactor `ModernIntakeFormPage.jsx` to use dynamic form configuration
- Create admin interface for managing form templates
- Implement form validation and error handling

### 2. Immediate Patient Account Creation with Tagging

**Goal:** Create patient accounts immediately upon form submission for all services, using tags to differentiate between free and paid service users.

**Implementation:**
- Create patient accounts at the end of the intake form process for all users
- Implement a tagging system to differentiate between:
  - "free_service" for users of complementary services
  - "paid_service" for users of paid services
  - "lead" for users who haven't completed payment (for paid services)
  - "active" for users who have completed payment (for paid services)
- Use tags to control access to different features and services

**Database Changes:**
- Ensure `patients` table can be created directly from form submission data
- Create necessary tag-related tables (see Tagging System section)

**Code Changes:**
- Modify form submission process to create patient accounts immediately
- Implement email verification for new accounts
- Add welcome flow for new patients
- Apply appropriate tags based on service type and payment status

### 3. Comprehensive Tagging System

**Goal:** Implement a flexible tagging system that tracks patient journey stages.

**Implementation:**
- Create a tag management system with predefined and custom tags
- Automatically tag patients based on their journey stage and service type:
  - "free_service" or "paid_service" based on service type
  - "lead" for initial form submissions for paid services
  - "active" for patients who have completed payment (for paid services)
  - Custom tags based on form responses and patient actions

**Database Changes:**
- Create `tags` table to store available tags
- Create `patient_tags` junction table to associate tags with patients
- Add timestamps to track when tags were applied/removed

**Code Changes:**
- Implement tag rules engine to automatically apply tags
- Create admin interface for managing tags and rules
- Add tag-based filtering for patient lists

### 4. Service/Product/Plan Integration

**Goal:** Connect intake form to appropriate services, products, and subscription plans.

**Implementation:**
- Link form submissions to selected services/products
- Support both one-time purchases and subscription plans
- Handle free/complementary services appropriately

**Database Changes:**
- Enhance relationships between `form_submissions`, `products`, and `subscription_plans`
- Add service type indicators (free/paid)

**Code Changes:**
- Complete the Treatment Preferences step implementation
- Add service selection component
- Implement subscription management

### 5. Streamlined Note Generation and Delivery

**Goal:** Create a seamless flow from form submission to note generation and delivery.

**Implementation:**
- Auto-generate draft notes based on form responses
- Implement provider review and finalization process
- Automatically notify patients when notes are available
- Track note delivery and viewing

**Database Changes:**
- Enhance `consultations` table to better link with form submissions
- Create `note_templates` table for standardized notes
- Add `note_views` table to track when patients view notes

**Code Changes:**
- Implement note template system
- Create provider interface for reviewing and finalizing notes
- Connect note finalization to notification system

### 6. Enhanced Notification System

**Goal:** Implement a comprehensive notification system for the entire patient journey.

**Implementation:**
- Connect all patient journey events to the notification system
- Support multiple notification channels (portal, email, SMS)
- Allow patients to set notification preferences
- Track notification delivery and engagement

**Database Changes:**
- Complete implementation of `patient_notifications` and `notification_deliveries` tables
- Add notification templates and preference storage

**Code Changes:**
- Enhance notification service to support all event types
- Implement notification preference management
- Create notification templates for different events

### 7. Complete Supabase Integration

**Goal:** Ensure proper database schema and relationships for the entire patient journey.

**Implementation:**
- Complete all necessary database tables and relationships
- Implement real-time subscriptions for immediate updates
- Set up proper security with row-level security policies

**Database Changes:**
- Create missing tables and relationships
- Add indexes for performance optimization
- Implement row-level security policies

**Code Changes:**
- Update API hooks to use new schema
- Implement real-time subscriptions where appropriate
- Add proper error handling and fallbacks

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Complete dynamic intake form system
- Implement immediate patient account creation
- Set up basic tagging infrastructure

### Phase 2: Core Connections (Weeks 3-4)
- Connect intake form to services/products
- Implement comprehensive tagging rules
- Complete account management features

### Phase 3: Note Generation (Weeks 5-6)
- Implement note template system
- Create provider review interface
- Connect note finalization to patient records

### Phase 4: Notification System (Weeks 7-8)
- Enhance notification service
- Implement multi-channel delivery
- Add notification preferences and templates

### Phase 5: Optimization and Testing (Weeks 9-10)
- Performance optimization
- Comprehensive testing
- User experience improvements

## Technical Recommendations

### Database Schema
- Use foreign keys to maintain data integrity
- Implement proper indexing for performance
- Use JSON fields for flexible data storage

### API Layer
- Create consistent API patterns
- Implement proper error handling
- Add caching for frequently accessed data

### Security
- Implement row-level security in Supabase
- Encrypt sensitive patient data
- Add audit logging for compliance

### UI/UX
- Create a consistent design language
- Implement progress indicators
- Add helpful guidance for users