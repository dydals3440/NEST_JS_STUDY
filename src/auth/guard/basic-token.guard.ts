/**
 * 구현할 기능
 *
 * 1) 요청 객체 (request)를 불러오고
 * authorization header로 부터 토큰을 가져온다.
 *
 * 2) authService.extractTokenFromHeader를 이용해서
 * 사용할 수 있는 형태의 토큰을 추출한다.
 *
 * 3) authService.decodeBasicToken을 실행해서
 * email과 password를 추출한다.
 *
 * 4) email과 password를 이용해서 사용자를 가져온다.
 *    authService.authenticateWithEmailAndPassword
 *
 * 5) 찾아낸 사용자를 (1) 요청 객체에 붙여준다.
 *    req.user = user;
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth.service';

@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  // boolean 반환 이유 false시 guard 통과 못하게 / true시 guard 통과 가능하게
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ws 웹소켓  Rpc는 Rpc Http는 Http(웹소켓이면 switchTows)
    const req = context.switchToHttp().getRequest();

    // {authorization: `Basic adsfasdfasdf`}
    // asdfasdfasdf
    const rawToken = req.headers['authorization'];
    console.log('raw', rawToken);

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, false);

    const { email, password } = this.authService.decodeBasicToken(token);

    const user = await this.authService.authenticateWithEmailAndPassword({
      email,
      password,
    });
    // 가져온 사용자가 req의 user라는 키에 붙어있다.
    // 이 req는 요청이 끝날때까지 살아있음. 응답으로 돌아갈때까지 살아있음.
    // req.user를 실행해서 항상 가드에서 가져온 유저를 갖고올 수 있다.(가드를 통과했다면)
    req.user = user;

    return true;
  }
}
