import { TypeOrmModule } from "@nestjs/typeorm";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentsController } from "./comments.controller";
import { CommentsModel } from "./entity/comments.entity";
import { CommonModule } from "src/common/common.module";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";
import { PostExistsMiddleware } from "./middleware/post-exists.middleware";
import { PostsModule } from "../posts.module";

@Module({
    imports: [TypeOrmModule.forFeature([CommentsModel]), CommonModule, AuthModule, UsersModule, PostsModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
// 미들웨어 등록 방법
export class CommentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // path 넣어도되고, 적용하고싶은 컨트롤러를 통째로 넣어도됨
        consumer.apply(PostExistsMiddleware).forRoutes(CommentsController);
    }
}
