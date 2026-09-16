/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface M3Palette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
}

/**
 * Configurable darkness parameters for testing and fine-tuning
 */
export interface ThemeDarknessConfig {
  /**
   * Main background lightness in percent (0 = pitch black #000000, 2.5 = deep OLED, 6 = lighter).
   * Default: 2.2%
   */
  backgroundLightness: number;

  /**
   * Surface/cards lightness in percent (0 = black, 5 = very dark, 10 = medium dark).
   * Default: 5.2%
   */
  surfaceLightness: number;

  /**
   * Secondary/container surface lightness in percent.
   * Default: 7.2%
   */
  surfaceContainerLightness: number;

  /**
   * Saturation of dark background/surface tint in percent (0 = neutral grayscale/black, 8 = subtle hint, 25 = vivid).
   * Default: 7%
   */
  tintSaturation: number;

  /**
   * Card glass opacity percentage (0-100%).
   * Default: 92%
   */
  glassOpacity: number;
}

/**
 * DEFAULT DARKNESS CONFIGURATION
 * Edit these values here to adjust the global default darkness across the entire application!
 */
export const DEFAULT_DARKNESS_CONFIG: ThemeDarknessConfig = {
  backgroundLightness: 2.2,
  surfaceLightness: 5.2,
  surfaceContainerLightness: 7.2,
  tintSaturation: 7,
  glassOpacity: 92,
};

export const M3_PRESETS: M3Palette[] = [
  // Preset 1: Orchid/Lavender (Standard Cozy Material You Purple)
  {
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    tertiary: '#EFB8C8',
    onTertiary: '#492532',
    tertiaryContainer: '#633B48',
    onTertiaryContainer: '#FFD8E4',
    background: '#08060b',
    onBackground: '#E6E1E5',
    surface: '#0f0c14',
    onSurface: '#E6E1E5',
  },
  // Preset 2: Emerald/Mint (Tech Fresh)
  {
    primary: '#86E3CE',
    onPrimary: '#00382E',
    primaryContainer: '#005143',
    onPrimaryContainer: '#A3FFEB',
    secondary: '#B4E1D5',
    onSecondary: '#1F342E',
    secondaryContainer: '#354B45',
    onSecondaryContainer: '#D0FDEC',
    tertiary: '#9ED5FF',
    onTertiary: '#003354',
    tertiaryContainer: '#004A77',
    onTertiaryContainer: '#CBE5FF',
    background: '#050907',
    onBackground: '#E1E3E0',
    surface: '#0b130f',
    onSurface: '#E1E3E0',
  },
  // Preset 3: Warm Peach/Terracotta (Sunset Autumn)
  {
    primary: '#FFB894',
    onPrimary: '#4F1F00',
    primaryContainer: '#702F00',
    onPrimaryContainer: '#FFDBCC',
    secondary: '#E6BEAC',
    onSecondary: '#442A1D',
    secondaryContainer: '#5C3F32',
    onSecondaryContainer: '#FFDBCF',
    tertiary: '#E2C48E',
    onTertiary: '#402D05',
    tertiaryContainer: '#59431A',
    onTertiaryContainer: '#FFE1BE',
    background: '#090605',
    onBackground: '#EBE0DC',
    surface: '#120d09',
    onSurface: '#EBE0DC',
  },
  // Preset 4: Ocean Breeze/Azure (Clean Professional)
  {
    primary: '#ADC6FF',
    onPrimary: '#002E6A',
    primaryContainer: '#004494',
    onPrimaryContainer: '#D8E2FF',
    secondary: '#C1C6D9',
    onSecondary: '#2B303E',
    secondaryContainer: '#414656',
    onSecondaryContainer: '#DDE2F6',
    tertiary: '#9EF5CF',
    onTertiary: '#003828',
    tertiaryContainer: '#00523C',
    onTertiaryContainer: '#BBF9DC',
    background: '#05070b',
    onBackground: '#E2E2E9',
    surface: '#0b0f16',
    onSurface: '#E2E2E9',
  },
  // Preset 5: Sakura Pink / Amber Gold (Sweet Flower)
  {
    primary: '#FFB1C8',
    onPrimary: '#5E112D',
    primaryContainer: '#7D2943',
    onPrimaryContainer: '#FFD9E1',
    secondary: '#E5BDC4',
    onSecondary: '#43292F',
    secondaryContainer: '#5C3F45',
    onSecondaryContainer: '#FFD9DF',
    tertiary: '#E5C185',
    onTertiary: '#412D00',
    tertiaryContainer: '#5C430D',
    onTertiaryContainer: '#FFE0A8',
    background: '#080507',
    onBackground: '#ECE0E1',
    surface: '#120b0f',
    onSurface: '#ECE0E1',
  },
  // Preset 6: Cosmic Orchid / Plum
  {
    primary: '#E9B3FF',
    onPrimary: '#4B007B',
    primaryContainer: '#6A00AA',
    onPrimaryContainer: '#F7D8FF',
    secondary: '#DBC0E5',
    onSecondary: '#3E2B48',
    secondaryContainer: '#55415F',
    onSecondaryContainer: '#F8D8FF',
    tertiary: '#FFB3A7',
    onTertiary: '#5C150E',
    tertiaryContainer: '#7C2A22',
    onTertiaryContainer: '#FFDAD5',
    background: '#07050a',
    onBackground: '#E8E0E8',
    surface: '#100b16',
    onSurface: '#E8E0E8',
  }
];

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

