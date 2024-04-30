import { BadRequestException, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { PostsService } from "src/posts/posts.service";

// Injectable 유용한기능 construct에다 inject를 다 받을 수 있음.
@Injectable()
export class PostExistsMiddleware implements NestMiddleware {
    constructor(private readonly postsService: PostsService) {}
    async use(req: Request, res: Response, next: NextFunction) {
        const postId = req.params.postId;

        if (!postId) {
            throw new BadRequestException("Post ID 파라미터는 필수입니다.");
        }

        const exists = await this.postsService.checkPostExistsById(parseInt(postId));

        if (!exists) {
            throw new BadRequestException("Post가 존재하지 않습니다.");
        }

        // 어떤 작업이 끝나면 next를 호출해야 다음으로 넘어감.
        next();
    }
}
