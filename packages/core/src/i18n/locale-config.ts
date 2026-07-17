export interface LocaleConfig {
  /** BCP-47 locale tag. */
  readonly locale: string;
  /** 0 = Sunday, 1 = Monday, ... 6 = Saturday. */
  readonly firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Direction. Determined from locale or overridden. */
  readonly direction: 'ltr' | 'rtl';
  /** IANA time zone used for "today" calculations. */
  readonly timeZone?: string;
  /**
   * Weekday indexes treated as weekend (0 = Sunday .. 6 = Saturday).
   * Derived from `Intl.Locale` week info where available; defaults to [0, 6].
   * Always populated by {@link resolveLocaleConfig}.
   */
  readonly weekendDays?: ReadonlyArray<number>;
}

/** Fallback first-day-of-week per locale family when Intl week info is unavailable. */
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

/** Shape of `Intl.Locale` week info (1 = Monday .. 7 = Sunday). */
interface IntlWeekInfo {
  readonly firstDay: number;
  readonly weekend?: ReadonlyArray<number>;
}

/**
 * Read week info off an `Intl.Locale`, supporting both the method form
 * (`getWeekInfo()`, current spec) and the older accessor form (`.weekInfo`).
 */
const intlWeekInfo = (tag: Intl.Locale): IntlWeekInfo | undefined => {
  const t = tag as Intl.Locale & {
    getWeekInfo?: () => IntlWeekInfo;
    weekInfo?: IntlWeekInfo;
  };
  try {
    const info = typeof t.getWeekInfo === 'function' ? t.getWeekInfo() : t.weekInfo;
    if (info && typeof info.firstDay === 'number') return info;
  } catch {
    /* unsupported — fall back to the region table */
  }
  return undefined;
};

/** Intl weekday (1 = Mon .. 7 = Sun) → engine convention (0 = Sun .. 6 = Sat). */
const fromIntlDay = (day: number): number => day % 7;

export const resolveLocaleConfig = (input: string | Partial<LocaleConfig> = {}): LocaleConfig => {
  const partial = typeof input === 'string' ? { locale: input } : input;
  const locale = partial.locale ?? detectBrowserLocale();

  let firstDayOfWeek: LocaleConfig['firstDayOfWeek'] = 1;
  let weekendDays: ReadonlyArray<number> = [0, 6];
  let direction: LocaleConfig['direction'] = 'ltr';
  try {
    const tag = new Intl.Locale(locale);
    const info = intlWeekInfo(tag);
    if (info) {
      firstDayOfWeek = fromIntlDay(info.firstDay) as LocaleConfig['firstDayOfWeek'];
      if (info.weekend && info.weekend.length > 0) {
        weekendDays = info.weekend.map(fromIntlDay);
      }
    } else {
      const region = tag.region;
      if (region && region in DEFAULT_FIRST_DAY) {
        firstDayOfWeek = DEFAULT_FIRST_DAY[region] as 0 | 1 | 6;
      }
    }
    if (RTL_LANGS.has(tag.language)) direction = 'rtl';
  } catch {
    /* fall back to defaults */
  }

  const config: LocaleConfig = {
    locale,
    firstDayOfWeek: partial.firstDayOfWeek ?? firstDayOfWeek,
    direction: partial.direction ?? direction,
    weekendDays: partial.weekendDays ?? weekendDays,
    ...(partial.timeZone !== undefined ? { timeZone: partial.timeZone } : {}),
  };
  return config;
};
