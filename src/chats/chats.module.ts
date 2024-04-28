import { ChatsGateway } from "./chats.gateway";
import { Module } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { ChatsController } from "./chats.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatsModel } from "./entity/chats.entity";
import { CommonModule } from "src/common/common.module";

@Module({
    // 모델만들면 꼮 import
    imports: [TypeOrmModule.forFeature([ChatsModel]), CommonModule],
    controllers: [ChatsController],
    // gateway는 컨트롤러에 등록
    providers: [ChatsGateway, ChatsService],
})
export class ChatsModule {}
