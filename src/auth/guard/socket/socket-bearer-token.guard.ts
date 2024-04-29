import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Observable } from "rxjs";
import { AuthService } from "src/auth/auth.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class SocketBearerTokenGuard implements CanActivate {
    // 토큰 검증 시 필요한 서비스
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const socket = context.switchToWs().getClient();
        // socket 안에 handshake안에 headers가 있음.
        const headers = socket.handshake.headers;
        console.log("헤더", headers);

        // Bearer xxxxx
        const rawToken = headers["authorization"];

        if (!rawToken) {
            throw new WsException("토큰이 없습니다!");
        }

        // 이 함수들은 기본적으로 HTTP 관련 에러 에러 발생시 WsException에러로 만들어야 하기 떄문에 Try/Catch로 감싸주기
        try {
            // 실제 토큰 Bearer벗겨낸 (true면 accessToken)
            const token = this.authService.extractTokenFromHeader(rawToken, true);
            // payload 받아옴
            const payload = this.authService.verifyToken(token);
            const user = await this.usersService.getUserByEmail(payload.email);

            // 만약에 rest.api였으면 user정보를 req.user = user; 이렇게해서 넘겨줌.
            socket.user = user;
            socket.token = token;
            socket.tokenType = payload.tokenType;
            // true를 던져줘야지 casActivate 함수의 응답 요건에 충족함.
            return true;
        } catch (e) {
            throw new WsException("토큰이 유효하지 않습니다.");
        }
    }
}
