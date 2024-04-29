import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class BearerTokenGuard implements CanActivate {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const rawToken = req.headers["authorization"];

        if (!rawToken) {
            throw new UnauthorizedException("토큰이 없습니다!");
        }

        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const result = await this.authService.verifyToken(token);

        /**
         * request에 넣을 정보.
         * 1) 사용자 정보 - user
         * 2) token - token
         * 3) tokenType - access | refresh
         */
        const user = await this.usersService.getUserByEmail(result.email);

        req.user = user;
        req.token = token;
        req.tokenType = result.type;

        return true;
    }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // AccessTokenGuard가 실행될떄마다 상속받았기에 위에 코드들도 다 같이 실행됨.
        await super.canActivate(context);

        const req = context.switchToHttp().getRequest();
        // 위에서 상속 받았기에 토큰 타입에 대해 알고있음.
        if (req.tokenType !== "access") {
            throw new UnauthorizedException("Access Token이 아닙니다.");
        }

        return true;
    }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // AccessTokenGuard가 실행될떄마다 상속받았기에 위에 코드들도 다 같이 실행됨.
        await super.canActivate(context);

        const req = context.switchToHttp().getRequest();
        // 위에서 상속 받았기에 토큰 타입에 대해 알고있음.
        if (req.tokenType !== "refresh") {
            throw new UnauthorizedException("Refresh Token이 아닙니다.");
        }

        return true;
    }
}
