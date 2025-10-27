/**
 * Seasonal color theming for dashboard icons
 * Automatically changes colors based on the current date
 */

export type Season = 'fall' | 'winter' | 'spring' | 'summer';

export interface SeasonalColors {
  background: string;
  text: string;
}

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
 * Returns the appropriate color classes for the current season
 * Includes both light and dark mode variants
 */
export function getSeasonalIconColors(): SeasonalColors {
  const season = getCurrentSeason();
  
  const colorMap: Record<Season, SeasonalColors> = {
    fall: {
      background: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400'
    },
    winter: {
      background: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400'
    },
    spring: {
      background: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400'
    },
    summer: {
      background: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400'
    }
  };
  
  return colorMap[season];
}
