import {
    CallHandler,
    ExecutionContext,
    Injectable,
    InternalServerErrorException,
    NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError, tap } from "rxjs";
import { DataSource } from "typeorm";

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    // interceptor도 injectable이라 주입받을 수 있음.
    constructor(private readonly dataSource: DataSource) {}
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        const qr = this.dataSource.createQueryRunner();

        await qr.connect();

        await qr.startTransaction();

        // qr을 컨트롤러에 전달해주어야 하므로, 이 요청을 넘겨줌.
        req.queryRunner = qr;

        return next.handle().pipe(
            catchError(async (e) => {
                await qr.rollbackTransaction();
                await qr.release();

                throw new InternalServerErrorException(e.message);
            }),
            // tap 1. 응답값 계속 모니터링 2. Response가 끝난 뒤 무언가를 실행할 수 있게
            tap(async () => {
                await qr.commitTransaction();
                await qr.release();
            }),
        );
    }
}
