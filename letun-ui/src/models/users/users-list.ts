import User from "./user";

export default interface UsersList {
    users: User[] | null;
    total: number;
    maxPage: number;
}