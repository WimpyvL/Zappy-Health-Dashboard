# Universal JSON Form Schema Validator

A comprehensive validation system for JSON form definitions that supports multiple input formats and provides detailed error reporting.

## Overview

The Universal JSON Form Schema Validator is designed to accept any JSON input and validate it against comprehensive schemas for form definitions. It supports multiple input formats, provides detailed validation error messages, and ensures data integrity for the forms system.

## Features

- **Multiple Format Support**: Validates page-based, step-based, and simple object form structures
- **Comprehensive Validation**: Schema validation using AJV with semantic validation checks
- **Detailed Error Reporting**: Clear, actionable error messages with path information
- **Format Detection**: Automatically detects and validates against the appropriate schema
- **Extensible Design**: Easy to add new field types and validation rules
- **Improvement Suggestions**: Provides suggestions for better form design

## Supported Formats

### 1. Page-based Forms

Structure: `flowConfig` + `pages` with `elements`

```json
{
  "flowConfig": {
    "title": "Consultation Form",
    "description": "Pre-consultation questionnaire",
    "version": "1.0"
  },
  "pages": [
    {
      "id": "page1",
      "title": "Basic Information",
      "elements": [
        {
          "id": "name",
          "type": "text_input",
          "label": "Full Name",
          "required": true,
          "validation": {
            "min_length": 2,
            "max_length": 100
          }
        }
      ]
    }
  ],
  "conditionals": [...],
  "completionActions": [...]
}
```

### 2. Step-based Forms

Structure: `flowConfig` + `steps` with individual field configurations

```json
{
  "flowConfig": {
    "title": "Weight Loss Journey",
    "totalSteps": 5
  },
  "steps": [
    {
      "id": "weightGoal",
      "stepNumber": 1,
      "type": "radio",
      "title": "What's your weight loss goal?",
      "fieldName": "weightGoal",
      "options": [
        { "value": "1-15", "label": "Losing 1-15 lbs" }
      ]
    }
  ],
  "conditionalLogic": {...},
  "validation": {...}
}
```

### 3. Simple Object Forms

Structure: Basic form definition with `fields` array

```json
{
  "title": "Contact Form",
  "description": "Basic contact information",
  "fields": [
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "validation": {
        "email_format": true
      }
    }
  ]
}
```

## Supported Field Types

- `text_input` - Single line text input
- `textarea` - Multi-line text input
- `select` - Dropdown selection
- `radio` - Radio button group
- `checkbox` - Checkbox group
- `number` - Numeric input
- `email` - Email input with validation
- `tel` - Telephone input
- `date` - Date picker
- `input` - Generic input (step-based forms)
- `composite` - Multiple related fields
- `encouragement` - Display message (step-based)
- `warning` - Warning/alert message

## Validation Rules

### Text Validation
- `min_length`: Minimum number of characters
- `max_length`: Maximum number of characters
- `required`: Makes field mandatory

### Numeric Validation
- `min`: Minimum value
- `max`: Maximum value

### Format Validation
- `email_format`: Validates email format
- `phone_format`: Validates phone number format
- `max_date`: Maximum allowed date

### Special Validation
- `minAge`: Minimum age validation for date inputs
- `message`: Custom validation error message

## Usage

### Basic Validation

```javascript
import validateFormSchema from './src/utils/formSchemaValidator.js';

const formData = {
  flowConfig: { title: "My Form" },
  pages: [{ id: "page1", elements: [...] }]
};

const result = validateFormSchema(formData);

if (result.isValid) {
  console.log('Form is valid!');
  console.log('Format:', result.format);
} else {
  console.log('Validation errors:');
  result.errors.forEach(error => {
    console.log(`- ${error.message} at ${error.path}`);
  });
}
```

### Handling Results

```javascript
const result = validateFormSchema(jsonData);

// Check validation status
console.log('Valid:', result.isValid);
console.log('Format:', result.format);

// Handle errors
if (result.errors.length > 0) {
  result.errors.forEach(error => {
    console.log(`Error: ${error.message}`);
    console.log(`Path: ${error.path}`);
    console.log(`Code: ${error.code}`);
  });
}

// Handle warnings
if (result.warnings.length > 0) {
  result.warnings.forEach(warning => {
    console.log(`Warning: ${warning.message}`);
  });
}

// Get improvement suggestions
if (result.suggestions.length > 0) {
  console.log('Suggestions for improvement:');
  result.suggestions.forEach(suggestion => {
    console.log(`- ${suggestion}`);
  });
}
```

