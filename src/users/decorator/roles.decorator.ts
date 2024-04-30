import { SetMetadata } from "@nestjs/common";
import { RolesEnum } from "../const/roles.const";

export const ROLES_KEY = "user_roles";

// @Roles(RolesEnum.ADMIN)
// 이 API는 어드민 사용자가 아니면 사용할 수 없게 만듬.
export const Roles = (role: RolesEnum) => SetMetadata(ROLES_KEY, role);
