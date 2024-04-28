import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";
import { UsersModel } from "../entities/users.entity";

// data는 데코레이터 안에다가 입력해주는 값이다. @Body('title')할 때 title을 의미
// 두번쨰 인자는 context이다.
// 이 유저 데코레이터는 무조건, AccessTokenGuard를 사용한 상태에서 사용 가능하다는 전제로 만듬.
export const User = createParamDecorator((data: keyof UsersModel | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const user = req.user as UsersModel;

    // 사용자를 찾을 수 없으면 클라이언트 측 에러가 아닌, 서버의 에러임.
    if (!user) {
        throw new InternalServerErrorException(
            "User 데코레이터는 AccessTokenGuard와 사용해야합니다. Request에 user 프로퍼티가 존재하지 않습니다.",
        );
    }

    if (data) {
        return user[data];
    }

    return user;
});
