// socket io 가 연결하는 곳을 nest에서 gateway라고 부름

import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { CreateChatDto } from "./dto/create-chat.dto";
import { ChatsService } from "./chats.service";
import { EnterChatDto } from "./dto/enter-chat.dto";
import { CreateMessagesDto } from "./messages/dto/create-messages.dto";
import { ChatsMessagesService } from "./messages/messages.service";
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { SocketCatchHttpExceptionFilter } from "src/common/exception-filter/socket-catch-http.exception-filter";
import { SocketBearerTokenGuard } from "src/auth/guard/socket/socket-bearer-token.guard";
import { UsersModel } from "src/users/entities/users.entity";

// 괄호 안에 옵션에 namespace정의
@WebSocketGateway({
    // ws://localhost:3000/chats
    namespace: "chats",
})
// onConnect 설정는 implements한다음에 onGatewayConnection을 이식
export class ChatsGateway implements OnGatewayConnection {
    constructor(
        private readonly chatsService: ChatsService,
        private readonly messagesService: ChatsMessagesService,
    ) {}
    @WebSocketServer()
    server: Server;

    handleConnection(socket: Socket) {
        console.log(`on connect called : ${socket.id}`);
    }

    // 여기서 에러가안잡히는 이유는 Http Exception만 잡도록 pipe가 설계되었기 떄문입니다.
    // WsException을 잡을려면 별도의 Exception Filter를 거칠 수 있도록 만들어야 한다.
    // 에러를 다르게 변환은 시킬 수 있는 데코레이터는 Exception Filter
    @UsePipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(SocketCatchHttpExceptionFilter)
    @UseGuards(SocketBearerTokenGuard)
    @SubscribeMessage("create_chat")
    async createChat(@MessageBody() data: CreateChatDto, @ConnectedSocket() socket: Socket & { user: UsersModel }) {
        const chat = await this.chatsService.createChat(data);
    }

    @SubscribeMessage("enter_chat")
    async enterChat(@MessageBody() data: EnterChatDto, @ConnectedSocket() socket: Socket) {
        for (const chatId of data.chatIds) {
            const exists = await this.chatsService.checkIfChatExists(chatId);

            if (!exists) {
                throw new WsException({
                    code: 100,
                    message: `존재하지 않는 chat입니다. chatId: ${chatId}`,
                });
            }
        }
        socket.join(data.chatIds.map((x) => x.toString()));
    }

    @SubscribeMessage("send_message")
    async sendMessage(@MessageBody() dto: CreateMessagesDto, @ConnectedSocket() socket: Socket) {
        const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

        if (!chatExists) {
            throw new WsException(`존재하지 않는 채팅방입니다. Chat ID: ${dto.chatId}`);
        }

        const message = await this.messagesService.createMessage(dto);
        console.log(message);

        socket.to(message.chat.id.toString()).emit("receive_message", message.message);
    }
}
