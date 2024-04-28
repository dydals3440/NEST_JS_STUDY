import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatsModel } from "./entity/chats.entity";
import { Repository } from "typeorm";
import { CreateChatDto } from "./dto/create-chat.dto";

@Injectable()
export class ChatsService {
    constructor(
        @InjectRepository(ChatsModel)
        private readonly chatsRepository: Repository<ChatsModel>,
    ) {}

    async createChat(dto: CreateChatDto) {
        const chat = await this.chatsRepository.save({
            // 1, 2, 3
            // {id: 1}, {id: 2}, {id: 3}
            // ({id}) === {id: id} 와 동일
            users: dto.userIds.map((id) => ({ id })),
        });

        return this.chatsRepository.findOne({
            where: {
                id: chat.id,
            },
        });
    }
}
