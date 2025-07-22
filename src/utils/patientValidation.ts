/**
 * @fileoverview Patient-specific validation utilities
 * Comprehensive validation functions for patient data with TypeScript support
 */

// Type definitions for validation results
type ValidationResult = true | string;

interface ValidationOptions {
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
}

interface InsuranceInfo {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  copay?: string;
  effectiveDate?: string;
}

interface PatientData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  zipCode?: string;
  insuranceInfo?: InsuranceInfo;
}

// Phone number validation
export const validatePhoneNumber = (
  phone: string | null | undefined, 
  isRequired: boolean = false
): ValidationResult => {
  // Handle empty values
  if (!phone || phone.trim() === '') {
    return isRequired ? 'Phone number is required' : true;
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid US phone number (10 digits)
  if (cleaned.length !== 10) {
    return 'Phone number must be 10 digits';
  }

  // Check for valid area code (first digit can't be 0 or 1)
  if (cleaned[0] === '0' || cleaned[0] === '1') {
    return 'Invalid area code';
  }

  return true;
};

// Email validation (enhanced)
export const validateEmail = (email: string | null | undefined): ValidationResult => {
  if (!email) return 'Email is required';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return true;
};

// Date of birth validation
export const validateDateOfBirth = (dob: string | Date | null | undefined): ValidationResult => {
  if (!dob) return 'Date of birth is required';

  const birthDate = new Date(dob);
  const today = new Date();

  // Check if the date is valid
  if (isNaN(birthDate.getTime())) {
    return 'Please enter a valid date';
  }

  // Check if date is in the future (compare dates, not times)
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const birthDateOnly = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (birthDateOnly > todayDate) {
    return 'Date of birth cannot be in the future';
  }

  // Calculate age more accurately
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  // Check minimum age (must be at least 13 for COPPA compliance)
  if (age < 13) {
    return 'Patient must be at least 13 years old';
  }

  // Check maximum age (reasonable limit)
  if (age > 120) {
    return 'Please enter a valid date of birth';
  }

  return true;
};

// ZIP code validation
export const validateZipCode = (zip: string | null | undefined): ValidationResult => {
  if (!zip) return true; // Allow empty for optional fields

  // US ZIP code format: 12345 or 12345-6789
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zip)) {
    return 'Please enter a valid ZIP code (12345 or 12345-6789)';
  }

  return true;
};

// Insurance policy number validation
export const validatePolicyNumber = (policyNumber: string | null | undefined): ValidationResult => {
  if (!policyNumber) return true; // Allow empty for optional fields

  // Basic validation - alphanumeric, hyphens, and spaces allowed
  const policyRegex = /^[A-Za-z0-9\s\-]+$/;
  if (!policyRegex.test(policyNumber)) {
    return 'Policy number can only contain letters, numbers, spaces, and hyphens';
  }

  if (policyNumber.length < 3) {
    return 'Policy number must be at least 3 characters';
  }

  return true;
};

// Name validation
export const validateName = (
  name: string | null | undefined, 
  fieldName: string = 'Name'
): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return `${fieldName} is required`;
  }

  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }

  if (name.trim().length > 50) {
    return `${fieldName} must be less than 50 characters`;
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[A-Za-z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }

  return true;
};

// Insurance provider validation
export const validateInsuranceProvider = (provider: string | null | undefined): ValidationResult => {
  if (!provider) return true; // Allow empty for optional fields

  if (provider.trim().length < 2) {
    return 'Insurance provider must be at least 2 characters';
  }

  if (provider.trim().length > 100) {
    return 'Insurance provider must be less than 100 characters';
  }

  // Allow letters, numbers, spaces, periods, hyphens, and common symbols
  const providerRegex = /^[A-Za-z0-9\s\.\-&,()]+$/;
  if (!providerRegex.test(provider.trim())) {
    return 'Insurance provider contains invalid characters';
  }

  return true;
};