export function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Extracts hue number (0-360) from a hex color string
 */
export function getPaletteHue(colorHex: string): number {
  const match = colorHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (match) {
    const r = parseInt(match[1], 16);
    const g = parseInt(match[2], 16);
    const b = parseInt(match[3], 16);
    return rgbToHsl(r, g, b).h;
  }
  return 270;
}

/**
 * Resolves current darkness configuration from URL query, localStorage, or defaults
 */
export function getDarknessConfig(): ThemeDarknessConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_DARKNESS_CONFIG };
  
  // 1. Check URL parameters if present (e.g. ?bgLightness=1.5&surfaceLightness=4.5 or ?darkness=1)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlDarkness = params.get('darkness');
    const urlBg = params.get('bgLightness');
    const urlSurface = params.get('surfaceLightness');
    const urlSat = params.get('tintSaturation');
    const urlGlass = params.get('glassOpacity');

    if (urlDarkness !== null || urlBg !== null || urlSurface !== null) {
      const bgVal = urlBg !== null ? parseFloat(urlBg) : (urlDarkness !== null ? parseFloat(urlDarkness) : DEFAULT_DARKNESS_CONFIG.backgroundLightness);
      const surfVal = urlSurface !== null ? parseFloat(urlSurface) : (urlDarkness !== null ? parseFloat(urlDarkness) + 3 : DEFAULT_DARKNESS_CONFIG.surfaceLightness);
      return {
        backgroundLightness: isNaN(bgVal) ? DEFAULT_DARKNESS_CONFIG.backgroundLightness : bgVal,
        surfaceLightness: isNaN(surfVal) ? DEFAULT_DARKNESS_CONFIG.surfaceLightness : surfVal,
        surfaceContainerLightness: isNaN(surfVal) ? DEFAULT_DARKNESS_CONFIG.surfaceContainerLightness : surfVal + 2,
        tintSaturation: urlSat !== null ? parseFloat(urlSat) : DEFAULT_DARKNESS_CONFIG.tintSaturation,
        glassOpacity: urlGlass !== null ? parseFloat(urlGlass) : DEFAULT_DARKNESS_CONFIG.glassOpacity,
      };
    }
  } catch {}

  // 2. Check localStorage cache
  try {
    const cached = window.localStorage.getItem('m3_darkness_config');
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_DARKNESS_CONFIG, ...parsed };
    }
  } catch {}

  return { ...DEFAULT_DARKNESS_CONFIG };
}

/**
 * Computes deep dark harmonized surfaces from palette hue and darkness config
 */
