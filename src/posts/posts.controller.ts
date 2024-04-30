import { PostsImagesService } from "./image/images.service";
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { AccessTokenGuard } from "src/auth/guard/bearer-token.guard";
import { User } from "src/users/decorator/user.decorator";

import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PaginatePostDto } from "./dto/paginate-post.dto";
import { UsersModel } from "src/users/entity/users.entity";

import { ImageModelType } from "src/common/entity/image.entity";
import { DataSource, QueryRunner as QR } from "typeorm";
import { LogInterceptor } from "src/common/interceptor/log.interceptor";
import { TransactionInterceptor } from "src/common/interceptor/transaction.interceptor";
import { QueryRunner } from "src/common/decorator/query-runner.decorator";

import { ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "src/users/decorator/roles.decorator";
import { RolesEnum } from "src/users/const/roles.const";
import { IsPublic } from "src/common/decorator/is-public.decorator";

// Controller Annotation
@Controller("posts")
export class PostsController {
    // Controller 클래스 내부에서, PostService를 주입받겠다고 정의
    // PostService라는 것을 한번도 주입한 적이 없음. PostService와 관련된 기능들을 전부 다 잘 사용함.
    // nestJS iOC 컨테이너가 이 주입되어야 하는 서비스들을 생성해줌. 어디다 등록을 해야지 iOC 컨테이너가 인지?
    // posts.module.ts에 가보면됨.
    constructor(
        private readonly postsService: PostsService,
        private readonly PostsImagesService: PostsImagesService,
        // nest.js에서 주는 것, 데베 관련
        private readonly dataSource: DataSource,
    ) {}

    // 1) GET /posts
    //  모든 posts를 다 가져온다.
    @Get()
    @IsPublic()
    @ApiOperation({
        summary: "Get All Posts.",
        description:
            "전체 포스트를 가져옵니다. 단, page 파라피터를 사용하였을 경우, 페이지 기반 페이지네이션 API를 응답하고, page를 사용하지 않았을 경우, 커서 기반 페이지네이션 API를 응답합니다.",
    })
    @ApiResponse({ status: 200, description: "성공" })
    @ApiResponse({
        status: 400,
        description: "[ERROR] where 필터는 '__'로 split 했을 때 길이가 2 또는 3이어야합니다. - 문제되는 키값 ${key}",
    })
    @ApiResponse({
        status: 500,
        description: "Server Error",
    })
    @UseInterceptors(LogInterceptor)
    // @UseFilters(HttpExceptionFilter)
    getPosts(@Query() query: PaginatePostDto) {
        // throw new BadRequestException('에러 테스트');
        return this.postsService.paginatePosts(query);
    }

    // POST /posts/random
    @ApiOperation({ summary: "Get 100 random posts.", description: "100개의 랜덤한 포스트를 생성합니다." })
    @ApiResponse({ status: 200, description: "성공" })
    @Post("random")
    // @ApiBearerAuth("access-token")
    async postPostsRandom(@User() user: UsersModel) {
        await this.postsService.generatePosts(user.id);

        return true;
    }

    // 2) GET /posts/:id
    // id에 해당되는 post를 가져온다.
    @ApiOperation({ summary: "Get detail post.", description: "id에 해당하는 포스트 세부정부를 가져옵니다." })
    @ApiResponse({ status: 200, description: "성공" })
    @ApiResponse({ status: 404, description: "Not Found" })
    @IsPublic()
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
    @UseInterceptors(TransactionInterceptor)
    async postPost(@User("id") userId: number, @Body() body: CreatePostDto, @QueryRunner() qr: QR) {
        // temp -> posts로 옮긴다음에 포스팅
        const post = await this.postsService.createPost(userId, body, qr);
        // throw new InternalServerErrorException("에러가 생겼습니다.");
        // 포스트만 생성하고, 이미지는 생성안해버림 throw 에러에서 걸림. 원래는 포스트 게시글이 생기면 안됨.

        for (let i = 0; i < body.images.length; i++) {
            await this.PostsImagesService.createPostImage(
                {
                    post,
                    order: i,
                    path: body.images[i],
                    type: ImageModelType.POST_IMAGE,
                },
                qr,
            );
        }

        // Transaction 타입에 따라서 Transaction이 커밋 되기전에 최신 값을 가져오지 못할 수 있다. (service에서 해당 문제 처리 직접 qr받아서)
        // 가장 최근상태의 포스트를 받아와서, 반환해줌.
        return this.postsService.getPostById(post.id, qr);
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
    // 토큰 유무 확인 후, 이 사용자가 AMIN인지 확인.
    @UseGuards(AccessTokenGuard)
    @Roles(RolesEnum.ADMIN)
    deletePost(@Param("id", ParseIntPipe) id: number) {
        return this.postsService.deletePost(id);
    }

    // RBAC -> Role Based Access Controller
}
