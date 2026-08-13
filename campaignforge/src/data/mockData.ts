import { Project, Task, ContentItem, StrategyPlan, CalendarEvent } from '../types';

export const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'Summer Single-Origin Launch',
    businessName: 'Aalim Specialty Coffee',
    businessType: 'B2C E-commerce & Retail',
    goal: 'Launch our new Ethiopian Yirgacheffe single-origin cold brew cans and drive 10,000 subscriptions in 30 days.',
    targetAudience: {
      age: '24-38',
      gender: 'All',
      interests: ['Specialty Coffee', 'Minimalist Design', 'Sustainable Living', 'Remote Work'],
    },
    budget: '$8,500',
    status: 'active',
    progress: 66,
    tasksCount: { completed: 8, total: 12 },
    createdAt: '2026-06-15',
  },
  {
    id: 'p2',
    name: 'Aesthetic Interior Rebrand',
    businessName: 'Zuned Studio',
    businessType: 'Creative Agency / Interior Design',
    goal: 'Position the studio as the premier minimal brutalist interior architect in Tokyo and secure 3 high-profile commercial clients.',
    targetAudience: {
      age: '30-55',
      gender: 'All',
      interests: ['Architecture', 'Brutalist Design', 'Japanese Minimalist Art', 'Commercial Real Estate'],
    },
    budget: '$15,000',
    status: 'active',
    progress: 40,
    tasksCount: { completed: 2, total: 5 },
    createdAt: '2026-06-20',
  },
  {
    id: 'p3',
    name: 'SaaS Beta User Drive',
    businessName: 'Momentum App',
    businessType: 'SaaS / B2B Tech',
    goal: 'Acquire 500 high-intent B2B marketers and agency founders for our pre-beta platform via cold email and LinkedIn organic.',
    targetAudience: {
      age: '25-45',
      gender: 'All',
      interests: ['Growth Marketing', 'SaaS', 'AI Automation', 'Indie Hacking'],
    },
    budget: '$2,000',
    status: 'active',
    progress: 0,
    tasksCount: { completed: 0, total: 4 },
    createdAt: '2026-06-27',
  },
];

export const initialTasks: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Finalize packaging design labels (Grayscale & Gold accent)', status: 'done', priority: 'high', category: 'Design', dueDate: '2026-06-25', completed: true },
  { id: 't2', projectId: 'p1', title: 'Ship seed samples to 50 local micro-influencers', status: 'done', priority: 'high', category: 'PR / Outreach', dueDate: '2026-06-26', completed: true },
  { id: 't3', projectId: 'p1', title: 'Configure Shopify pre-order landing page checkout flow', status: 'done', priority: 'medium', category: 'Development', dueDate: '2026-06-27', completed: true },
  { id: 't4', projectId: 'p1', title: 'Publish Instagram launch announcement post & email blast', status: 'progress', priority: 'high', category: 'Content', dueDate: '2026-06-28', completed: false },
  { id: 't5', projectId: 'p1', title: 'Review Meta Ads campaign pixel setup and custom audiences', status: 'progress', priority: 'high', category: 'Marketing', dueDate: '2026-06-28', completed: false },
  { id: 't6', projectId: 'p1', title: 'Draft press release for sustainable packaging initiatives', status: 'todo', priority: 'low', category: 'PR', dueDate: '2026-07-02', completed: false },
  { id: 't7', projectId: 'p1', title: 'Optimize product photography for mobile viewport loading speed', status: 'todo', priority: 'medium', category: 'Design', dueDate: '2026-07-04', completed: false },
  { id: 't8', projectId: 'p1', title: 'Set up post-purchase feedback email automated sequence', status: 'todo', priority: 'low', category: 'Automation', dueDate: '2026-07-08', completed: false },
  { id: 't2-1', projectId: 'p2', title: 'Publish Tokyo commercial real estate landscape study', status: 'done', priority: 'high', category: 'Research', dueDate: '2026-06-24', completed: true },
  { id: 't2-2', projectId: 'p2', title: 'Host private gallery preview for select real estate owners', status: 'progress', priority: 'high', category: 'Event', dueDate: '2026-06-30', completed: false },
  { id: 't2-3', projectId: 'p2', title: 'Create brutalist print-brochure portfolio mailers', status: 'todo', priority: 'medium', category: 'Design', dueDate: '2026-07-05', completed: false },
  { id: 't3-1', projectId: 'p3', title: 'Compile database of 200 agency founders on LinkedIn', status: 'todo', priority: 'high', category: 'Sales', dueDate: '2026-06-29', completed: false },
  { id: 't3-2', projectId: 'p3', title: 'Configure email sequencing warmups (Instantly/Lemlist)', status: 'todo', priority: 'medium', category: 'Technical', dueDate: '2026-07-01', completed: false },
];