export function computeDarkSurfaces(palette: M3Palette, config: ThemeDarknessConfig = getDarknessConfig()) {
  const h = getPaletteHue(palette.primary);
  return {
    background: hslToHex(h, config.tintSaturation, config.backgroundLightness),
    surface: hslToHex(h, config.tintSaturation, config.surfaceLightness),
    surfaceContainer: hslToHex(h, config.tintSaturation, config.surfaceContainerLightness),
    onBackground: hslToHex(h, 4, 92),
    onSurface: hslToHex(h, 4, 92),
  };
}

let currentActivePalette: M3Palette = M3_PRESETS[0];

/**
 * Extracts the computed AccentColor from the browser and generates a dynamic Material You palette.
 * Falls back to a randomly picked high-harmony preset if not supported/present.
 */
export function initializeTheme(config: ThemeDarknessConfig = getDarknessConfig()): M3Palette & { source: 'system' | 'preset'; index?: number } {
  if (typeof document === 'undefined') {
    return { ...M3_PRESETS[0], source: 'preset', index: 0 };
  }

  try {
    // 1. Create a dummy element to check if 'AccentColor' works as a system CSS color
    const detector = document.createElement('div');
    detector.style.color = 'AccentColor';
    detector.style.position = 'absolute';
    detector.style.opacity = '0';
    detector.style.pointerEvents = 'none';
    document.body.appendChild(detector);
    
    const computedColorString = window.getComputedStyle(detector).color;
    document.body.removeChild(detector);

    // Parse 'rgb(X, Y, Z)'
    const match = computedColorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);

      // Avoid pure grays/black/white as accent colors
      const maxVal = Math.max(r, g, b);
      const minVal = Math.min(r, g, b);
      const chroma = maxVal - minVal;

      if (chroma > 15) {
        // Genuine system accent detected
        const { h, s } = rgbToHsl(r, g, b);
        const adjustedS = Math.max(30, Math.min(s, 75));

        const basePalette: M3Palette = {
          primary: hslToHex(h, adjustedS, 80),
          onPrimary: hslToHex(h, adjustedS, 20),
          primaryContainer: hslToHex(h, adjustedS - 10, 30),
          onPrimaryContainer: hslToHex(h, adjustedS - 10, 90),
          
          secondary: hslToHex((h + 20) % 360, Math.max(15, adjustedS - 20), 75),
          onSecondary: hslToHex((h + 20) % 360, Math.max(15, adjustedS - 20), 20),
          secondaryContainer: hslToHex((h + 20) % 360, Math.max(15, adjustedS - 20), 30),
          onSecondaryContainer: hslToHex((h + 20) % 360, Math.max(15, adjustedS - 20), 88),
          
          tertiary: hslToHex((h + 120) % 360, Math.min(85, adjustedS + 10), 82),
          onTertiary: hslToHex((h + 120) % 360, Math.min(85, adjustedS + 10), 22),
          tertiaryContainer: hslToHex((h + 120) % 360, Math.min(85, adjustedS + 10), 30),
          onTertiaryContainer: hslToHex((h + 120) % 360, Math.min(85, adjustedS + 10), 92),
          
          background: hslToHex(h, config.tintSaturation, config.backgroundLightness),
          onBackground: hslToHex(h, 4, 92),
          surface: hslToHex(h, config.tintSaturation, config.surfaceLightness),
          onSurface: hslToHex(h, 4, 92),
        };

        currentActivePalette = basePalette;
        return {
          ...basePalette,
          source: 'system'
        };
      }
    }
  } catch (e) {
    console.warn('System AccentColor detection failed, falling back to preset', e);
  }

  // 2. Fallback: Select a stored or random preset
  let cachedIndex = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    const cached = window.localStorage.getItem('m3_accent_theme_idx');
    if (cached !== null) {
      cachedIndex = parseInt(cached, 10);
    } else {
      cachedIndex = Math.floor(Math.random() * M3_PRESETS.length);
      window.localStorage.setItem('m3_accent_theme_idx', cachedIndex.toString());
    }
  } else {
    cachedIndex = Math.floor(Math.random() * M3_PRESETS.length);
  }

  cachedIndex = cachedIndex % M3_PRESETS.length;
  currentActivePalette = M3_PRESETS[cachedIndex];

  return { 
    ...M3_PRESETS[cachedIndex], 
    source: 'preset', 
    index: cachedIndex 
  };
}

