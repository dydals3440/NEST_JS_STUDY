import { ChatsGateway } from "./chats.gateway";
import { Module } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { ChatsController } from "./chats.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatsModel } from "./entity/chats.entity";
import { CommonModule } from "src/common/common.module";
import { ChatsMessagesService } from "./messages/messages.service";
import { MessagesModel } from "./messages/entity/messages.entity";
import { MessagesController } from "./messages/messages.controller";

@Module({
    // 모델만들면 꼮 import
    imports: [TypeOrmModule.forFeature([ChatsModel, MessagesModel]), CommonModule],
    controllers: [ChatsController, MessagesController],
    // gateway는 컨트롤러에 등록
    providers: [ChatsGateway, ChatsService, ChatsMessagesService],
})
export class ChatsModule {}
