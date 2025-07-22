/**
 * @fileoverview Advanced form validation utilities
 * Based on the enhanced validation system from Zappy-Dashboard
 */

import { FormField, FormValidationError, ValidationRule } from '@/types/formTypes';

export class ValidationRules {
  static required(message = 'This field is required') {
    return {
      validate: (value: any) => {
        if (value === null || value === undefined || value === '') {
          return false;
        }
        if (Array.isArray(value) && value.length === 0) {
          return false;
        }
        return true;
      },
      message,
      type: 'required'
    };
  }

  static email(message = 'Please enter a valid email address') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      validate: (value: string) => {
        if (!value) return true; // Let required handle empty values
        return emailRegex.test(value);
      },
      message,
      type: 'email'
    };
  }

  static phone(message = 'Please enter a valid phone number') {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return {
      validate: (value: string) => {
        if (!value) return true;
        const cleaned = value.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleaned);
      },
      message,
      type: 'phone'
    };
  }

  static number(min?: number, max?: number, message?: string) {
    return {
      validate: (value: any) => {
        if (!value && value !== 0) return true;
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
      },
      message: message || `Please enter a number${min !== undefined ? ` between ${min}` : ''}${max !== undefined ? ` and ${max}` : ''}`,
      type: 'number'
    };
  }

  static textLength(minLength?: number, maxLength?: number, message?: string) {
    return {
      validate: (value: string) => {
        if (!value) return true;
        const length = value.length;
        if (minLength !== undefined && length < minLength) return false;
        if (maxLength !== undefined && length > maxLength) return false;
        return true;
      },
      message: message || `Text must be${minLength ? ` at least ${minLength}` : ''}${maxLength ? ` at most ${maxLength}` : ''} characters`,
      type: 'length'
    };
  }

  static date(minDate?: string, maxDate?: string, message?: string) {
    return {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        
        if (minDate) {
          const min = new Date(minDate);
          if (date < min) return false;
        }
        
        if (maxDate) {
          const max = new Date(maxDate);
          if (date > max) return false;
        }
        
        return true;
      },
      message: message || 'Please enter a valid date',
      type: 'date'
    };
  }

  static pattern(regex: RegExp, message = 'Invalid format') {
    return {
      validate: (value: string) => {
        if (!value) return true;
        return regex.test(value);
      },
      message,
      type: 'pattern'
    };
  }

  static custom(validateFn: (value: any, formData: Record<string, any>) => boolean | string, message = 'Validation failed') {
    return {
      validate: validateFn,
      message,
      type: 'custom'
    };
  }

  // Medical-specific validations
  static medicalId(type: 'ssn' | 'npi' | 'dea', message?: string) {
    const patterns = {
      ssn: /^\d{3}-?\d{2}-?\d{4}$/,
      npi: /^\d{10}$/,
      dea: /^[A-Z]{2}\d{7}$/
    };

    return {
      validate: (value: string) => {
        if (!value) return true;
        return patterns[type].test(value.replace(/\s/g, ''));
      },
      message: message || `Please enter a valid ${type.toUpperCase()}`,
      type: 'medical_id'
    };
  }
}

export class ConditionalRules {
  static evaluateCondition(condition: any, formData: Record<string, any>): boolean {
    const { field, operator, value } = condition;
    const fieldValue = formData[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'is_empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'is_not_empty':
        return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
      default:
        return false;
    }
  }

  static shouldShowField(field: FormField, formData: Record<string, any>): boolean {
    if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
      return true;
    }

    return field.conditionalLogic.some(condition => {
      if (condition.action === 'show') {
        return this.evaluateCondition(condition, formData);
      } else if (condition.action === 'hide') {
        return !this.evaluateCondition(condition, formData);
      }
      return true;
    });
  }

  static shouldRequireField(field: FormField, formData: Record<string, any>): boolean {
    if (field.required) return true;

    if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
      return false;
    }

    return field.conditionalLogic.some(condition => {
      return condition.action === 'require' && this.evaluateCondition(condition, formData);
    });
  }

  static shouldDisableField(field: FormField, formData: Record<string, any>): boolean {
    if (field.disabled) return true;

    if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
      return false;
    }

    return field.conditionalLogic.some(condition => {
      return condition.action === 'disable' && this.evaluateCondition(condition, formData);
    });
  }
}

export class CrossFieldRules {
  static matchField(otherFieldId: string, message = 'Fields must match') {
    return {
      validate: (value: any, formData: Record<string, any>) => {
        return value === formData[otherFieldId];
      },
      message,
      type: 'cross_field'
    };
  }

  static dependsOn(requiredFields: string[], message = 'Please fill in the required fields first') {
    return {
      validate: (value: any, formData: Record<string, any>) => {
        return requiredFields.every(fieldId => {
          const fieldValue = formData[fieldId];
          return fieldValue && fieldValue !== '';
        });
      },
      message,
      type: 'depends_on'
    };
  }

  static excludesWith(excludedFields: string[], message = 'This field cannot be used with other selected options') {
    return {
      validate: (value: any, formData: Record<string, any>) => {
        if (!value || value === '') return true;
        
        return !excludedFields.some(fieldId => {
          const fieldValue = formData[fieldId];
          return fieldValue && fieldValue !== '';
        });
      },
      message,
      type: 'excludes_with'
    };
  }
}

