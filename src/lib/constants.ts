// Blooglee — Centralized constants
// Update here when emails or pricing change, instead of hunting across 10+ files.

export const EMAILS = {
  general: 'info@blooglee.com',
  support: 'soporte@blooglee.com',
  billing: 'hola@blooglee.com',
} as const;

export const PRICING = {
  free: { price: 0, articles: 1, sites: 1 },
  starter: { price: 19, articles: 4, sites: 1 },
  pro: { price: 39, articles: 30, sites: 3 },
  agency: { price: 99, articles: -1, sites: 10 },
  annualDiscount: 0.20,
  currency: '€',
} as const;

export const SOCIAL = {
  instagram: 'https://www.instagram.com/blooglee_',
  linkedin: 'https://linkedin.com/company/blooglee',
  facebook: 'https://www.facebook.com/blooglee.ia/',
  tiktok: 'https://www.tiktok.com/@blooglee',
  whatsapp: '34600000000',
} as const;
