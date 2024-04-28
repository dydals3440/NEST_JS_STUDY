import { ChatsGateway } from "./chats.gateway";
import { Module } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { ChatsController } from "./chats.controller";

@Module({
    controllers: [ChatsController],
    // gateway는 컨트롤러에 등록
    providers: [ChatsGateway, ChatsService],
})
export class ChatsModule {}
