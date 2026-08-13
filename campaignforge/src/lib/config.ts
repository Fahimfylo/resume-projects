const configured = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

const localBase = 'http://localhost:4000/api/v1';
const prodBase = '/api/v1';

export const API_BASE = configured.endsWith('/api/v1')
  ? configured
  : configured
    ? `${configured}/api/v1`
    : (window.location.hostname === 'localhost' ? localBase : prodBase);
