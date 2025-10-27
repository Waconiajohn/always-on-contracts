/**
 * Seasonal color theming for dashboard icons
 * Automatically changes icon colors based on the current date
 */

export type Season = 'fall' | 'winter' | 'spring' | 'summer';

/**
 * Determines the current season based on the month
 * Fall: September - November
 * Winter: December - February
 * Spring: March - May
 * Summer: June - August
 */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  
  if (month >= 8 && month <= 10) return 'fall'; // Sep-Nov (8-10)
  if (month === 11 || month <= 1) return 'winter'; // Dec-Feb (11, 0-1)
  if (month >= 2 && month <= 4) return 'spring'; // Mar-May (2-4)
  return 'summer'; // Jun-Aug (5-7)
}

/**
 * Returns an array of seasonal colors for icon variety
 * Each icon can pick from this palette to create visual diversity
 */
export function getSeasonalColorPalette(): string[] {
  const season = getCurrentSeason();
  
  const palettes: Record<Season, string[]> = {
    fall: [
      'text-amber-600 dark:text-amber-400',      // Gold
      'text-orange-700 dark:text-orange-500',    // Burnt orange
      'text-red-700 dark:text-red-500',          // Burnt red
      'text-yellow-700 dark:text-yellow-500',    // Deep yellow
      'text-amber-800 dark:text-amber-600',      // Brown
      'text-orange-600 dark:text-orange-400',    // Light orange
      'text-red-600 dark:text-red-400',          // Crimson
      'text-yellow-600 dark:text-yellow-400'     // Sunflower
    ],
    winter: [
      'text-blue-600 dark:text-blue-400',        // Ice blue
      'text-cyan-600 dark:text-cyan-400',        // Frost
      'text-slate-600 dark:text-slate-400',      // Cool gray
      'text-indigo-600 dark:text-indigo-400',    // Deep blue
      'text-blue-500 dark:text-blue-300',        // Sky blue
      'text-cyan-700 dark:text-cyan-500',        // Teal
      'text-slate-700 dark:text-slate-500',      // Silver
      'text-blue-700 dark:text-blue-500'         // Navy
    ],
    spring: [
      'text-green-600 dark:text-green-400',      // Fresh green
      'text-pink-600 dark:text-pink-400',        // Blossom pink
      'text-emerald-600 dark:text-emerald-400',  // Mint
      'text-lime-600 dark:text-lime-400',        // Lime green
      'text-rose-600 dark:text-rose-400',        // Rose
      'text-teal-600 dark:text-teal-400',        // Turquoise
      'text-green-500 dark:text-green-300',      // Light green
      'text-pink-500 dark:text-pink-300'         // Soft pink
    ],
    summer: [
      'text-yellow-600 dark:text-yellow-400',    // Sunny yellow
      'text-orange-600 dark:text-orange-400',    // Coral
      'text-sky-600 dark:text-sky-400',          // Sky blue
      'text-amber-600 dark:text-amber-400',      // Golden
      'text-red-600 dark:text-red-400',          // Bright red
      'text-cyan-600 dark:text-cyan-400',        // Turquoise
      'text-yellow-500 dark:text-yellow-300',    // Light yellow
      'text-orange-500 dark:text-orange-300'     // Peach
    ]
  };
  
  return palettes[season];
}

/**
 * Gets a specific seasonal color from the palette based on an index
 * Cycles through the palette if index exceeds available colors
 */
export function getSeasonalIconColor(index: number): string {
  const palette = getSeasonalColorPalette();
  return palette[index % palette.length];
}
