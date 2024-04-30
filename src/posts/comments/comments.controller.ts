import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { PaginateCommentsDto } from "./dto/paginate-comments.dto";
import { AccessTokenGuard } from "src/auth/guard/bearer-token.guard";
import { CreateCommentsDto } from "./dto/create-comments.dto";
import { User } from "src/users/decorator/user.decorator";
import { UsersModel } from "src/users/entity/users.entity";
import { UpdateCommentsDto } from "./dto/update-domments.dto";

// 항상 특정 포스트에 귀속이 되므로
// 댓글작업은 항상 postId가 필요한 작업임 postId가 없으면 BadRequest
// 가장 먼저 적용되는 미들웨어 사용. (특정 path / 메소드에 적용가능 미들웨어를)
@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {
        /**
         * 1) Entity 생성
         * author -> 작성자
         * post -> 귀속되는 포스트
         * comment -> 실제 댓글 내용
         * likeCount -> 좋아요 개수
         *
         * id -> PrimaryGeneratedColumn
         * createdAt -> 생성일자
         * updatedAt -> 업데이트 일자
         *
         * 2) GET() pagination
         * 3) GET() (':commentId') 특정 comment만 하나 가져오는 기능
         * 4) POST() 코멘트 생성하는 기능
         * 5) PATCH(':commentId') 특정 comment 업데이트 하는 기능
         * 6) DELETE (':commentId) 특정 comment 삭제하는 기능
         */
    }

    @Get()
    getComments(@Param("postId", ParseIntPipe) postId: number, @Query() query: PaginateCommentsDto) {
        return this.commentsService.paginateComments(query, postId);
    }

    @Get(":commentId")
    getComment(@Param("commentId", ParseIntPipe) commentId: number) {
        return this.commentsService.getCommentById(commentId);
    }

    @Post()
    @UseGuards(AccessTokenGuard)
    postComment(
        // 어떤, 포스트에다가 코멘트를 달았는지 알아야하기에
        // 컨트롤러에 :postId라 했으므로 이걸 맞춰줘야함.
        @Param("postId", ParseIntPipe) pid: number,
        @Body() body: CreateCommentsDto,
        @User() user: UsersModel,
    ) {
        return this.commentsService.createComment(body, pid, user);
    }

    @Patch(":commentId")
    // accesstoken이 있기만하면,어떤 코멘트든 변경이 가능하다 라는 로직이 됨. 이거는 나중에 Rollbased access controll, authorization 관련 가드 만들떄 알아봄.
    @UseGuards(AccessTokenGuard)
    async patchComment(@Param("commentId", ParseIntPipe) commentId: number, @Body() body: UpdateCommentsDto) {
        return this.commentsService.updateComment(body, commentId);
    }

    @Delete(":commentId")
    @UseGuards(AccessTokenGuard)
    async deleteComment(@Param("commentId", ParseIntPipe) commentId: number) {
        return this.commentsService.deleteComment(commentId);
    }
}
