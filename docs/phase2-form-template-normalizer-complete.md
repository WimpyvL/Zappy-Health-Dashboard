# Phase 2: Form Template Normalizer - Implementation Complete

## Overview

Phase 2 has been successfully implemented, building on the completed Phase 1 validator. The Form Template Normalizer converts any validated JSON form template (from any of the 3 supported formats) into the internal questionnaire table format used by the Zappy-Dashboard forms system.

## Implementation Summary

### Core Components Created

1. **`src/utils/formNormalizer.js`** - Main normalizer module
2. **`src/utils/__tests__/formNormalizer.test.js`** - Comprehensive test suite
3. **`src/utils/formNormalizerExamples.js`** - Usage examples and demonstrations
4. **`src/utils/testFormNormalizer.js`** - Simple test runner for validation

### Key Features Implemented

#### ✅ Field Type Mapping System
- **Comprehensive mapping** from input field types to internal field types
- **Handles variations**: `input` → `text_input`, `dropdown` → `select`, `phone` → `tel`
- **Fallback support**: Unknown types default to `text_input`
- **Direct mappings**: `textarea`, `email`, `date`, `number`, etc.

#### ✅ Validation Rule Transformation
- **Direct mapping** of supported validation rules: `min_length`, `max_length`, `min`, `max`, `email_format`, `phone_format`, `max_date`, `required`, `minAge`, `message`
- **Alias handling**: `minLength` → `min_length`, `minimum` → `min`, etc.
- **Preserves semantic meaning** while ensuring internal format compatibility

#### ✅ Metadata Extraction and Processing
- **FlowConfig extraction**: Title, description, version, completion message, estimated time, theme
- **Service type mapping**: `consultation` → `paid`, `intake` → `free`, etc.
- **Category handling**: Extracts `category_id` when provided
- **Defaults**: Provides sensible defaults for missing fields

#### ✅ Slug Generation with Uniqueness
- **URL-friendly slugs**: Converts titles to lowercase, hyphenated format
- **Special character handling**: Removes/converts special characters safely
- **Duplicate prevention**: Appends incremental numbers for uniqueness
- **Fallback support**: Defaults to "form" when title is invalid

#### ✅ Multi-Format Support
- **Page-based forms**: Direct normalization with field mapping
- **Step-based forms**: Converts steps to pages, handles composite fields
- **Simple object forms**: Wraps fields in a single page structure
- **Preserves original format** in metadata for reference

#### ✅ Conditional Logic Processing
- **Page-based conditionals**: Direct preservation of conditional arrays
- **Step-based conditionals**: Converts conditionalLogic to internal format
- **Action mapping**: Maps various action types to internal structure

#### ✅ Completion Actions Processing
- **Array format**: Direct preservation of completion action arrays
- **Object format**: Converts step-based completion objects to action arrays
- **Action type mapping**: `redirect`, `trackEvent`, `emailNotification` → internal actions

### Output Format

The normalizer produces objects compatible with the questionnaire table schema:

```json
{
  "title": "Form Title",
  "description": "Form Description",
  "slug": "form-title",
  "category_id": null,
  "is_active": true,
  "service_type": "paid|free|null",
  "form_data": {
    "flowConfig": { /* metadata */ },
    "pages": [ /* normalized pages */ ],
    "conditionals": [ /* conditional logic */ ],
    "completionActions": [ /* completion actions */ ],
    "validation": { /* form-level validation */ }
  },
  "structure": { /* same as form_data */ },
  "metadata": {
    "originalFormat": "page-based|step-based|simple-object",
    "version": "1.0.0",
    "normalizedAt": "2025-07-08T16:39:20.807Z"
  }
}
```

## API Reference

### Main Functions

#### `normalizeFormTemplate(jsonData, existingSlugs = [])`
- **Purpose**: Main normalization function
- **Parameters**:
  - `jsonData`: Validated form JSON (any supported format)
  - `existingSlugs`: Array of existing slugs to avoid duplicates
- **Returns**: Normalized questionnaire object
- **Throws**: Error with descriptive message if normalization fails

#### `validateNormalizationRequirements(jsonData)`
- **Purpose**: Pre-validation check for normalization compatibility
- **Parameters**: `jsonData` - Form data to validate
- **Returns**: `{ isValid: boolean, errors: string[] }`

#### `getSupportedFieldTypeMappings()`
- **Purpose**: Get all supported field type mappings
- **Returns**: Object with input type → internal type mappings

#### `getSupportedServiceTypeMappings()`
- **Purpose**: Get all supported service type mappings
- **Returns**: Object with form type → service type mappings

## Usage Examples

### Basic Usage
```javascript
import { normalizeFormTemplate } from './src/utils/formNormalizer.js';

// Normalize a validated form template
const normalizedForm = normalizeFormTemplate(validatedJsonData);

// Insert into questionnaire table
const questionnaireRecord = {
  title: normalizedForm.title,
  description: normalizedForm.description,
  slug: normalizedForm.slug,
  category_id: normalizedForm.category_id,
  is_active: normalizedForm.is_active,
  form_data: normalizedForm.form_data,
  structure: normalizedForm.structure
};
```

