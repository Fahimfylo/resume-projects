export const BUSINESS_TYPES = [
  'Retail & E-commerce',
  'B2B SaaS / Tech',
  'Creative Agency & Consulting',
  'Hospitality & Dining',
  'Creator, Media & Editorial',
] as const;

export const COMMON_GOALS = [
  'Drive 10,000 subscriptions in 30 days',
  'Secure 3 high-profile commercial clients',
  'Acquire 500 pre-beta SaaS users via organic leads',
  'Launch premium single-origin product packaging',
  'Double community membership with sustainable branding',
] as const;

export const AVAILABLE_INTERESTS = [
  'Minimalist Design',
  'Specialty Coffee',
  'Architecture & Spatial Art',
  'Sustainable Living',
  'Growth Marketing',
  'B2B Automation',
  'Tokyo Creative Culture',
  'Aesthetic Workspaces',
] as const;

export const AGE_BRACKETS = ['18-24', '24-38', '30-55', 'All ages'] as const;
export const GENDER_OPTIONS = ['All', 'Female', 'Male'] as const;

export const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export const CURRENT_MONTH = 'June 2026';

export const PLATFORM_FILTERS = ['All', 'Twitter', 'LinkedIn', 'Instagram', 'Email'] as const;
export const PRIORITY_FILTERS = ['all', 'high', 'medium', 'low'] as const;

export const NAVIGATION_ITEMS = [
  { label: 'View Dashboard', path: '/dashboard', shortcut: 'G D' },
  { label: 'Start New Project', path: '/onboarding', shortcut: 'G N' },
  { label: 'Return to Landing', path: '/', shortcut: 'G L' },
] as const;

export const MENU_LINKS = [
  { label: 'HOME', path: '/' },
  { label: 'HOW IT WORKS', path: '/#how-it-works' },
  { label: 'FEATURES', path: '/#features' },
  { label: 'PRICING', path: '/#pricing' },
  { label: 'WORKSPACE DASHBOARD', path: '/dashboard' },
] as const;

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', tab: undefined },
  { label: 'Project Strategy', path: '/workspace', tab: 'strategy' },
  { label: 'Tasks Board', path: '/workspace', tab: 'tasks' },
  { label: 'Content Library', path: '/workspace', tab: 'content' },
  { label: '30-Day Calendar', path: '/workspace', tab: 'calendar' },
  { label: 'Performance Analytics', path: '/workspace', tab: 'analytics' },
] as const;

export const WORKSPACE_TABS = ['strategy', 'tasks', 'content', 'calendar', 'analytics', 'chat'] as const;

export const GENERATION_STATUSES = [
  { title: 'Analyzing your business...', subtitle: 'Reading your unique goal & audience parameters' },
  { title: 'Building your strategy...', subtitle: 'Creating a tailored multi-phase marketing plan' },
  { title: 'Generating your tasks...', subtitle: 'Breaking objective into actionable Kanban checklist tasks' },
  { title: 'Writing your content...', subtitle: 'Creating custom copy for LinkedIn, Email, and social' },
  { title: 'Scheduling your calendar...', subtitle: 'Structuring the 30-day timeline scheduled events' },
  { title: 'Finalizing workspace...', subtitle: 'Assembling components and custom strategy co-pilot' },
] as const;

export const ACTIVITY_LINES = [
  'Business model parsed successfully',
  'Core demographic insights generated',
  '3 core marketing strategy pillars designed',
  '5 actionable tasks appended to todo board',
  'LinkedIn and Email promotional drafts written',
  '30-day scheduled campaign events calendar ready',
] as const;

export const QUICK_CHAT_PROMPTS = [
  'Draft a Twitter thread',
  'Recommend marketing ideas',
  'Add high priority task',
  'Evaluate target demographics',
] as const;

export const ANALYTICS_METRICS = [
  { label: 'LinkedIn Reach', val: '4,840 views', percent: '80%' },
  { label: 'Email Broadcast Open Rate', val: '42.6% opened', percent: '65%' },
  { label: 'Twitter Organic Clicks', val: '840 clicks', percent: '40%' },
  { label: 'Instagram Engagement', val: '12.4% rate', percent: '55%' },
] as const;
