/* // utils/validation.js
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim() === '') {
    return 'validation.emailRequired';
  }

  if (!emailRegex.test(email.trim())) {
    return 'validation.emailInvalid';
  }

  return null;
};

export const validatePassword = (password: string) => {
  if (!password || password.trim() === '') {
    return 'validation.passwordRequired';
  }

  if (password.length < 8) {
    return 'validation.passwordMinLength';
  }

  // Kiểm tra có ít nhất một chữ hoa
  if (!/[A-Z]/.test(password)) {
    return 'validation.passwordUppercase';
  }

  // Kiểm tra có ít nhất một chữ thường
  if (!/[a-z]/.test(password)) {
    return 'validation.passwordLowercase';
  }

  // Kiểm tra có ít nhất một ký tự đặc biệt
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return 'validation.passwordSpecialChar';
  }

  return null;
}; */

export const validateForm = (email: string, password: string) => {
  const errors: any = {} as any;

  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};


// register form
// validation.ts

/**
 * Validates full name
 * Requirements: At least 2 characters, only letters and spaces, no numbers or special chars
 */
export const validateName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'validation.nameRequired';
  }
  
  if (name.trim().length < 2) {
    return 'validation.nameMinLength';
  }
  
  if (name.trim().length > 50) {
    return 'validation.nameMaxLength';
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u1EA0-\u1EF9\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return 'validation.nameInvalid';
  }
  
  return null;
};

/**
 * Validates email address
 * Uses comprehensive email regex pattern
 */
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return 'validation.emailRequired';
  }
  
  // Comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email.trim())) {
    return 'validation.emailInvalid';
  }
  
  if (email.length > 254) {
    return 'validation.emailTooLong';
  }
  
  return null;
};

/**
 * Validates phone number
 * Supports various international formats
 */
export const validatePhoneNumber = (phone: string): string | null => {
  if (!phone || phone.trim().length === 0) {
    return 'validation.phoneRequired';
  }
  
  // Remove all spaces, hyphens, parentheses, and plus signs for validation
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Check if it contains only digits
  if (!/^\d+$/.test(cleanPhone)) {
    return 'validation.phoneInvalid';
  }
  
  // Check length (most phone numbers are 7-15 digits)
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return 'validation.phoneLength';
  }
  
  return null;
};

/**
 * Validates password strength
 * Requirements: At least 8 chars, uppercase, lowercase, number, special char
 */
export const validatePassword = (password: string): string | null => {
  if (!password || password.length === 0) {
    return 'validation.passwordRequired';
  }
  
  if (password.length < 8) {
    return 'validation.passwordMinLength';
  }
  
  if (password.length > 128) {
    return 'validation.passwordMaxLength';
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'validation.passwordUppercase';
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'validation.passwordLowercase';
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return 'validation.passwordNumber';
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'validation.passwordSpecialChar';
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'password123', 
    'admin123', 'welcome123', 'Password1'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'validation.passwordCommon';
  }
  
  return null;
};

/**
 * Validates the entire registration form
 * Returns validation result with errors object
 */
export const validateRegisterForm = (
  fullName: string,
  email: string,
  phoneNumber: string,
  password: string,
  confirmPassword: string,
  agreeTerms: boolean
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate each field
  const nameError = validateName(fullName);
  if (nameError) errors.fullName = nameError;
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const phoneError = validatePhoneNumber(phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  // Validate confirm password
  if (!confirmPassword || confirmPassword.length === 0) {
    errors.confirmPassword = 'validation.confirmPasswordRequired';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'register.passwordNotMatch';
  }
  
  // Validate terms agreement
  if (!agreeTerms) {
    errors.agreeTerms = 'validation.termsRequired';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Helper function to get password strength score (0-4)
 * Can be used for password strength indicators
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  // Bonus for longer passwords
  if (password.length >= 12) score = Math.min(score + 1, 5);
  
  return Math.min(score, 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return 'validation.passwordWeak';
    case 2:
      return 'validation.passwordFair';
    case 3:
      return 'validation.passwordGood';
    case 4:
      return 'validation.passwordStrong';
    default:
      return 'validation.passwordWeak';
  }
};

/**
 * Sanitize input by trimming and removing potential XSS characters
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};