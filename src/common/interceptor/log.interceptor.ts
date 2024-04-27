import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map, tap } from "rxjs";

@Injectable()
export class LogInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        /**
         * 요청이 들어올 떄 req 요청이 들어온 타임스탬프를 찍는다.
         * [REQ] { 요청 path }, { 요청 시간 }
         *
         * 요청이 끝날때 (응답이 나갈떄) 다시 타임스탬프를 찍는다.
         * [RES] {요청 path} {응답 시간} {얼마나 걸렸는지 ms}
         */
        const now = new Date();
        const req = context.switchToHttp().getRequest();
        // 원래 요청이 들어갔던 Url을 가져올 수 있음

        // /posts
        // /common/image
        const path = req.originalUrl;

        // [REQ] { 요청 path }, { 요청 시간 }
        console.log(`[REQ] ${path} ${now.toLocaleString("kr")}`);

        // next.handle()을 해야 응답값을 받아볼 수 있음. (아래 코드 위에는 요청시 실행되는 로직.)
        // 그 아래부터 return next.handle()을 실행하는 순간
        // 라우트의 로직(controller의 getPosts()함수)이 전부 실행되고 응답이 반환된다.
        // observable로
        // tap을 실행하게되면 타고 내려온 값(observable)을 모니터링 가능.
        // map은 응답을 변형해줄 수 있음.
        return next.handle().pipe(
            tap((observable) =>
                console.log(
                    `[RES] ${path} ${new Date().toLocaleString("kr")} ${new Date().getMilliseconds() - now.getMilliseconds()}ms`,
                ),
            ),
            // map((observable) => {
            //     return {
            //         message: "응답이 변경 됐습니다.",
            //         response: observable,
            //     };
            // }),
        );
    }
}
