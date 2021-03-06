import { Action, Module, VuexModule } from "vuex-module-decorators";
import { User } from "~/domain/authentication/vo/User";
import { UId } from "~/domain/authentication/vo/UId";
import { UserName } from "~/domain/authentication/vo/UserName";
import { createAction } from "~/utils/firestore-facade";

interface FirestoreUser {
  id: string;
  name: string;
}

/**
 * Concrete implementation by using firebase
 */
@Module({ name: "CloudUser", namespaced: true, stateFactory: true })
class CloudUserModule extends VuexModule {
  _user: FirestoreUser | null = null;

  get user(): User | null {
    return this._user
      ? User.of({
          uid: UId.of(this._user.id),
          name: UserName.of(this._user.name),
        })
      : null;
  }

  @Action({ rawError: true })
  init(uid: UId) {
    createAction(uid.unwrap(), "_user", "users")(this.context);
  }
}

export default CloudUserModule;
