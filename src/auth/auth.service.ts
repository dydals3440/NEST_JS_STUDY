import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersModel } from "src/users/entities/users.entity";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { RegisterUserDto } from "./dto/register-user.dto";
import { ConfigService } from "@nestjs/config";
import { ENV_HASH_ROUNDS_KEY, ENV_JWT_SECRET_KEY } from "src/common/const/env-keys.const";

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) {}
    /**
     * 토큰을 사용하게 되는 방식
     *
     * 1) 사용자가 로그인 또는 회원가입을 진행하면 accessToken과 refreshToken을 발급 받는다.
     * 2) 로그인 할떄는 Basic Token과 함께 요청을 보낸다. (Basic 토큰은 '이메일:비밀번호'를 Base 64로 인코딩한 형태이다.) ex) {authorization: `Basic {token}`}
     * 3) 아무나 접근할 수 없는 정보 (private route)를 접근 할 떄는
     * accessToken을 헤더에 추가해서 요청과 함께 보낸다. ex) {authorization: 'Bearer {token}'}
     * Basic 계정 정보, Bearer 발급받은 토큰
     * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
     * 예를들어서 현재 로그인한 사용자가 작성한 포스트만 가져오려면 토큰의 sub 값에 입력되있는 사용자의 포스트만 따로 필터링 할 수 있다. 특정 사용자의 토큰이 없다면 다른 사용자의 데이터를 접근 못한다.
     * 5) 모든 토큰은 만료 기간이 있다. 만료 기간이 지나면 새로 토큰을 발급 받아야한다. 그렇지 않으면 jwtService.verify()에서 인증이 통과 안된다. 그러니 access 토큰을 새로 발급 받을 수 있는 /auth/token/access와 refresh 토큰을 새로 발급 받을 수 있는 /auth/token/refresh가 필요하다.
     * 6) 토큰이 만료되면 각각의 토큰을 새로 발급 받을 수 있는 엔드포인트에 요청을 해서 새로운 토큰을 발급받고 새로운 토큰을 사용해서 private route에 접근한다.
     */

    /**
     * Header로 부터 토큰을 받을 때
     * {authorization: `Basic ${token}`}
     * {authorization: `Bearer ${token}`}
     */
    // Basic token만 받는다 가정
    extractTokenFromHeader(header: string, isBearer: boolean) {
        // 'Bearer {token}'
        // [Bearer, {token}]
        const splitToken = header.split(" ");

        // 클라이언트에서 잘못된 값이 들어가있다는 것을 항상 가정함.
        const prefix = isBearer ? "Bearer" : "Basic";
        if (splitToken.length !== 2 || splitToken[0] !== prefix) {
            throw new UnauthorizedException("잘못된 토큰입니다.");
        }

        const token = splitToken[1];

        return token;
    }

    /**
     * Basic alads;lfkajsdf;ljasdf
     *
     * 1) asdfasdfkljas;dflj
     * 2) email:password -> [email, password]
     * 3) { email: email, password: password }
     */
    decodeBasicToken(base64String: string) {
        // base64가 원래값인데 이를 디코드 하겠다.
        const decoded = Buffer.from(base64String, "base64").toString("utf-8");

        const split = decoded.split(":");

        if (split.length !== 2) {
            throw new UnauthorizedException("잘못된 유형의 토큰입니다.");
        }

        const email = split[0];
        const password = split[1];

        return { email, password };
    }

    // 토큰 검증
    verifyToken(token: string) {
        try {
            // token을 검증해서, 토큰안에 있는 payload를 빼오면됨
            return this.jwtService.verify(token, {
                secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
            });
        } catch (e) {
            throw new UnauthorizedException("토큰이 만료됐거나 잘못된 토큰입니다.");
        }
    }

    rotateToken(token: string, isRefreshToken: boolean) {
        // 여기서 payload를 받을 수 있음. (문제가 있음 에러)
        const decoded = this.jwtService.verify(token, {
            secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
        });

        /**
         * sub: id
         * email: email,
         * type: 'access' | 'refresh'
         */
        // access token은 우리가 리소스를 특정 데이터(private)를 가져올 떄 사용.
        // 새로운 토큰을 발급 받을 때는 절대적으로 refreshToken만 사용.
        if (decoded.type !== "refresh") {
            throw new UnauthorizedException("토큰 재발급은 Refresh Token으로만 가능합니다.");
        }
        // true면은 refresh false면 access
        return this.signToken({ ...decoded }, isRefreshToken);
    }

    /**
     * 우리가 만드려는 기능
     *
     * 1) registerWithEmail
     *    - email, nickname, password를 입력받고 사용자를 생성한다.
     *    - 생성이 완료되면 accessToken과 refreshToken을 반환한다.
     *      회원가입 후 다시 로그인해주세요 <- 이런 쓸데없는 과정을 방지하기 위해서
     *
     * 2) loginWithEmail
     *    - email, password를 입력하면 사용자 검증을 진행한다.
     *    - 검증이 완료되면 accessToken과 refreshToken을 반환한다.
     *
     * 3) loginUser
     *    - (1)과 (2)에서 필요한 accessToken과 refreshToken을 반환하는 로직
     *
     * 4) signToken
     *    - (3)에서 필요한 accessToken과 refreshToken을 sign하는 로직
     *
     * 5) authenticateWithEmailAndPassword
     *    - (2)에서 로그인을 진행할때 필요한 기본적인 검증 진행.
     *    1. 사용자가 존재하는지 확인 (email)
     *    2. 비밀번호가 맞는지 확인 (hash compare)
     *    3. 모두 통과되면 찾은 사용자 정보 반환
     *    4. loginWithEmail에서 반환된 데이터를 기반으로 토큰 생성.
     */

    /**
     * Payload에 들어갈 정보
     * 1) email (필수 아님 개인정보 들어가는 것을 원하지 않는 사용자도 있음.)
     * 2) sub -> id(사용자의 아이디)
     * 3) type: 'access' | 'refresh'
     */
    signToken(user: Pick<UsersModel, "email" | "id">, isRefreshToken: boolean) {
        const payload = {
            email: user.email,
            id: user.id,
            type: isRefreshToken ? "refresh" : "access",
        };

        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
            // seconds
            expiresIn: isRefreshToken ? 3600 : 300,
        });
    }

    loginUser(user: Pick<UsersModel, "email" | "id">) {
        return {
            accessToken: this.signToken(user, false),
            refreshToken: this.signToken(user, true),
        };
    }

    async authenticateWithEmailAndPassword(user: Pick<UsersModel, "email" | "password">) {
        /**
         * 1. 사용자가 존재하는지 확인(email) => userRepo를 주입받아야함.
         * 2. 비밀번호가 맞는지 확인
         * 3. 모두 통과되면 찾은 사용자 정보 반환
         */
        const existingUser = await this.usersService.getUserByEmail(user.email);

        if (!existingUser) {
            throw new UnauthorizedException("존재하지 않는 사용자입니다.");
        }
        /**
         * 파라미터
         *
         * 1) 입력된 비밀번호
         * 2) 기존 해시 (hash) -> 사용자 정보에 저장돼있는 hash
         */
        const passOk = await bcrypt.compare(user.password, existingUser.password);

        if (!passOk) {
            throw new UnauthorizedException("비밀번호가 틀렸습니다.");
        }

        return existingUser;
    }

    async loginWithEmail(user: Pick<UsersModel, "email" | "password">) {
        // 입력받은 이메일에 해당하는 사람이 있는지 확인, 비밀번호 검증, 통과시 loginUser에 넣어서 access / refresh token반환
        const existingUser = await this.authenticateWithEmailAndPassword(user);
        return this.loginUser(existingUser);
    }

    async registerWithEmail(user: RegisterUserDto) {
        const hash = await bcrypt.hash(
            user.password,
            // round(초당 10개돌음 ~10hashes/sec) | hash라고 하면 salt는 자동생성
            parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY)),
        );

        const newUser = await this.usersService.createUser({
            ...user,
            password: hash,
        });

        return this.loginUser(newUser);
    }
}
