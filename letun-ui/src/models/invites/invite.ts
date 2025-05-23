export default interface Invite {
    id: number;
    email: string;
    roleCode: string;
    roleId: number;
    isUsed: boolean;
    isExpired: boolean;
    createdAt: string;
}