import { TogowlError } from '~/domain/common/TogowlError';
import { Entry } from '~/domain/timer/vo/Entry';
import { Either } from '~/node_modules/fp-ts/lib/Either';

export interface TimerEventListener {
  onStartSubscribe?: () => void;
  onEndSubscribe?: () => void;
  onError?: (err: TogowlError) => void;
  onInsertEntry?: (entry: Entry) => void;
  onUpdateEntry?: (entry: Entry) => void;
  onDeleteEntry?: (entry: Entry) => void;
}

export interface TimerService {
  fetchCurrentEntry: () => Promise<Either<TogowlError, Entry | null>>;
}