// Group number validation
export const validateGroupNumber = (groupNumber: string | null | undefined): ValidationResult => {
  if (!groupNumber) return true; // Allow empty for optional fields

  if (groupNumber.trim().length < 2) {
    return 'Group number must be at least 2 characters';
  }

  if (groupNumber.trim().length > 50) {
    return 'Group number must be less than 50 characters';
  }

  // Allow alphanumeric, hyphens, and spaces
  const groupRegex = /^[A-Za-z0-9\s\-]+$/;
  if (!groupRegex.test(groupNumber.trim())) {
    return 'Group number can only contain letters, numbers, spaces, and hyphens';
  }

  return true;
};

// Insurance copay validation
export const validateInsuranceCopay = (copay: string | number | null | undefined): ValidationResult => {
  if (!copay) return true; // Allow empty for optional fields

  // Convert to string if it's a number
  const copayStr = typeof copay === 'number' ? copay.toString() : copay;

  // Remove dollar sign and spaces for validation
  const cleanedCopay = copayStr.replace(/[$\s]/g, '');

  // Check if it's a valid number
  const copayNumber = parseFloat(cleanedCopay);
  if (isNaN(copayNumber)) {
    return 'Copay must be a valid amount (e.g., $25 or 25.00)';
  }

  if (copayNumber < 0) {
    return 'Copay cannot be negative';
  }

  if (copayNumber > 1000) {
    return 'Copay amount seems unusually high. Please verify.';
  }

  return true;
};

// Insurance effective date validation
export const validateInsuranceEffectiveDate = (effectiveDate: string | Date | null | undefined): ValidationResult => {
  if (!effectiveDate) return true; // Allow empty for optional fields

  const date = new Date(effectiveDate);
  const today = new Date();

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Please enter a valid effective date';
  }

  // Allow dates up to 10 years in the past and 1 year in the future
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  if (date < tenYearsAgo) {
    return 'Insurance effective date cannot be more than 10 years ago';
  }

  if (date > oneYearFromNow) {
    return 'Insurance effective date cannot be more than 1 year in the future';
  }

  return true;
};

// Enhanced email validation with common domain checks
export const validateEmailEnhanced = (email: string | null | undefined): ValidationResult => {
  if (!email) return 'Email is required';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  // Check for common typos in domains
  const domain = email.split('@')[1]?.toLowerCase();

  if (domain) {
    // Check for common typos
    const typoChecks: Record<string, string> = {
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };

    if (typoChecks[domain]) {
      return `Did you mean ${email.replace(domain, typoChecks[domain])}?`;
    }
  }

  return true;
};

// Comprehensive patient data validation
export const validatePatientData = (patientData: PatientData): Record<string, ValidationResult> => {
  const errors: Record<string, ValidationResult> = {};

  // Validate required fields
  if (patientData.firstName !== undefined) {
    const firstNameResult = validateName(patientData.firstName, 'First name');
    if (firstNameResult !== true) {
      errors.firstName = firstNameResult;
    }
  }

  if (patientData.lastName !== undefined) {
    const lastNameResult = validateName(patientData.lastName, 'Last name');
    if (lastNameResult !== true) {
      errors.lastName = lastNameResult;
    }
  }

  if (patientData.email !== undefined) {
    const emailResult = validateEmailEnhanced(patientData.email);
    if (emailResult !== true) {
      errors.email = emailResult;
    }
  }

  if (patientData.phone !== undefined) {
    const phoneResult = validatePhoneNumber(patientData.phone);
    if (phoneResult !== true) {
      errors.phone = phoneResult;
    }
  }

  if (patientData.dateOfBirth !== undefined) {
    const dobResult = validateDateOfBirth(patientData.dateOfBirth);
    if (dobResult !== true) {
      errors.dateOfBirth = dobResult;
    }
  }

  if (patientData.zipCode !== undefined) {
    const zipResult = validateZipCode(patientData.zipCode);
    if (zipResult !== true) {
      errors.zipCode = zipResult;
    }
  }

  // Validate insurance information if provided
  if (patientData.insuranceInfo) {
    const insurance = patientData.insuranceInfo;

    if (insurance.provider !== undefined) {
      const providerResult = validateInsuranceProvider(insurance.provider);
      if (providerResult !== true) {
        errors.insuranceProvider = providerResult;
      }
    }

    if (insurance.policyNumber !== undefined) {
      const policyResult = validatePolicyNumber(insurance.policyNumber);
      if (policyResult !== true) {
        errors.insurancePolicyNumber = policyResult;
      }
    }

    if (insurance.groupNumber !== undefined) {
      const groupResult = validateGroupNumber(insurance.groupNumber);
      if (groupResult !== true) {
        errors.insuranceGroupNumber = groupResult;
      }
    }

    if (insurance.copay !== undefined) {
      const copayResult = validateInsuranceCopay(insurance.copay);
      if (copayResult !== true) {
        errors.insuranceCopay = copayResult;
      }
    }

    if (insurance.effectiveDate !== undefined) {
      const effectiveDateResult = validateInsuranceEffectiveDate(insurance.effectiveDate);
      if (effectiveDateResult !== true) {
        errors.insuranceEffectiveDate = effectiveDateResult;
      }
    }
  }

  return errors;
};

