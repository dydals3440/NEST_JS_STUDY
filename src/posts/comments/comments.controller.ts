import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { PaginateCommentsDto } from "./dto/paginate-comments.dto";

// 항상 특정 포스트에 귀속이 되므로
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
        return this.commentsService.PaginateCommentsDto(query, postId);
    }

    @Get(":commentId")
    getComment(@Param("commentId", ParseIntPipe) commentId: number) {
        return this.commentsService.getCommentById(commentId);
    }
}
