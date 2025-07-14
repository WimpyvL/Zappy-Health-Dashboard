# Educational Resources Feature

## Overview

The Educational Resources feature provides patients with access to a comprehensive library of health-related content. This feature helps patients better understand their conditions, medications, and treatment options through various types of educational materials.

## Key Components

### Database Structure

The feature is built on a Supabase database with the following tables:
- `educational_resources`: Stores the main content of resources
- `resource_product_associations`: Links resources to specific products
- `resource_condition_associations`: Links resources to specific health conditions
- `resource_relationships`: Defines relationships between resources (e.g., "related to", "prerequisite for")

### API Layer

The API layer provides functions for:
- Fetching resources (all, by ID, by content ID, by product, by condition)
- Creating, updating, and deleting resources
- Managing resource associations
- Retrieving featured and recent resources

### React Components

#### Patient-Facing Components
- `ResourceCard`: Displays a preview of a resource
- `ResourceCategoryTabs`: Navigation tabs for resource categories
- `FeaturedResourcesSection`: Displays featured resources on the resources page
- `RecentArticlesSection`: Displays recently added resources
- `ResourceDetail`: Displays the full content of a resource
- `PatientHomeResourcesSection`: Displays featured resources on the patient home page

#### Admin Components
- `ResourceModal`: Form for creating and editing resources
- `ResourceManagementPage`: Admin interface for managing resources

### Pages

- `/resources`: Main resources page for patients
- `/resources/:id`: Resource detail page
- `/admin/resources`: Admin page for managing resources

## Integration Points

- **Patient Home Page**: Featured resources are displayed on the patient home page
- **Product Pages**: Related resources can be displayed on product pages
- **Condition Pages**: Related resources can be displayed on condition pages

## Content Types

Resources can be categorized into different content types:
- Medication guides
- Usage guides
- Condition information
- Side effect management

## Features

- **Categorization**: Resources can be organized by category
- **Filtering**: Users can filter resources by category, content type, etc.
- **Search**: Users can search for resources by keyword
- **Featured Resources**: Admins can mark resources as featured to highlight them
- **Related Resources**: Resources can be linked to related content

## Future Enhancements

Potential future enhancements for the Educational Resources feature:
- User bookmarks for saving favorite resources
- Progress tracking for multi-part guides
- Interactive content (quizzes, assessments)
- Personalized resource recommendations based on patient profile
- Content rating and feedback system
- Multi-language support
- Downloadable PDF versions of resources