// Format phone number for display
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

// Format ZIP code for display
export const formatZipCode = (zip: string | null | undefined): string => {
  if (!zip) return '';

  const cleaned = zip.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }

  return zip;
};

// Format insurance copay for display
export const formatInsuranceCopay = (copay: string | number | null | undefined): string => {
  if (!copay) return '';

  const copayStr = typeof copay === 'number' ? copay.toString() : copay;
  const cleaned = copayStr.replace(/[$\s]/g, '');
  const number = parseFloat(cleaned);

  if (!isNaN(number)) {
    return `$${number.toFixed(2)}`;
  }

  return copayStr;
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string | Date): number | null => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(birthDate.getTime())) {
    return null;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

// Check if patient is a minor (under 18)
export const isMinor = (dateOfBirth: string | Date): boolean => {
  const age = calculateAge(dateOfBirth);
  return age !== null && age < 18;
};

// Sanitize patient data for safe storage
export const sanitizePatientData = (data: PatientData): PatientData => {
  const sanitized: PatientData = {};

  if (data.firstName) {
    sanitized.firstName = data.firstName.trim();
  }

  if (data.lastName) {
    sanitized.lastName = data.lastName.trim();
  }

  if (data.email) {
    sanitized.email = data.email.trim().toLowerCase();
  }

  if (data.phone) {
    // Store phone numbers in a consistent format (digits only)
    sanitized.phone = data.phone.replace(/\D/g, '');
  }

  if (data.dateOfBirth) {
    sanitized.dateOfBirth = data.dateOfBirth;
  }

  if (data.zipCode) {
    sanitized.zipCode = data.zipCode.trim();
  }

  if (data.insuranceInfo) {
    const insuranceInfo: InsuranceInfo = {};
    
    if (data.insuranceInfo.provider) {
      insuranceInfo.provider = data.insuranceInfo.provider.trim();
    }
    
    if (data.insuranceInfo.policyNumber) {
      insuranceInfo.policyNumber = data.insuranceInfo.policyNumber.trim();
    }
    
    if (data.insuranceInfo.groupNumber) {
      insuranceInfo.groupNumber = data.insuranceInfo.groupNumber.trim();
    }
    
    if (data.insuranceInfo.copay) {
      insuranceInfo.copay = data.insuranceInfo.copay.toString().trim();
    }
    
    if (data.insuranceInfo.effectiveDate) {
      insuranceInfo.effectiveDate = data.insuranceInfo.effectiveDate;
    }
    
    sanitized.insuranceInfo = insuranceInfo;
  }

  return sanitized;
};

// Export types for use in other parts of the application
export type {
  ValidationResult,
  ValidationOptions,
  InsuranceInfo,
  PatientData,
};
