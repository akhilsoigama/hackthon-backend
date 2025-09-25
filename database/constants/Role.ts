export enum RoleKeys {
  super_admin = "super_admin",
  nabha_admin = "nabha_admin",
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
  {
    roleName: "Nabha Admin",
    roleKey: RoleKeys.nabha_admin,
    roleDescription: "Admin access for Nabha-specific features",
    isDefault: false,
  },
];