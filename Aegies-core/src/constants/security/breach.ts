export const MOCK_BREACH_DATABASE: Record<string, { name: string; year: number; fields: string[] }[]> = {
  'test@example.com': [
    { name: 'LinkedIn', year: 2021, fields: ['email', 'password'] },
    { name: 'Dropbox', year: 2016, fields: ['email', 'password'] },
  ],
  'admin@example.com': [
    { name: 'Adobe', year: 2013, fields: ['email', 'password hint', 'password'] },
    { name: 'Collection #1', year: 2019, fields: ['email', 'password'] },
  ],
  'user@example.com': [
    { name: 'HaveIBeenPwned Test', year: 2023, fields: ['email'] },
  ],
};

export const COMMON_BREACH_NAMES = [
  'LinkedIn', 'Facebook', 'Adobe', 'Dropbox', 'Equifax',
  'Marriott', 'Yahoo', 'eBay', 'Target', 'Sony',
  'Collection #1', 'Collection #2-5', 'HaveIBeenPwned',
];
