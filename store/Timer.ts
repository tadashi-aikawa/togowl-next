import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import firebase from '~/plugins/firebase';
import { firestoreAction } from '~/node_modules/vuexfire';
import { UId } from '~/domain/authentication/vo/UId';
import { TogowlError } from '~/domain/common/TogowlError';
import { TimerService } from '~/domain/timer/service/TimerService';
import { TimerConfig } from '~/domain/timer/vo/TimerConfig';
import { pipe } from '~/node_modules/fp-ts/lib/pipeable';
import { Either, fold, left, right } from '~/node_modules/fp-ts/lib/Either';
import { Entry } from '~/domain/timer/vo/Entry';
import { createTimerService } from '~/utils/service-factory';
import { FirestoreTimer } from '~/repository/FirebaseCloudRepository';
import { cloudRepository } from '~/store/index';
import { UpdateStatus } from '~/domain/notification/vo/UpdateStatus';

const firestore = firebase.firestore();
let service: TimerService | null;

/**
 * Concrete implementation by using firebase
 */
@Module({ name: 'Timer', namespaced: true, stateFactory: true })
class TimerModule extends VuexModule {
  _timer: FirestoreTimer | null = null;

  updateStatus: UpdateStatus = 'init';
  @Mutation
  setUpdateStatus(status: UpdateStatus) {
    this.updateStatus = status;
  }

  updateError: TogowlError | null = null;
  @Mutation
  setUpdateError(error: TogowlError | null) {
    this.updateError = error;
  }

  currentEntry: Entry | null = null;
  @Mutation
  setCurrentEntry(entry: Entry | null) {
    this.currentEntry = entry;
  }

  error: TogowlError | null = null;
  @Mutation
  setError(error: TogowlError | null) {
    this.error = error;
  }

  realtime: boolean = false;
  @Mutation
  setRealtime(realtime: boolean) {
    this.realtime = realtime;
  }

  get timerConfig(): TimerConfig | null {
    return TimerConfig.create(this._timer?.token, this._timer?.proxy);
  }

  @Action
  async updateTimerConfig(config: TimerConfig) {
    this.setUpdateError(null);
    this.setUpdateStatus('updating');

    const err = await cloudRepository.saveTimerConfig(config);
    if (err) {
      this.setUpdateStatus('error');
      this.setUpdateError(err);
    } else {
      this.setUpdateStatus('success');
    }
  }

  @Action
  async fetchCurrentEntry(): Promise<void> {
    const config = this.timerConfig;
    if (!config?.token) {
      // TODO: Show on UI
      console.error('Token for timer is required! It is empty!');
      return;
    }

    pipe(
      await service!.fetchCurrentEntry(),
      fold(
        err => {
          this.setError(err);
          this.setCurrentEntry(null);
        },
        entry => {
          this.setCurrentEntry(entry);
          this.setError(null);
        },
      ),
    );
  }

  @Action
  async completeCurrentEntry(): Promise<Either<TogowlError, Entry | null>> {
    const config = this.timerConfig;
    if (!config?.token) {
      // TODO: Show on UI
      return left(TogowlError.create('TIMER_TOKEN_IS_EMPTY', 'Token for timer is required! It is empty!'));
    }
    if (!this.currentEntry) {
      return left(TogowlError.create('CURRENT_ENTRY_IS_EMPTY', 'Current entry is empty!'));
    }

    return pipe(
      await service!.stopEntry(this.currentEntry),
      fold(
        err => {
          this.setError(err);
          return left(err);
        },
        entry => {
          this.setCurrentEntry(null);
          this.setError(null);
          return right(entry);
        },
      ),
    );
  }

  @Action({ rawError: true })
  async init(uid: UId) {
    const createService = (): Promise<TimerService | null> =>
      createTimerService({
        onStartSubscribe: () => {
          this.setRealtime(true);
          this.fetchCurrentEntry();
        },
        onEndSubscribe: async () => {
          this.setRealtime(false);
          service = await createService();
        },
        onError: this.setError,
        onInsertEntry: _entry => this.fetchCurrentEntry(),
        onUpdateEntry: _entry => this.fetchCurrentEntry(),
        onDeleteEntry: _entry => this.fetchCurrentEntry(),
      });
    service = await createService();

    const action = firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef('_timer', firestore.doc(`timer/${uid.value}`));
    }) as Function;

    // Call function that firebaseAction returns
    return action(this.context);
  }
}

export default TimerModule;
