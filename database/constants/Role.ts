export enum RoleKeys {
  super_admin = "super_admin",
}

export const RoleKeysList: {
  roleName: string;
  roleKey: string;
  roleDescription: string;
  isDefault: boolean;
}[] = [
  {
    roleName: "Super Admin",
    roleKey: RoleKeys.super_admin,
    roleDescription: "Full access to the system",
    isDefault: false,
  },
];