/**
 * Applies the given theme properties to the HTML root container
 */
export function applyThemeProperties(palette: M3Palette, config: ThemeDarknessConfig = getDarknessConfig()) {
  if (typeof document === 'undefined') return;
  currentActivePalette = palette;
  const root = document.documentElement;

  const dark = computeDarkSurfaces(palette, config);

  root.style.setProperty('--color-m3-primary', palette.primary);
  root.style.setProperty('--color-m3-onPrimary', palette.onPrimary);
  root.style.setProperty('--color-m3-primaryContainer', palette.primaryContainer);
  root.style.setProperty('--color-m3-onPrimaryContainer', palette.onPrimaryContainer);
  
  root.style.setProperty('--color-m3-secondary', palette.secondary);
  root.style.setProperty('--color-m3-onSecondary', palette.onSecondary);
  root.style.setProperty('--color-m3-secondaryContainer', palette.secondaryContainer);
  root.style.setProperty('--color-m3-onSecondaryContainer', palette.onSecondaryContainer);
  
  root.style.setProperty('--color-m3-tertiary', palette.tertiary);
  root.style.setProperty('--color-m3-onTertiary', palette.onTertiary);
  root.style.setProperty('--color-m3-tertiaryContainer', palette.tertiaryContainer);
  root.style.setProperty('--color-m3-onTertiaryContainer', palette.onTertiaryContainer);

  root.style.setProperty('--color-m3-background', dark.background);
  root.style.setProperty('--color-m3-onBackground', dark.onBackground);
  root.style.setProperty('--color-m3-surface', dark.surface);
  root.style.setProperty('--color-m3-surfaceContainer', dark.surfaceContainer);
  root.style.setProperty('--color-m3-onSurface', dark.onSurface);
  
  root.style.setProperty('--m3-glass-opacity', `${config.glassOpacity}%`);
  root.style.setProperty('--m3-bg-lightness', `${config.backgroundLightness}%`);
  root.style.setProperty('--m3-surface-lightness', `${config.surfaceLightness}%`);
}

/**
 * Interactive testing helper for darkness tuning.
 * Can be called from browser console:
 *   __setSolasDarkness({ backgroundLightness: 0.5, surfaceLightness: 3.5 });
 *   __setSolasDarkness({ backgroundLightness: 0 }); // Pure pitch OLED black
 */
export function setSolasDarkness(newConfig: Partial<ThemeDarknessConfig>) {
  const current = getDarknessConfig();
  const merged: ThemeDarknessConfig = { ...current, ...newConfig };
  
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('m3_darkness_config', JSON.stringify(merged));
  }
  
  applyThemeProperties(currentActivePalette, merged);
  console.log('[Solas Theme] Darkness updated live:', merged);
  return merged;
}

/**
 * Resets darkness to DEFAULT_DARKNESS_CONFIG
 */
export function resetSolasDarkness() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('m3_darkness_config');
  }
  applyThemeProperties(currentActivePalette, DEFAULT_DARKNESS_CONFIG);
  console.log('[Solas Theme] Darkness reset to defaults:', DEFAULT_DARKNESS_CONFIG);
  return DEFAULT_DARKNESS_CONFIG;
}

// Attach helpers to window for easy browser console experimentation
if (typeof window !== 'undefined') {
  (window as any).__setSolasDarkness = setSolasDarkness;
  (window as any).__resetSolasDarkness = resetSolasDarkness;
  (window as any).__SOLAS_THEME__ = {
    getConfig: getDarknessConfig,
    setDarkness: setSolasDarkness,
    resetDarkness: resetSolasDarkness,
    applyPreset: (index: number) => {
      const idx = index % M3_PRESETS.length;
      if (window.localStorage) window.localStorage.setItem('m3_accent_theme_idx', idx.toString());
      currentActivePalette = M3_PRESETS[idx];
      applyThemeProperties(currentActivePalette, getDarknessConfig());
      console.log(`[Solas Theme] Switched to preset #${idx}:`, currentActivePalette);
    },
    presets: M3_PRESETS,
    defaults: DEFAULT_DARKNESS_CONFIG,
  };
}
