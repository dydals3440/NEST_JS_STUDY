import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorator/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        /**
         * Roles annotation에 대한 metadata를 가져와야 한다.
         *
         * reflector (nest.js IOC 컨테이너에서 자동 주입 받을 수 있음.)
         * getAllAndOverride() 기능: ROLES_KEY
         */
        const requiredRole = this.reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass()]);

        // Roles Annotation이 등록 안돼있음.
        if (!requiredRole) {
            // 그냥 가드 패스 (RBACK 생각 X)
            return true;
        }

        // Roles 가드 실행전에 Token 가드 실행되게 할 것
        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new UnauthorizedException(`토큰을 제공해 주세요!`);
        }

        if (user.role !== requiredRole) {
            throw new ForbiddenException(`이 작업을 수행할 권한이 없습니다. ${requiredRole} 권한이 필요합니다.`);
        }

        return true;
    }
}
