import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseInterceptors,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { Roles } from "./decorator/roles.decorator";
import { RolesEnum } from "./const/roles.const";
import { User } from "./decorator/user.decorator";
import { UsersModel } from "./entity/users.entity";

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // 사용자를 생성하는 모듈은 인증 검증이 필요하기에 auth 모듈에서만 사용하게 하자.
    // @Post()
    // postUser(
    //   @Body('nickname') nickname: string,
    //   @Body('email') email: string,
    //   @Body('password') password: string,
    // ) {
    //   return this.usersService.createUser({ nickname, email, password });
    // }

    @Get()
    @Roles(RolesEnum.ADMIN)
    // @UseInterceptors(ClassSerializerInterceptor)
    /**
     * serialization -> 직렬화 -> 현재 시스템에서 사용되는 (NestJS) 데이터의 구조를 다른 시스템에서도 쉽게 사용 할 수 있는 포맷으로 변환
     * -> class의 object에서 JSON 포맷으로 변환
     *
     * deserialization -> 역직렬화
     */
    getUsers() {
        return this.usersService.getAllUsers();
    }

    @Get("follow/me")
    async getFollow(@User() user: UsersModel) {
        return this.usersService.getFollowers(user.id);
    }

    @Post("follow/:id")
    async postFollow(@User() user: UsersModel, @Param("id", ParseIntPipe) followeeId: number) {
        await this.usersService.followUser(user.id, followeeId);

        return true;
    }
}
