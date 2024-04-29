import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseWsExceptionFilter } from "@nestjs/websockets";

// 에러 나면 여기 자체에서 잡음.
@Catch(HttpException)
export class SocketCatchHttpExceptionFilter extends BaseWsExceptionFilter<HttpException> {
    catch(exception: HttpException, host: ArgumentsHost): void {
        // super.catch(exception, host);
        // super.catch를하면 부모클래스인 BaseWsExceptionFilter의 에러도 또한 캐치하기 떄문에 에러가 두개 발생하니 뺴줘야함.

        // socket을 가져오는 방법
        const socket = host.switchToWs().getClient();

        // 현재 소켓에다 Emit해주는 것
        socket.emit("exception", {
            // 여기다 status code 추가할 수 있음.
            data: exception.getResponse(),
        });
    }
}
