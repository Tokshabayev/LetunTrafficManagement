import User from "@/src/models/users/user";

export enum UserStateType {
  init,
  loading,
  loaded,
  error,
}

interface IUserState {
  type: UserStateType;
  isLoading: boolean;
  requestError?: string | undefined;
}

export interface UserInitState extends IUserState {
  type: UserStateType.init;
}

export interface UserInitedState extends IUserState {
  type: UserStateType.loaded;
  user: User;
}

export interface UserErrorState extends IUserState {
  type: UserStateType.error;
}

export type UserState = UserInitState | UserInitedState | UserErrorState;