### With Existing Slugs
```javascript
const existingSlugs = ['contact-form', 'intake-form'];
const normalizedForm = normalizeFormTemplate(formData, existingSlugs);
// Ensures generated slug is unique
```

### Complete Workflow (Validation + Normalization)
```javascript
import { validateFormSchema } from './src/utils/formSchemaValidator.js';
import { normalizeFormTemplate } from './src/utils/formNormalizer.js';

// Step 1: Validate
const validation = validateFormSchema(inputJson);
if (!validation.isValid) {
  throw new Error('Validation failed: ' + validation.errors.map(e => e.message).join(', '));
}

// Step 2: Normalize
const normalized = normalizeFormTemplate(inputJson);

// Step 3: Store in database
// ... database insertion logic
```

## Field Type Mappings

| Input Type | Internal Type | Notes |
|------------|---------------|-------|
| `input` | `text_input` | Common alias |
| `text` | `text_input` | Common alias |
| `textbox` | `text_input` | UI variant |
| `dropdown` | `select` | UI variant |
| `phone` | `tel` | Semantic alias |
| `telephone` | `tel` | Semantic alias |
| `radiobutton` | `radio` | UI variant |
| `checkboxes` | `checkbox` | Plural variant |
| `textarea` | `textarea` | Direct mapping |
| `email` | `email` | Direct mapping |
| `date` | `date` | Direct mapping |
| `number` | `number` | Direct mapping |

## Service Type Mappings

| Form Type | Service Type | Notes |
|-----------|--------------|-------|
| `consultation` | `paid` | Paid service |
| `intake` | `free` | Free registration |
| `assessment` | `free` | Free evaluation |
| `free` | `free` | Direct mapping |
| `paid` | `paid` | Direct mapping |

## Testing Status

✅ **All tests passing** - 6/6 test suites completed successfully:

1. **Page-based Normalization** - ✅ Passed
2. **Step-based Normalization** - ✅ Passed  
3. **Simple Form Normalization** - ✅ Passed
4. **Slug Generation** - ✅ Passed
5. **Error Handling** - ✅ Passed
6. **Validation Requirements** - ✅ Passed

## Error Handling

The normalizer provides comprehensive error handling:

- **Invalid input validation**: Checks for null, non-object, or array inputs
- **Format detection**: Identifies unknown/unsupported formats
- **Required field validation**: Ensures title is present for slug generation
- **Field normalization errors**: Handles malformed field objects gracefully
- **Descriptive error messages**: Provides clear context for debugging

## Integration Points

### With Phase 1 Validator
```javascript
// Complete validation and normalization pipeline
const validation = validateFormSchema(inputData);
if (validation.isValid) {
  const normalized = normalizeFormTemplate(inputData);
  // Ready for database storage
}
```

### With Database Layer
The normalized output is directly compatible with the questionnaire table schema, requiring no additional transformation.

### With Form Renderers
The normalized `form_data` structure maintains compatibility with existing form rendering components in the Zappy-Dashboard system.

## Performance Considerations

- **Efficient field mapping**: O(1) lookup time for field type mappings
- **Minimal object creation**: Reuses structures where possible
- **Slug generation optimization**: Single pass with duplicate checking
- **Memory efficient**: No unnecessary deep cloning of large objects

## Future Extensibility

The architecture supports easy extension:

- **New field types**: Add to `FIELD_TYPE_MAPPING` object
- **New service types**: Add to `SERVICE_TYPE_MAPPING` object  
- **New validation rules**: Extend `mapValidationRules` function
- **New input formats**: Add detection logic and conversion functions
- **Additional metadata**: Extend `extractMetadata` function

## Success Criteria Met

✅ **Converts all 3 input formats** to consistent internal format  
✅ **Preserves all semantic information** during transformation  
✅ **Generates valid questionnaire table entries**  
✅ **Handles edge cases** with clear error messages  
✅ **Maintains compatibility** with existing form renderers  
✅ **Comprehensive testing** with full coverage  
✅ **Clear documentation** and usage examples  

## Files Created

- `src/utils/formNormalizer.js` (414 lines) - Main implementation
- `src/utils/__tests__/formNormalizer.test.js` (438 lines) - Test suite
- `src/utils/formNormalizerExamples.js` (458 lines) - Examples and demos
- `src/utils/testFormNormalizer.js` (147 lines) - Simple test runner
- `docs/phase2-form-template-normalizer-complete.md` - This documentation

**Total:** 1,457 lines of production-ready code with comprehensive testing and documentation.

Phase 2 is **COMPLETE** and ready for production use. The normalizer successfully bridges the gap between diverse input formats and the internal questionnaire system, providing a robust foundation for the unified forms architecture.