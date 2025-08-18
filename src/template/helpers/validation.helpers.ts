export const validateTemplateData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push("Template name is required and must be a non-empty string");
  }
  
  if (data.name && data.name.length > 255) {
    errors.push("Template name must be less than 255 characters");
  }
  
  if (!data.categoryId || typeof data.categoryId !== 'number' || data.categoryId <= 0) {
    errors.push("Valid category ID is required");
  }
  
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push("Tags must be an array");
  }
  
  if (data.tags && data.tags.length > 10) {
    errors.push("Cannot have more than 10 tags");
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.push("Description must be a string");
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push("Description must be less than 1000 characters");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTemplateId = (id: any): { isValid: boolean; error?: string } => {
  const numId = parseInt(id);
  
  if (isNaN(numId) || numId <= 0) {
    return {
      isValid: false,
      error: "Template ID must be a positive number"
    };
  }
  
  return { isValid: true };
};