
# Form Import JSON Examples

This directory contains example JSON files that can be imported using the Form Import button in the Zappy Dashboard. These examples demonstrate different form types and structures that are supported by the system.

## Available Example Files

### 1. `sample-intake-form.json`
- **Type**: Patient Intake Form
- **Format**: Simple format (with `structure.pages`)
- **Pages**: 3 pages with 13 total elements
- **Features**: 
  - Personal information collection
  - Medical history with conditional fields
  - Service preferences
  - Validation rules
  - Conditional logic for "other" conditions

### 2. `advanced-consultation-form.json`
- **Type**: Telemedicine Consultation Form
- **Format**: Advanced format (with `flowConfig`)
- **Pages**: 3 pages with 15 total elements
- **Features**:
  - Flow configuration with completion actions
  - Emergency condition warnings
  - Technical setup validation
  - Medical context gathering
  - Advanced conditional logic
  - Completion rules and actions

### 3. `prescription-refill-form.json`
- **Type**: Prescription Refill Request
- **Format**: Simple format (with `structure.pages`)
- **Pages**: 3 pages with 13 total elements
- **Features**:
  - Prescription details collection
  - Pharmacy information
  - Urgency assessment
  - Side effect tracking
  - Conditional field display

### 4. `mental-health-assessment-phq9.json` (NEW)
- **Type**: Clinical Assessment (PHQ-9 for Depression)
- **Format**: Advanced format (with `flowConfig`)
- **Features**:
  - Standardized clinical questions.
  - Value-based answers for scoring.
  - Completion actions to calculate a total score.
  - Conditional alerts based on the final score.

### 5. `skincare-intake-form.json` (NEW)
- **Type**: Service-Specific Intake (Dermatology)
- **Format**: Advanced format (with `flowConfig`)
- **Features**:
  - Questions tailored to a skincare consultation.
  - Demonstrates checkbox and radio button usage for specific concerns.
  - Includes a recommended (but optional) photo upload section.
  
### 6. `example-form-templates.json`
- **Type**: Multiple form templates collection
- **Format**: Collection of multiple forms
- **Contains**: All forms above in a single JSON array
- **Use**: For bulk import of multiple forms

## How to Use

### Method 1: Copy and Paste
1. Open any of the JSON files in a text editor
2. Copy the entire JSON content
3. In the Zappy Dashboard, go to Settings > Forms
4. Click the "Import Form" button
5. Paste the JSON content into the text area
6. Click "Validate JSON" to check the structure
7. Click "Import Form" to add it to your system

### Method 2: File Upload (if supported)
1. Download the desired JSON file
2. Use the file upload feature in the Import Form modal
3. Select the JSON file and upload

## JSON Structure Formats

The system supports two main formats:

### Simple Format
```json
{
  "title": "Form Title",
  "description": "Form description",
  "form_type": "intake|consultation|prescription|general",
  "status": "active|draft|inactive",
  "structure": {
    "pages": [...],
    "conditionals": [...]
  }
}
```

### Advanced Format
```json
{
  "flowConfig": {
    "title": "Form Title",
    "description": "Form description",
    "form_type": "intake|consultation|prescription|general",
    "version": "1.0",
    "completionMessage": "Thank you message",
    "estimatedTime": "5-10 minutes"
  },
  "pages": [...],
  "conditionals": [...],
  "validation": {...},
  "completionActions": [...]
}
```

## Supported Field Types

- `text_input`: Single line text input
- `textarea`: Multi-line text input
- `select`: Dropdown selection
- `radio`: Single selection radio buttons
- `checkbox`: Multiple selection checkboxes
- `email`: Email input with validation
- `tel`: Phone number input
- `date`: Date picker
- `number`: Numeric input with min/max validation
- `file_upload`: For uploading files like images or PDFs.
- `warning`: A non-interactive display block for important information.

## Validation Rules

All field types support validation rules:
- `required`: true/false
- `min_length`: minimum character length
- `max_length`: maximum character length
- `min`: minimum numeric value
- `max`: maximum numeric value
- `email_format`: email format validation
- `phone_format`: phone number format validation
- `max_date`: maximum date (use "today" for current date)

## Conditional Logic

Forms support conditional logic to show/hide fields or display messages based on user responses:

```json
{
  "id": "condition_id",
  "condition": {
    "field": "field_id",
    "operator": "equals|not_equals|includes|not_includes",
    "value": "comparison_value"
  },
  "action": {
    "type": "show_field|hide_field|show_message",
    "target": "target_field_id",
    "message": "Message to display"
  }
}
```

## Tips for Custom Forms

1. **Test with Simple Forms First**: Start with the simple intake form to understand the structure
2. **Validate JSON**: Always use the "Validate JSON" button before importing
3. **Use Meaningful IDs**: Give fields and pages descriptive IDs for easier management
4. **Plan Conditional Logic**: Design your form flow before adding conditional rules
5. **Consider User Experience**: Keep forms short and group related fields together
6. **Test Thoroughly**: Test all conditional logic and validation rules after import

## Troubleshooting

### Common Issues:
- **Invalid JSON**: Check for missing commas, brackets, or quotes
- **Missing Required Fields**: Ensure all pages have `id`, `title`, and `elements`
- **Invalid Field Types**: Use only supported field types listed above
- **Circular Conditionals**: Avoid conditions that reference each other

### Validation Errors:
- Read error messages carefully - they indicate exactly what's wrong
- Check the line numbers in JSON syntax errors
- Verify all required fields are present
- Ensure proper nesting of objects and arrays

## Support

If you encounter issues with these examples or need help creating custom forms, please:
1. Check the validation error messages first
2. Verify your JSON syntax using a JSON validator
3. Review the field type and validation documentation
4. Contact the development team with specific error messages
