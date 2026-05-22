export const ADMIN_EMAILS = [
  'aethelcare.help@gmail.com',
  'raisahab2727@gmail.com'
];

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());
};
