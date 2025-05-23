import Invite from "@/src/models/invites/invite";

export interface InvitesState {
  invites: Invite[];
  isLoading: boolean;
  page: number;
  take: number;
  filter: string;
  total: number;
  maxPage: number;
  error: string | undefined;

  inviteUser: InviteUser;
}

export interface InviteUser {
  email: string;
  role: string;
  isValid: boolean;
  error: string | undefined;
  isOpen: boolean;
}
