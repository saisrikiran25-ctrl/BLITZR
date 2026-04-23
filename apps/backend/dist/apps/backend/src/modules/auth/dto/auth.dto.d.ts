export declare class RegisterDto {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    campus?: string;
    institution_id?: string;
    tosAccepted?: boolean;
}
export declare class LoginDto {
    email: string;
    password: string;
}
