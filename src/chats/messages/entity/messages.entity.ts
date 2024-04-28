import { IsString } from "class-validator";
import { ChatsModel } from "src/chats/entity/chats.entity";
import { BaseModel } from "src/common/entity/base.entity";
import { UsersModel } from "src/users/entities/users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class MessagesModel extends BaseModel {
    // Message는 실제 보내는 문자 내용 Chat은 채팅방
    // 여러개의 메시지가 하나의 채팅방에 연결되는 형태
    @ManyToOne(() => ChatsModel, (chat) => chat.messages)
    chat: ChatsModel;

    // 누가 보냈는지 알아야함.
    // 한 사용자가 여러개의 채팅 메시지를 보낼 수 있음. 메시지 하나가 여러 사람이 보낸거일 수는 없음.
    @ManyToOne(() => UsersModel, (user) => user.messages)
    author: UsersModel;

    // 실제 메시지 내용을 담고있는 column
    @Column()
    @IsString()
    message: string;
}
