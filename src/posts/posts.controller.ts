import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { AccessTokenGuard } from "src/auth/guard/bearer-token.guard";
import { User } from "src/users/decorator/user.decorator";

import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PaginatePostDto } from "./dto/paginate-post.dto";
import { UsersModel } from "src/users/entities/users.entity";
import { FileInterceptor } from "@nestjs/platform-express";

// Controller Annotation
@Controller("posts")
export class PostsController {
    // Controller 클래스 내부에서, PostService를 주입받겠다고 정의
    // PostService라는 것을 한번도 주입한 적이 없음. PostService와 관련된 기능들을 전부 다 잘 사용함.
    // nestJS iOC 컨테이너가 이 주입되어야 하는 서비스들을 생성해줌. 어디다 등록을 해야지 iOC 컨테이너가 인지?
    // posts.module.ts에 가보면됨.
    constructor(private readonly postsService: PostsService) {}

    // 1) GET /posts
    //  모든 posts를 다 가져온다.
    @Get()
    getPosts(@Query() query: PaginatePostDto) {
        return this.postsService.paginatePosts(query);
    }

    // POST /posts/random
    @Post("random")
    @UseGuards(AccessTokenGuard)
    async postPostsRandom(@User() user: UsersModel) {
        await this.postsService.generatePosts(user.id);

        return true;
    }

    // 2) GET /posts/:id
    // id에 해당되는 post를 가져온다.
    @Get(":id")
    getPost(@Param("id", ParseIntPipe) id: number) {
        return this.postsService.getPostById(id);
    }

    // 3) POST / posts
    // post를 생성한다.
    // DTO - Data Transfer Object
    //
    // A Model, B Model
    // Post API -> A 모델을 저장하고, B 모델을 저장한다. (2가지 작업을 모두 해야 함)
    // await repository.save(a);
    // await repository.save(b);
    // a가 저장된 다음에 b가 저장됨. (안전장치 없으면)
    //
    // 만약에 a를 저장하다가 실패하면 b를 저장하면 안될 경우.
    // all or nothing
    //
    // transaction
    // start -> 시작
    // commit -> 저장
    // rollback -> 원상복구
    @Post()
    @UseGuards(AccessTokenGuard)
    async postPost(@User("id") userId: number, @Body() body: CreatePostDto) {
        // temp -> posts로 옮긴다음에 포스팅
        await this.postsService.createPostImage(body);
        return this.postsService.createPost(userId, body);
    }

    // 4) PATCH /posts/:id (부분적으로 업데이트는 PATCH임)
    // id에 해당하는 POST를 변경한다.

    @Patch(":id")
    patchPost(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: UpdatePostDto,
        // @Body('title') title?: string,
        // @Body('content') content?: string,
    ) {
        return this.postsService.updatePost(body, id);
    }

    // 5) DELETE /posts/:id
    // id에 해당되는 POST를 삭제한다.
    @Delete(":id")
    deletePost(@Param("id", ParseIntPipe) id: number) {
        return this.postsService.deletePost(id);
    }
}
