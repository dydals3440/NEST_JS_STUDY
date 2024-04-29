import { CommonService } from "src/common/common.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MessagesModel } from "./entity/messages.entity";
import { FindManyOptions, Repository } from "typeorm";
import { BasePaginationDto } from "src/common/dto/base-pagination.dto";
import { CreateMessagesDto } from "./dto/create-messages.dto";

@Injectable()
export class ChatsMessagesService {
    constructor(
        @InjectRepository(MessagesModel)
        private readonly messagesRepository: Repository<MessagesModel>,
        private readonly CommonService: CommonService,
    ) {}

    async createMessage(dto: CreateMessagesDto, authorId: number) {
        const message = await this.messagesRepository.save({
            chat: {
                id: dto.chatId,
            },
            author: {
                id: authorId,
            },
            message: dto.message,
        });

        // 이렇게 반환해야 나중에 Relation 편함!
        return this.messagesRepository.findOne({
            where: {
                id: message.id,
            },
            relations: {
                chat: true,
            },
        });
    }

    paginateMessages(dto: BasePaginationDto, overrideFindOptions: FindManyOptions<MessagesModel>) {
        return this.CommonService.paginate(dto, this.messagesRepository, overrideFindOptions, "messages");
    }
}
