declare module 'lunar-javascript' {
  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number
    ): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getEightChar(): EightChar;
    getYearGan(): string;
    getYearZhi(): string;
    getMonth(): number;
    getDay(): number;
    getYearInGanZhi(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getPrevJieQi(): { getName: () => string };
  }

  export class EightChar {
    getYear(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getYearHideGan(): string[];
    getYearShiShenGan(): string;
    getYearNaYin(): string;

    getMonth(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getMonthHideGan(): string[];
    getMonthShiShenGan(): string;
    getMonthNaYin(): string;

    getDay(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getDayHideGan(): string[];
    getDayShiShenGan(): string;
    getDayNaYin(): string;

    getTime(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getTimeHideGan(): string[];
    getTimeShiShenGan(): string;
    getTimeNaYin(): string;
  }
}
