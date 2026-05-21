export interface LocaleConfig {
  /** BCP-47 locale tag. */
  readonly locale: string;
  /** 0 = Sunday, 1 = Monday, ... 6 = Saturday. */
  readonly firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Direction. Determined from locale or overridden. */
  readonly direction: 'ltr' | 'rtl';
  /** IANA time zone used for "today" calculations. */
  readonly timeZone?: string;
}

/** Best-effort first-day-of-week per locale family (Intl.Locale's getWeekInfo is not universal). */
const DEFAULT_FIRST_DAY: Readonly<Record<string, 0 | 1 | 6>> = {
  US: 0,
  CA: 0,
  AU: 0,
  NZ: 0,
  JP: 0,
  KR: 0,
  IL: 0,
  ZA: 0,
  EG: 6,
  SA: 6,
};

const RTL_LANGS: ReadonlySet<string> = new Set(['ar', 'fa', 'he', 'ur', 'yi', 'ps', 'syc']);

const detectBrowserLocale = (): string => {
  const g = globalThis as { navigator?: { language?: string } };
  return g.navigator?.language ?? 'en-US';
};

export const resolveLocaleConfig = (input: string | Partial<LocaleConfig> = {}): LocaleConfig => {
  const partial = typeof input === 'string' ? { locale: input } : input;
  const locale = partial.locale ?? detectBrowserLocale();

  let firstDayOfWeek: LocaleConfig['firstDayOfWeek'] = 1;
  let direction: LocaleConfig['direction'] = 'ltr';
  try {
    const tag = new Intl.Locale(locale);
    const region = tag.region;
    if (region && region in DEFAULT_FIRST_DAY) {
      firstDayOfWeek = DEFAULT_FIRST_DAY[region] as 0 | 1 | 6;
    }
    if (RTL_LANGS.has(tag.language)) direction = 'rtl';
  } catch {
    /* fall back to defaults */
  }

  const config: LocaleConfig = {
    locale,
    firstDayOfWeek: partial.firstDayOfWeek ?? firstDayOfWeek,
    direction: partial.direction ?? direction,
    ...(partial.timeZone !== undefined ? { timeZone: partial.timeZone } : {}),
  };
  return config;
};
