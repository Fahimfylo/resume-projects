export function generateId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2)}`;
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

export function parseBudget(budget: string): number {
  return parseInt(budget.replace(/[^0-9]/g, ''), 10) || 0;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