export const initialContentItems: ContentItem[] = [
  { id: 'c1', projectId: 'p1', platform: 'Instagram', contentType: 'Launch Announcement Image & Copy', text: 'Uncompromising origin. Pure extraction.\n\nIntroducing our Summer Single-Origin Cold Brew Cans. Crafted from naturally processed heirloom coffees harvested at 2,200m in Yirgacheffe, Ethiopia.\n\nExpect clean notes of white jasmine, bergamot, and a bright candied lemon finish.\n\nNow shipping nationwide. Link in bio to join the Single-Origin Club and receive 15% off forever.' },
  { id: 'c2', projectId: 'p1', platform: 'Twitter', contentType: 'Process Showcase Thread', text: 'How we achieved 18-hour slow extraction without bitterness. A brief design and culinary breakdown:\n\n1/ Water profile is stripped to 40 PPM, re-mineralized with magnesium and calcium for high-fidelity extraction of delicate organic fruit acids.\n\n2/ Dual-stage nylon filtration ensures zero silt remains. Clean mouthfeel, maximum flavor resolution.' },
  { id: 'c3', projectId: 'p1', platform: 'Email', contentType: 'Launch Email Broadcast', text: 'Subject: Yirgacheffe Cold Brew is now live.\n\nDear Coffee Lover,\n\nWe believe coffee is a sensory medium. For the past nine months, we have designed a cold brew experience that treats single-origin micro-lots with the absolute respect they deserve.\n\nToday, we launch our Summer Ethiopian Yirgacheffe Cold Brew cans.\n\nWe roast in micro-batches to maximize sweetness and immediately cold-brew over 18 hours using a tailored mineral water formula.\n\nOnly 2,400 cans are available for our first batch. Secure your allotment now.\n\nUse code SYSTEM_LAUNCH for complimentary shipping on your first case.' },
  { id: 'c4', projectId: 'p1', platform: 'LinkedIn', contentType: 'Founder Journey Post', text: 'Why we spent $8k on packaging design before roasting a single bean.\n\nIn specialty coffee, your package is your first point of physical interaction. If the bottle looks generic, the customer expects generic taste. We worked with Zuned Studio to design a brutalist, zero-waste canister that sits elegantly on any desktop workspace.\n\nGreat design is a promise. High quality product is the execution.' },
  { id: 'c2-1', projectId: 'p2', platform: 'LinkedIn', contentType: 'Brutalist Design Manifesto', text: 'Why modern commercial buildings feel hollow, and why minimal brutalism is the cure. Concrete isn\'t cold; it\'s honest. It shows structural integrity and creates a canvas of light and shadow that updates as the sun moves across the workspace. Zuned Studio Tokyo.' },
];

