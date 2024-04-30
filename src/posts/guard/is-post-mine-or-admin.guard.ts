import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import { RolesEnum } from "src/users/const/roles.const";
import { PostsService } from "../posts.service";
import { UsersModel } from "src/users/entity/users.entity";
import { Request } from "express";

@Injectable()
export class IsPostMineOrAdmin implements CanActivate {
    constructor(private readonly postsService: PostsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest() as Request & { user: UsersModel };

        const { user } = req;

        if (!user) {
            throw new UnauthorizedException("사용자 정보를 가져올 수 없습니다.");
        }

        /**
         * Admin일 경우 그냥 패스 (ADMIN은 어떤 기능이든 다 할 수 있게)
         */
        if (user.role === RolesEnum.ADMIN) {
            return true;
        }

        // 서버에서 postId로 안적거나, 클라이언트에서 postId를 안주었을 떄 에러발생.
        const postId = req.params.postId;

        if (!postId) {
            throw new BadRequestException("Post ID가 파라미터로 제공되어야합니다.");
        }

        const isOk = await this.postsService.isPostMine(user.id, parseInt(postId));
        // 현재 포스트가 본인이 쓴게 아니면 권한 없다고 함.
        if (!isOk) {
            throw new ForbiddenException("권한이 없습니다.");
        }

        return true;
    }
}
