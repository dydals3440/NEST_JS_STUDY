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
    @Post()
    @UseGuards(AccessTokenGuard)
    // FileInterceptor의 첫번쨰 인자에는, 실제 파일을 업로드 할 필드의 이름을 적어주면 됨.
    // 클라이언트에서 이미지를 업로드 할 떄, image라는 키값에 파일을 넣어서 보내면됨.
    // 그럼 등록을 할 때 postsmodule에 등록한 절차를 확인하고, 이 파일을 받게 된다.
    @UseInterceptors(FileInterceptor("image"))
    postPost(@User("id") userId: number, @Body() body: CreatePostDto, @UploadedFile() file?: Express.Multer.File) {
        return this.postsService.createPost(userId, body, file?.filename);
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
