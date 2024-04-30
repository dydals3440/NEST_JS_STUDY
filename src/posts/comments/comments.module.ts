import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentsController } from "./comments.controller";
import { CommentsModel } from "./entity/comments.entity";
import { CommonModule } from "src/common/common.module";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [TypeOrmModule.forFeature([CommentsModel]), CommonModule, AuthModule, UsersModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
