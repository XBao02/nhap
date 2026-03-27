export const randomId = (numberOfDigit = 4) => {
  const chars = '0123456789';
  let randomId = '';
  for (let i = 0; i < numberOfDigit; i++) {
    randomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomId;
};

export const generateUID = (prefix = '') => {
  const timestamp = Date.now().toString();
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomId = '';
  for (let i = 0; i < 4; i++) {
    randomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${timestamp}${randomId}`;
};

// Alternative implementation with more entropy
export const generateUIDSecure = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${prefix}${timestamp}-${randomPart}-${extraRandom}`;
};

// For React keys - shorter and more readable
export const generateKey = (): string => {
  return `key_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
