import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import { ValueObject } from '~/utils/vo';
import { toHHmmss } from '~/utils/time';

dayjs.locale('ja');

export class DateTime extends ValueObject<dayjs.Dayjs> {
  static create(value: string): DateTime {
    return new DateTime(dayjs(value));
  }

  static now(): DateTime {
    return new DateTime(dayjs());
  }

  minusDays(days: number): DateTime {
    return new DateTime(this._value!.subtract(days, 'day'));
  }

  minusMinutes(minutes: number): DateTime {
    return new DateTime(this._value!.subtract(minutes, 'minute'));
  }

  displayDiffFromNow(): string {
    return toHHmmss(dayjs().diff(this._value!, 'second'));
  }

  within(seconds: number): boolean {
    return dayjs().diff(this._value!, 'second') <= seconds;
  }

  get unix(): number {
    return this._value!.unix();
  }

  get rfc3339(): string {
    return this._value!.format('YYYY-MM-DDTHH:mm:ssZ');
  }

  get displayTime(): string {
    return this._value!.format('HH:mm:ss');
  }

  get displayTimeWithoutSeconds(): string {
    return this._value!.format('HH:mm');
  }

  get displayDateTime(): string {
    return this._value!.format('YYYY-MM-DD HH:mm:ss');
  }

  get displayDateTimeWithoutSeconds(): string {
    return this._value!.format('YYYY-MM-DD HH:mm');
  }
}
