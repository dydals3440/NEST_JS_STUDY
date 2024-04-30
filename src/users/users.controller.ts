import {
    ClassSerializerInterceptor,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseBoolPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
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
    async getFollow(
        @User() user: UsersModel,
        @Query("includeNotConfirmed", new DefaultValuePipe(false), ParseBoolPipe) includeNotConfirmed: boolean,
    ) {
        return this.usersService.getFollowers(user.id, includeNotConfirmed);
    }

    // 팔로우 할려는 상대의 아이디.
    @Post("follow/:id")
    async postFollow(@User() user: UsersModel, @Param("id", ParseIntPipe) followeeId: number) {
        await this.usersService.followUser(user.id, followeeId);

        return true;
    }

    // 나를 팔로우 할려는 상대의 아이디
    @Patch("follow/:id/confirm")
    async patchFollowConfirm(
        @User() user: UsersModel,
        //
        @Param("id", ParseIntPipe) followerId: number,
    ) {
        await this.usersService.confirmFollow(followerId, user.id);

        return true;
    }

    @Delete("follow/:id")
    async deleteFollow(
        @User() user: UsersModel,
        // 내가 팔로우하려는 상대를 취소 (상대가 나를 팔로우하는 것을 취소할 수 없음 이는 차단임.)
        @Param("id", ParseIntPipe) followeeId: number,
    ) {
        await this.usersService.deleteFollow(user.id, followeeId);

        return true;
    }
}
