# Sushimoto — Modern Restaurant Website

A production-quality, fully responsive restaurant website built with **Next.js 15**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + Global CSS (legacy sections)
- **Components:** shadcn/ui + Custom components
- **Animations:** AOS (Animate On Scroll) + Framer Motion
- **Icons:** Lucide React

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (header, footer, fonts, SEO)
│   ├── page.tsx            # Home page
│   ├── globals.css         # Tailwind v4 + brand theme + legacy CSS
│   ├── not-found.tsx       # 404 page
│   ├── loading.tsx         # Loading state
│   ├── error.tsx           # Error boundary
│   ├── robots.ts           # robots.txt
│   ├── sitemap.ts          # sitemap.xml
│   ├── menu/               # Menu pages (listing, category, item)
│   ├── about/              # About page
│   ├── gallery/            # Gallery page
│   ├── reservation/        # Reservation page
│   ├── catering/           # Catering page
│   ├── contact/            # Contact page
│   └── blog/               # Blog pages (listing, individual)
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Header, Footer, BackToTop, Container
│   ├── sections/           # Home page section components
│   ├── cards/              # Reusable card components
│   └── forms/              # Form components
│
├── data/                   # Mock data (foods, categories, blogs, etc.)
├── types/                  # TypeScript interfaces
├── lib/                    # Utilities (cn, etc.)
├── providers/              # Client-side providers (AOS)
├── hooks/                  # Custom hooks
└── styles/sections/        # Preserved legacy CSS (unchanged)
```

## Key Design Decisions

### Maximum UI Preservation
The original website's 7 sections (Hero, About, Popular, Trending, Subscribe, Header styles, Footer) use the **exact same CSS files** as before — moved to `src/styles/sections/` with only background-image URL paths updated. This guarantees pixel-identical rendering for all existing content.

### Brand Theme
Brand colors and fonts from the original design are ported to Tailwind v4's `@theme` block:
- **Primary:** `#b1454a` (red)
- **Secondary:** `#121212` (dark)
- **Background:** `#fff0de` (creamson)
- **Headings:** Playfair Display
- **Body:** Plus Jakarta Sans

### Pages
| Route | Content |
|---|---|
| `/` | Home page with 12 sections |
| `/menu` | Full menu with filters, search, sort |
| `/menu/[category]` | Category-filtered menu |
| `/menu/item/[slug]` | Food detail with nutrition, reviews |
| `/about` | Restaurant story, chef, timeline, awards |
| `/gallery` | Photo gallery with lightbox |
| `/reservation` | Reservation form with validation |
| `/catering` | Catering packages + inquiry form |
| `/contact` | Contact info, form, map placeholder |
| `/blog` | Blog listing with featured posts |
| `/blog/[slug]` | Full blog article |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run preview
```

All pages are statically generated (SSG) for optimal performance.

## Future Ready

Architecture supports future integration with:
- Authentication & admin panel
- CMS (Contentful, Sanity, etc.)
- Ordering & payment system
- Reservations API
- Multi-branch support
- Analytics
>>>>>>> 6694866 (converted to next)
