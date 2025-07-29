// Centralized admin configuration
// This should be moved to environment variables in production

export const ADMIN_EMAILS = [
  'knockriobeats@gmail.com',
  'info@mybeatfi.io', 
  'derykbanks@yahoo.com',
  'knockriobeats2@gmail.com'
];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const getAdminEmails = (): string[] => {
  return [...ADMIN_EMAILS];
}; 