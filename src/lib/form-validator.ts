
export interface FormElementOption {
    id: string;
    value: string;
    label: string;
  }
  
  export interface FormElement {
    id: string;
    type: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: FormElementOption[];
  }
  
  export interface FormPage {
    id: string;
    title: string;
    elements: FormElement[];
  }
  
  export interface FormSchema {
    title: string;
    description?: string;
    pages: FormPage[];
  }
  
  interface ValidationError {
    path: string;
    message: string;
  }
  
  export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: string[];
    formSchema: FormSchema | null;
  }
  
  export function validateFormSchema(json: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
  
    if (!json) {
      errors.push({ path: 'root', message: 'JSON object cannot be null or undefined.' });
      return { isValid: false, errors, warnings, formSchema: null };
    }
  
    // Basic structure validation
    if (typeof json.title !== 'string' || json.title.trim() === '') {
      errors.push({ path: 'title', message: 'Form must have a non-empty title.' });
    }
    if (!Array.isArray(json.pages) || json.pages.length === 0) {
      errors.push({ path: 'pages', message: 'Form must have at least one page.' });
    }
  
    if (errors.length > 0) {
      return { isValid: false, errors, warnings, formSchema: null };
    }
  
    // Detailed validation
    const elementIds = new Set<string>();

    json.pages.forEach((page: any, pageIndex: number) => {
      if (!page.id) errors.push({ path: `pages[${pageIndex}]`, message: 'Page is missing an id.' });
      if (!page.title) errors.push({ path: `pages[${pageIndex}]`, message: 'Page is missing a title.' });
      if (!Array.isArray(page.elements)) {
        errors.push({ path: `pages[${pageIndex}]`, message: 'Page elements must be an array.' });
      } else {
        page.elements.forEach((el: any, elIndex: number) => {
          const path = `pages[${pageIndex}].elements[${elIndex}]`;
          if (!el.id) errors.push({ path, message: 'Element is missing an id.' });
          if (!el.type) errors.push({ path, message: 'Element is missing a type.' });
          if (!el.label) errors.push({ path, message: 'Element is missing a label.' });
          
          if (el.id) {
            if (elementIds.has(el.id)) {
                errors.push({ path, message: `Duplicate element id found: ${el.id}` });
            }
            elementIds.add(el.id);
          }

          if (['radio', 'checkbox', 'select'].includes(el.type)) {
            if (!Array.isArray(el.options) || el.options.length === 0) {
              errors.push({ path: `${path}.options`, message: 'Options array is required for this element type.' });
            } else {
              el.options.forEach((opt: any, optIndex: number) => {
                const optPath = `${path}.options[${optIndex}]`;
                if (!opt.id) errors.push({ path: optPath, message: 'Option is missing an id.' });
                if (!opt.value) errors.push({ path: optPath, message: 'Option is missing a value.' });
                if (!opt.label) errors.push({ path: optPath, message: 'Option is missing a label.' });
              })
            }
          }
        });
      }
    });
  
    if (errors.length > 0) {
      return { isValid: false, errors, warnings, formSchema: null };
    }
  
    return { isValid: true, errors: [], warnings, formSchema: json as FormSchema };
  }
  