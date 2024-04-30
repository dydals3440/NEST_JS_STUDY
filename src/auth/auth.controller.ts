import { Body, Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { BasicTokenGuard } from "./guard/basic-token.guard";
import { RefreshTokenGuard } from "./guard/bearer-token.guard";
import { RegisterUserDto } from "./dto/register-user.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IsPublic } from "src/common/decorator/is-public.decorator";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("token/access")
    @IsPublic()
    // AccessToken도 RefreshTokenGuard가 적용되어야함.
    @UseGuards(RefreshTokenGuard)
    postTokenAccess(@Headers("authorization") rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);
        // Bearer token 중 token만 받아옴

        // token을 rotateToken에 넣어서 새로운 accessToken을 넣음. 이걸 응답으로 반환해줌.
        const newToken = this.authService.rotateToken(token, false);
        /**
         * {accessToken: {token}}
         */
        return {
            accessToken: newToken,
        };
    }

    @Post("token/refresh")
    @IsPublic()
    @UseGuards(RefreshTokenGuard)
    postTokenRefresh(@Headers("authorization") rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);
        // Bearer token 중 token만 받아옴

        // token을 rotateToken에 넣어서 새로운 accessToken을 넣음. 이걸 응답으로 반환해줌.
        // refreshToken은 true임
        const newToken = this.authService.rotateToken(token, true);
        /**
         * {accessToken: {token}}
         */
        return {
            refreshToken: newToken,
        };
    }

    // POST auth/login/email
    @Post("login/email")
    @IsPublic()
    @UseGuards(BasicTokenGuard)
    // authorization 기준으로 rawToken을 받아옴.
    postLoginEmail(@Headers("authorization") rawToken: string) {
        // email:password -> base64
        // adsfasdfasfdad => email:password
        const token = this.authService.extractTokenFromHeader(rawToken, false);

        const credentials = this.authService.decodeBasicToken(token);

        return this.authService.loginWithEmail({
            email: credentials.email,
            password: credentials.password,
        });
    }

    // POST auth/register/email
    @ApiOperation({ summary: "Sign Up.", description: "회원가입을 합니다." })
    @ApiResponse({ status: 200, description: "회원가입 성공" })
    @IsPublic()
    @Post("register/email")
    postRegisterEmail(@Body() body: RegisterUserDto) {
        return this.authService.registerWithEmail(body);
    }
}
