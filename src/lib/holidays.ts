/**
 * Built-in annual events (US holidays, shopping, creator) for calendar display.
 * Dates use fixed month/day; variable-date holidays (e.g. Easter, Thanksgiving) are approximate.
 */

export type BuiltInEvent = {
  key: string;
  title: string;
  month: number; // 1-12
  day: number;
  type: 'seasonal' | 'launch' | 'other';
  category: 'holiday' | 'shopping' | 'creator';
};

export const BUILT_IN_EVENTS: BuiltInEvent[] = [
  // US Holidays
  { key: 'new_years', title: 'New Year\'s Day', month: 1, day: 1, type: 'seasonal', category: 'holiday' },
  { key: 'valentines', title: 'Valentine\'s Day', month: 2, day: 14, type: 'seasonal', category: 'holiday' },
  { key: 'st_patricks', title: 'St. Patrick\'s Day', month: 3, day: 17, type: 'seasonal', category: 'holiday' },
  { key: 'easter', title: 'Easter', month: 4, day: 20, type: 'seasonal', category: 'holiday' },
  { key: 'mothers_day', title: 'Mother\'s Day', month: 5, day: 11, type: 'seasonal', category: 'holiday' },
  { key: 'memorial_day', title: 'Memorial Day', month: 5, day: 26, type: 'seasonal', category: 'holiday' },
  { key: 'fathers_day', title: 'Father\'s Day', month: 6, day: 15, type: 'seasonal', category: 'holiday' },
  { key: 'fourth_july', title: '4th of July', month: 7, day: 4, type: 'seasonal', category: 'holiday' },
  { key: 'labor_day', title: 'Labor Day', month: 9, day: 1, type: 'seasonal', category: 'holiday' },
  { key: 'halloween', title: 'Halloween', month: 10, day: 31, type: 'seasonal', category: 'holiday' },
  { key: 'veterans_day', title: 'Veterans Day', month: 11, day: 11, type: 'seasonal', category: 'holiday' },
  { key: 'thanksgiving', title: 'Thanksgiving', month: 11, day: 27, type: 'seasonal', category: 'holiday' },
  { key: 'christmas', title: 'Christmas', month: 12, day: 25, type: 'seasonal', category: 'holiday' },
  { key: 'new_years_eve', title: 'New Year\'s Eve', month: 12, day: 31, type: 'seasonal', category: 'holiday' },
  // Shopping events
  { key: 'black_friday', title: 'Black Friday', month: 11, day: 28, type: 'launch', category: 'shopping' },
  { key: 'cyber_monday', title: 'Cyber Monday', month: 12, day: 1, type: 'launch', category: 'shopping' },
  { key: 'prime_day', title: 'Amazon Prime Day', month: 7, day: 15, type: 'launch', category: 'shopping' },
  { key: 'back_to_school', title: 'Back to School', month: 8, day: 1, type: 'seasonal', category: 'shopping' },
  { key: 'super_bowl', title: 'Super Bowl', month: 2, day: 9, type: 'seasonal', category: 'shopping' },
  // Creator events
  { key: 'tiktok_shop_11_11', title: 'TikTok Shop 11.11', month: 11, day: 11, type: 'launch', category: 'creator' },
  { key: 'tiktok_shop_1212', title: 'TikTok Shop 12.12', month: 12, day: 12, type: 'launch', category: 'creator' },
];

export type BuiltInEventInstance = {
  id: string;
  date: string;
  title: string;
  type: 'seasonal' | 'launch' | 'other';
  isBuiltIn: true;
  key: string;
};

/**
 * Generate built-in event instances for a given year (ISO date strings).
 */
export function builtInEventsForYear(year: number): BuiltInEventInstance[] {
  return BUILT_IN_EVENTS.map((e) => {
    const month = String(e.month).padStart(2, '0');
    const day = String(e.day).padStart(2, '0');
    return {
      id: `builtin-${e.key}-${year}`,
      date: `${year}-${month}-${day}`,
      title: e.title,
      type: e.type,
      isBuiltIn: true as const,
      key: e.key,
    };
  });
}
