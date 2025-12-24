import React from 'react';

// Extended Token System for "Vibe" Control
export const THEME_PRESETS: Record<string, React.CSSProperties> = {
    'stelly': {
        // Base Colors - Electric Blue Core (Matches Landing Page)
        '--color-primary': '#2563EB', // Blue 600
        '--color-primary-contrast': '#FFFFFF',
        '--color-secondary': '#4F46E5', // Indigo 600

        // Backgrounds - Clean White (Matches Landing Page)
        '--color-bg-app': '#FFFFFF',
        '--color-bg-surface': '#FFFFFF',

        // Typography & Text - Slate Scale
        '--color-text-main': '#0F172A', // Slate 900
        '--color-text-muted': '#64748B', // Slate 500
        '--font-heading-case': 'none',
        '--font-heading-weight': '800', // Extra bold headings

        // Shapes & Texture
        '--color-border': '#E2E8F0', // Slate 200
        '--radius-sm': '0.5rem',
        '--radius-md': '1rem',
        '--radius-lg': '1.5rem', // Rounded corners like the mockups
        '--shadow-depth': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '--glass-blur': '8px',
        '--overlay-opacity': '0.05',
    } as React.CSSProperties,

    'mono-luxe': {
        // Base Colors
        '--color-primary': '#000000',
        '--color-primary-contrast': '#FFFFFF',
        '--color-secondary': '#6B7280',

        // Backgrounds
        '--color-bg-app': '#F9FAFB', // Cool Gray 50
        '--color-bg-surface': '#FFFFFF',

        // Typography & Text
        '--color-text-main': '#111827',
        '--color-text-muted': '#6B7280',
        '--font-heading-case': 'uppercase', // Aggressive branding
        '--font-heading-weight': '900',     // Heavy headers

        // Shapes & Texture
        '--color-border': '#E5E7EB',
        '--radius-sm': '0px',
        '--radius-md': '0px',
        '--radius-lg': '0px',
        '--shadow-depth': 'none',
        '--glass-blur': '0px', // No glass, solid colors
        '--overlay-opacity': '0.1', // Subtle overlay
    } as React.CSSProperties,

    'fresh-market': {
        // Base Colors
        '--color-primary': '#16A34A', // Green 600
        '--color-primary-contrast': '#FFFFFF',
        '--color-secondary': '#F59E0B', // Amber 500

        // Backgrounds
        '--color-bg-app': '#F0FDF4', // Green 50
        '--color-bg-surface': '#FFFFFF',

        // Typography & Text
        '--color-text-main': '#14532D', // Green 900
        '--color-text-muted': '#15803D', // Green 700
        '--font-heading-case': 'none',   // Friendly, natural
        '--font-heading-weight': '700',

        // Shapes & Texture
        '--color-border': '#BBF7D0',
        '--radius-sm': '8px',
        '--radius-md': '16px',
        '--radius-lg': '24px',
        '--shadow-depth': '0px 10px 15px -3px rgba(22, 163, 74, 0.1)',
        '--glass-blur': '12px', // Frosted glass effect
        '--overlay-opacity': '0.4',
    } as React.CSSProperties,

    'tech-ocean': {
        // Base Colors
        '--color-primary': '#3B82F6', // Blue 500
        '--color-primary-contrast': '#FFFFFF',
        '--color-secondary': '#64748B',

        // Backgrounds - DARK MODE DEFAULT
        '--color-bg-app': '#0F172A', // Slate 900
        '--color-bg-surface': '#1E293B', // Slate 800

        // Typography & Text
        '--color-text-main': '#F8FAFC',
        '--color-text-muted': '#94A3B8',
        '--font-heading-case': 'uppercase',
        '--font-heading-weight': '600', // Technical precision

        // Shapes & Texture
        '--color-border': '#334155',
        '--radius-sm': '4px',
        '--radius-md': '8px',
        '--radius-lg': '12px',
        '--shadow-depth': '0 0 0 1px rgba(59, 130, 246, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.3)', // Glowing border
        '--glass-blur': '4px',
        '--overlay-opacity': '0.7',
    } as React.CSSProperties,
};

export interface TenantThemeConfig {
    preset?: string;
    primary_color?: string;
    font_family?: string;
}

export const applyTheme = (preset: string, config: TenantThemeConfig) => {
    // 1. Load Preset (fallback to Mono Luxe)
    const base = THEME_PRESETS[preset] || THEME_PRESETS['mono-luxe'];

    const themeStyles: React.CSSProperties = {
        ...base,
    };

    // 2. Apply Overrides
    if (config.primary_color) {
        themeStyles['--color-primary'] = config.primary_color;
    }

    if (config.font_family) {
        themeStyles['--font-heading'] = config.font_family;
        themeStyles['--font-body'] = config.font_family;
    }

    return themeStyles;
};