export class FormValidator {
  private schema: any;
  private formData: Record<string, any>;

  constructor(schema: any, formData: Record<string, any>) {
    this.schema = schema;
    this.formData = formData;
  }

  validateField(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];

    // Check if field should be shown
    if (!ConditionalRules.shouldShowField(field, this.formData)) {
      return errors;
    }

    // Check if field is required (including conditional requirements)
    const isRequired = ConditionalRules.shouldRequireField(field, this.formData);
    
    // Validate required
    if (isRequired) {
      const requiredRule = ValidationRules.required();
      if (!requiredRule.validate(value)) {
        errors.push({
          fieldId: field.id,
          fieldLabel: field.label,
          message: requiredRule.message,
          severity: 'error',
          type: 'required'
        });
        return errors; // Don't continue validation if required fails
      }
    }

    // Skip other validations if field is empty and not required
    if (!value && value !== 0 && !isRequired) {
      return errors;
    }

    // Run field-specific validations
    if (field.validation) {
      for (const rule of field.validation) {
        let isValid = true;
        let validationRule;

        switch (rule.type) {
          case 'email':
            validationRule = ValidationRules.email(rule.message);
            isValid = validationRule.validate(value);
            break;
          case 'phone':
            validationRule = ValidationRules.phone(rule.message);
            isValid = validationRule.validate(value);
            break;
          case 'min_length':
            validationRule = ValidationRules.textLength(rule.value, undefined, rule.message);
            isValid = validationRule.validate(value);
            break;
          case 'max_length':
            validationRule = ValidationRules.textLength(undefined, rule.value, rule.message);
            isValid = validationRule.validate(value);
            break;
          case 'pattern':
            if (rule.value) {
              validationRule = ValidationRules.pattern(new RegExp(rule.value), rule.message);
              isValid = validationRule.validate(value);
            }
            break;
          case 'custom':
            if (typeof rule.value === 'function') {
              const result = rule.value(value, this.formData);
              isValid = result === true || result === '';
            }
            break;
        }

        if (!isValid) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: rule.message,
            severity: rule.severity || 'error',
            type: rule.type
          });
        }
      }
    }

    return errors;
  }

  validateSection(sectionId: string): FormValidationError[] {
    const section = this.schema.sections.find((s: any) => s.id === sectionId);
    if (!section) return [];

    let errors: FormValidationError[] = [];

    for (const field of section.fields) {
      const fieldErrors = this.validateField(field, this.formData[field.id]);
      errors = errors.concat(fieldErrors);
    }

    return errors;
  }

  validateAll(): FormValidationError[] {
    let errors: FormValidationError[] = [];

    for (const section of this.schema.sections) {
      const sectionErrors = this.validateSection(section.id);
      errors = errors.concat(sectionErrors);
    }

    return errors;
  }

  isValid(): boolean {
    return this.validateAll().length === 0;
  }

  getCompletionPercentage(): number {
    let totalFields = 0;
    let filledFields = 0;

    for (const section of this.schema.sections) {
      for (const field of section.fields) {
        if (ConditionalRules.shouldShowField(field, this.formData)) {
          totalFields++;
          const value = this.formData[field.id];
          if (value && value !== '') {
            filledFields++;
          }
        }
      }
    }

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }
}

// Utility functions for medical forms
export class MedicalValidationUtils {
  static validateVitalSigns(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];
    
    if (!value) return errors;

    const vitalRanges: Record<string, { min: number; max: number; unit: string }> = {
      'blood_pressure_systolic': { min: 70, max: 200, unit: 'mmHg' },
      'blood_pressure_diastolic': { min: 40, max: 120, unit: 'mmHg' },
      'heart_rate': { min: 40, max: 200, unit: 'bpm' },
      'temperature': { min: 95, max: 108, unit: '°F' },
      'respiratory_rate': { min: 8, max: 40, unit: 'breaths/min' },
      'oxygen_saturation': { min: 70, max: 100, unit: '%' }
    };

    const vitalType = field.customAttributes?.vitalType;
    if (vitalType && vitalRanges[vitalType]) {
      const range = vitalRanges[vitalType];
      const numValue = Number(value);
      
      if (numValue < range.min || numValue > range.max) {
        errors.push({
          fieldId: field.id,
          fieldLabel: field.label,
          message: `Value should be between ${range.min} and ${range.max} ${range.unit}`,
          severity: 'warning',
          type: 'vital_range'
        });
      }
    }

    return errors;
  }

  static validateMedicationDosage(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];
    
    if (!value) return errors;

    // Basic dosage format validation (e.g., "10mg", "5ml", "1 tablet")
    const dosagePattern = /^\d+(\.\d+)?\s*(mg|ml|g|tablet|capsule|unit)s?$/i;
    
    if (!dosagePattern.test(value)) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Please enter a valid dosage (e.g., "10mg", "1 tablet")',
        severity: 'error',
        type: 'medication_dosage'
      });
    }

    return errors;
  }

  static validateAllergySeverity(field: FormField, value: any, formData: Record<string, any>): FormValidationError[] {
    const errors: FormValidationError[] = [];
    
    // If user reports an allergy, severity should be specified
    const allergyField = field.customAttributes?.allergyField;
    if (allergyField && formData[allergyField] && !value) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Please specify the severity of the allergy',
        severity: 'error',
        type: 'allergy_severity'
      });
    }

    return errors;
  }
}