import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";

// Next.js에서 모든 Exception들은 HttpException을 extend 해줘야함.
// @Catch 파라미터에 넣은 extensions를 넣을떄마다 발생함.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    // 위에서 잡게되는 exception이 HttpException이됨.
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();

        // 에러를 잡았을떄 중간에 어딘가에 알려주어야함.
        // 로그 파일을 생성하거나, 에러 모니터링 시스템에 API콜 하기.

        response.status(status).json({
            statusCode: status,
            message: exception.message,
            timestamp: new Date().toLocaleString("kr"),
            path: request.url,
        });
    }
}

// 유용하게 쓰는방법 실제로, exception의 형태를 변경해서 반환해주는 경우는 크게 많지 않음.
