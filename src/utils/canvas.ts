import type { Archetype } from '../types';

function createSVGMarkup(archetype: Archetype, selfieDataUrl?: string): string {
  const size = 1024;
  const gradientId = 'grad1';
  const textColor = '#ffffff';

  const bg = archetype.colorPalette.includes('violet')
    ? ['#6a00f4', '#4f46e5']
    : ['#2563eb', '#7c3aed'];

  const robotStroke = '#e5e7eb';
  const robotFill = '#1f2937';

  const selfieImage = selfieDataUrl
    ? `<image href="${selfieDataUrl}" x="312" y="312" width="400" height="400" preserveAspectRatio="xMidYMid slice" clip-path="url(#headClip)" opacity="0.9" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="${gradientId}" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${bg[0]}" />
      <stop offset="100%" stop-color="${bg[1]}" />
    </radialGradient>
    <clipPath id="circleClip">
      <circle cx="512" cy="512" r="500" />
    </clipPath>
    <clipPath id="headClip">
      <circle cx="512" cy="460" r="150" />
    </clipPath>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <g clip-path="url(#circleClip)">
    <rect width="100%" height="100%" fill="url(#${gradientId})"/>

    <g opacity="0.2">
      <circle cx="200" cy="260" r="6" fill="#fff"/>
      <circle cx="820" cy="760" r="4" fill="#fff"/>
      <circle cx="700" cy="180" r="5" fill="#fff"/>
      <line x1="150" y1="600" x2="900" y2="600" stroke="#fff" stroke-opacity="0.25"/>
      <line x1="150" y1="350" x2="900" y2="350" stroke="#fff" stroke-opacity="0.15"/>
    </g>

    <g filter="url(#glow)">
      <rect x="300" y="350" rx="60" ry="60" width="424" height="520" fill="${robotFill}" stroke="${robotStroke}" stroke-width="8"/>
      <rect x="430" y="740" rx="30" ry="30" width="168" height="90" fill="#0ea5e9" stroke="${robotStroke}" stroke-width="6"/>
      <circle cx="512" cy="460" r="150" fill="#111827" stroke="${robotStroke}" stroke-width="8"/>
      <rect x="380" y="540" rx="18" ry="18" width="264" height="60" fill="#1f2937" stroke="${robotStroke}" stroke-width="6"/>
      <circle cx="460" cy="570" r="12" fill="#22d3ee"/>
      <circle cx="512" cy="570" r="12" fill="#22d3ee"/>
      <circle cx="564" cy="570" r="12" fill="#22d3ee"/>
      <rect x="360" y="880" rx="20" ry="20" width="304" height="40" fill="#111827" opacity="0.6"/>
    </g>

    ${selfieImage}

    <text x="50%" y="955" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="64" font-weight="800" fill="${textColor}">${archetype.name}</text>
  </g>
</svg>`;
}

export function svgDataUrl(archetype: Archetype, selfieDataUrl?: string): string {
  const svg = createSVGMarkup(archetype, selfieDataUrl);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
