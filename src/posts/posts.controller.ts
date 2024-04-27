import { PostsImagesService } from "./image/images.service";
import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
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
import { ImageModelType } from "src/common/entity/image.entity";
import { DataSource } from "typeorm";

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
        // 트랜잭션과 관련된 모든 쿼리를 담당할 쿼리러너 생성.
        // 쿼리러너를 실행해줘야지 트랜잭션에 묶이기 떄문에 service(createpost에 가서 qr을 인자로 받아서, 실행 처리 해주어야함.)
        const qr = this.dataSource.createQueryRunner();

        // 쿼리 러너에 연결한다.
        await qr.connect();
        // 쿼리 러너에서 트랜잭션을 시작한다.
        // 이 시점부터 같은 쿼리 러너를 사용하면, 트랜잭션 안에서 DB 액션을 실행 할 수 있다.

        // 트랜잭션 시작.
        await qr.startTransaction();

        // 로직 실행. (로직에서 에러가 나면 롤백을 해주어야 함.)
        try {
            // temp -> posts로 옮긴다음에 포스팅
            const post = await this.postsService.createPost(userId, body, qr);
            throw new InternalServerErrorException("에러가 생겼습니다.");
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

            // 정상적으로 잘 실행되면 쿼리를 잘 실행해주면 됩니다!
            await qr.commitTransaction();
            // 그 다음 쿼리 종료
            await qr.release();

            // 가장 최근상태의 포스트를 받아와서, 반환해줌.
            return this.postsService.getPostById(post.id);
        } catch (e) {
            // 어떤 에러든 에러가 던져지면
            // 트랜잭션 종료 원래 상태로 되돌림.
            await qr.rollbackTransaction();
            // 쿼리러너를 사용하지 않는다.
            await qr.release();

            throw new InternalServerErrorException("에러가 났습니다.");
        }
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
