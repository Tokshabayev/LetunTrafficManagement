import User from "@/src/models/users/user";
import UserCreateRequest from "@/src/models/users/user-create-request";
import UserUpdateRequest from "@/src/models/users/user-update-request";

export interface UsersState {
  users: User[];
  isLoading: boolean;
  page: number;
  take: number;
  filter: string;
  total: number;
  maxPage: number;
  error: string | undefined;
  createState: UserCreateState;
  updateState: UserUpdateState;
}

export interface UserCreateState {
  draft: UserCreateRequest;
  error: string | undefined;
  isValid: boolean;
  isOpen: boolean;
}

export interface UserUpdateState {
  user: User | undefined;
  draft: UserUpdateRequest;
  error: string | undefined;
  isValid: boolean;
  isOpen: boolean;
}