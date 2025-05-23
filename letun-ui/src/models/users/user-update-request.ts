export default interface UserUpdateRequest {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    roleCode: string;
    isActive: boolean;
}