export const initialStrategies: Record<string, StrategyPlan> = {
  p1: {
    projectId: 'p1',
    executiveSummary: 'This campaign aims to secure market leadership in the premium B2C ready-to-drink coffee segment by highlighting Aalim Specialty Coffee\u2019s rigorous water science, organic single-origin sourcing, and highly polished aesthetic DNA. We target sophisticated urban remote workers who view workspace coffee as both a ritual and a design object.',
    corePillars: [
      { title: 'Aesthetic-First Sourcing', desc: 'Highlighting the beautiful brutalist canister packaging alongside premium photography to build visual cachet on social platforms.' },
      { title: 'Water & Extraction Science', desc: 'Educating consumers on 40 PPM mineralization, slow 18-hour brewing, and clean floral flavor profiles.' },
      { title: 'Substance Subscriptions', desc: 'Funneling traffic into the "Single-Origin Club" recurring model via custom Shopify checkout paths.' },
    ],
    targetPersonas: [
      { name: 'Sora Tanaka', role: 'Full-Stack Product Designer', painPoints: ['Inconsistent office coffee beans', 'Dislikes sugary, over-processed energy drinks', 'Desires a visually clean desktop aesthetic'] },
      { name: 'Lucas Vance', role: 'Creative Director & Consultant', painPoints: ['Needs premium, convenient hosting beverages', 'Seeks authentic sustainable brands with zero carbon footprints'] },
    ],
    timelinePhases: [
      { name: 'Phase 1: Seed Seeding', duration: 'Week 1-2', description: 'Deliver grayscale package cans to design-focused micro-influencers to secure organic aesthetic placement.' },
      { name: 'Phase 2: Launch & Blast', duration: 'Week 3', description: 'Activate Shopify checkout, launch email broadcasting, and deploy hyper-targeted Meta ad assets.' },
      { name: 'Phase 3: Retention & Continuity', duration: 'Week 4+', description: 'Deliver post-purchase automated customer sequences promoting the subscription model.' },
    ],
  },
  p2: {
    projectId: 'p2',
    executiveSummary: 'Zuned Studio rebrand focuses on establishing an uncompromising architectural authority in Tokyo by executing private gallery openings and brutalist design manifestos. We target commercial property developers who want office designs that inspire hybrid-workers to return to physical workspaces.',
    corePillars: [
      { title: 'Architectural Honesty', desc: 'Using concrete, glass, and light as structural statements without excessive decorative cladding.' },
      { title: 'Hybrid Work Inspiration', desc: 'Designing workspace layouts that balance private acoustic boxes with collaborative gallery spaces.' },
    ],
    targetPersonas: [
      { name: 'Kenji Sato', role: 'Commercial Real Estate Developer', painPoints: ['Struggling with high office vacancy rates in Shibuya', 'Needs unique, headline-grabbing design elements'] },
    ],
    timelinePhases: [
      { name: 'Phase 1: Brutalist Manifesto', duration: 'Week 1', description: 'Publish Tokyo commercial real estate landscape studies and structural honest design essays.' },
      { name: 'Phase 2: Private Showcase', duration: 'Week 2-3', description: 'Host private gallery exhibits in Meguro to showcase mock spatial plans to 15 key developers.' },
    ],
  },
};

export const initialCalendarEvents: CalendarEvent[] = [
  { id: 'ev1', projectId: 'p1', title: 'Instagram & Email Launch Blast', date: '2026-06-28', type: 'content', details: 'Post c1 to Instagram and send cold brew broadcast to 12k subscribers.' },
  { id: 'ev2', projectId: 'p1', title: 'Meta Ads Launch Review', date: '2026-06-28', type: 'task', details: 'Verify pixel tracking on custom Yirgacheffe landing page.' },
  { id: 'ev3', projectId: 'p1', title: 'Process Twitter Thread', date: '2026-06-29', type: 'content', details: 'Twitter process showcase thread about stripping minerals to 40 PPM.' },
  { id: 'ev4', projectId: 'p1', title: 'Influencer Post Tracking', date: '2026-06-30', type: 'task', details: 'Collect first wave stories and organic tags from 50 seed recipients.' },
  { id: 'ev5', projectId: 'p1', title: 'LinkedIn Sourcing Post', date: '2026-07-01', type: 'content', details: 'Founder journey write-up: "Why we spent $8k on packaging design before roasting."' },
  { id: 'ev6', projectId: 'p1', title: 'Eco Press Release Draft', date: '2026-07-02', type: 'task', details: 'Send eco packaging initiatives release to PR distribution.' },
];

export const initialChatMessages: Record<string, { id: string; text: string; isUser: boolean; timestamp: string }[]> = {
  p1: [
    { id: 'm1', text: "Hello! I am your Momentum strategy co-pilot. I have analyzed Aalim Specialty Coffee's goals. Ask me to draft content, adjust key priorities, or add brand-new items to your workspace.", isUser: false, timestamp: '10:00 AM' },
  ],
  p2: [
    { id: 'm2', text: "Hello! Ready to establish Zuned Studio's architectural authority in Tokyo? Ask me anything about executing the private gallery or publishing brutalist manifestos.", isUser: false, timestamp: '10:05 AM' },
  ],
};
