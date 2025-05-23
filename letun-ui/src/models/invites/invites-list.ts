import Invite from "./invite";

export default interface InvitesList {
    invites: Invite[] | null;
    total: number;
    maxPage: number;
}