### Utility Functions

```javascript
import { 
  getSupportedFieldTypes,
  getSupportedValidationRules,
  getValidationRuleDocumentation 
} from './src/utils/formSchemaValidator.js';

// Get all supported field types
const fieldTypes = getSupportedFieldTypes();
console.log('Supported field types:', fieldTypes);

// Get all validation rules
const validationRules = getSupportedValidationRules();
console.log('Validation rules:', validationRules);

// Get documentation for validation rules
const docs = getValidationRuleDocumentation();
console.log('min_length rule:', docs.min_length);
```

## Validation Process

1. **Input Validation**: Checks for null, invalid JSON, or wrong data types
2. **Format Detection**: Automatically identifies the form structure type
3. **Schema Validation**: Validates against the appropriate JSON schema using AJV
4. **Semantic Validation**: Performs additional business logic checks:
   - Duplicate ID detection
   - Field type requirements (e.g., options for select fields)
   - Validation rule consistency
   - Reference integrity for conditionals
5. **Suggestion Generation**: Provides improvement recommendations

## Error Codes

- `MISSING_DATA`: Input data is required
- `INVALID_JSON`: Invalid JSON format
- `INVALID_TYPE`: Input must be a JSON object
- `UNKNOWN_FORMAT`: Unrecognized form format
- `DUPLICATE_ID`: Duplicate field/page/step IDs
- `DUPLICATE_STEP_NUMBER`: Duplicate step numbers in step-based forms
- `MISSING_OPTIONS`: Required options missing for select/radio/checkbox fields
- `MISSING_FIELDS`: Required fields missing for composite field type
- `MULTIPLE_EXCLUSIVE`: Multiple exclusive options in checkbox
- `INVALID_RANGE`: Invalid validation ranges (min > max)
- `SEMANTIC_ERROR`: General semantic validation error

## Best Practices

### Form Design
- Use descriptive IDs for all fields, pages, and steps
- Provide clear labels and help text
- Set appropriate validation rules
- Include completion messages for better UX
- Estimate completion time for user expectations

### Validation Rules
- Use `min_length` and `max_length` for text inputs
- Set reasonable ranges for numeric inputs
- Mark important fields as required
- Provide custom error messages when needed

### Conditional Logic
- Ensure referenced fields exist
- Use clear condition operators
- Test conditional flows thoroughly

### Accessibility
- Provide help text for complex fields
- Use appropriate field types for data
- Include aria labels and descriptions

## Integration with Forms System

The validator integrates with the existing forms system:

- **Database Schema**: Validates forms before storing in `questionnaire` table
- **API Endpoints**: Used by `useCreateForm` and `useUpdateForm` hooks
- **Field Types**: Supports all existing field components
- **Validation Rules**: Aligns with current validation system

## Testing

Run the test suite:

```bash
npm test -- --testPathPattern=formSchemaValidator.test.js
```

Test with existing forms:

```bash
node src/utils/testFormValidator.js
```

## Future Enhancements

- Support for custom field types
- Advanced conditional logic validation
- Form accessibility scoring
- Performance optimization for large forms
- Integration with form builder UI
- Localization support for error messages

## Troubleshooting

### Common Issues

1. **AJV Errors**: Ensure all required properties are present
2. **Format Detection**: Check that your form has the required structure keys
3. **Field Type Errors**: Verify field types are in the supported list
4. **Validation Rules**: Ensure min/max ranges are logical

### Debug Mode

For detailed debugging, check the `validator.errors` array:

```javascript
const result = validateFormSchema(formData);
if (!result.isValid) {
  console.log('Detailed AJV errors:', result.errors);
}
```

## Contributing

When adding new features:

1. Update the field types or validation rules arrays
2. Add corresponding schema definitions
3. Update semantic validation functions
4. Add comprehensive tests
5. Update documentation

The validator is designed to be extensible and maintainable for future form system enhancements.