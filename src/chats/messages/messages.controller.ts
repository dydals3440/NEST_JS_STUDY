import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ChatsMessagesService } from "./messages.service";
import { BasePaginationDto } from "src/common/dto/base-pagination.dto";

@Controller("chats/:cid/messages")
export class MessagesController {
    constructor(private readonly messagesService: ChatsMessagesService) {}

    @Get()
    paginateMessage(@Param("cid", ParseIntPipe) cid: number, @Query() dto: BasePaginationDto) {
        // 특정 챗에 소속된 메시지만
        return this.messagesService.paginateMessages(dto, {
            where: {
                chat: {
                    id: cid,
                },
            },
            relations: {
                author: true,
                chat: true,
            },
        });
    }
}
