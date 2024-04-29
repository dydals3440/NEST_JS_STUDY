// socket io 가 연결하는 곳을 nest에서 gateway라고 부름

import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
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
import { UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { SocketCatchHttpExceptionFilter } from "src/common/exception-filter/socket-catch-http.exception-filter";

import { UsersModel } from "src/users/entities/users.entity";
import { UsersService } from "src/users/users.service";
import { AuthService } from "src/auth/auth.service";

// 괄호 안에 옵션에 namespace정의
@WebSocketGateway({
    // ws://localhost:3000/chats
    namespace: "chats",
})
// onConnect 설정는 implements한다음에 onGatewayConnection을 이식
export class ChatsGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect {
    constructor(
        private readonly chatsService: ChatsService,
        private readonly messagesService: ChatsMessagesService,
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
    ) {}
    @WebSocketServer()
    server: Server;

    // OnGatewayInit (server인자는 위랑 동일)
    afterInit(server: any) {
        // 게이트가 초기화되었을떄 실행할 수 있는 함수.
        // 게이트웨이가 시작됐을떄 특정함수나 로직을 실행하고싶으면 afterInit을 사용하면됨.
        console.log(`after gateway init`);
    }

    handleDisconnect(socket: Socket) {
        console.log(`on disconnect called: ${socket.id}`);
    }

    // 연결을 하고서, 연결이 뚫리면 클라이언트와 서버가 파이프같은게 생김.
    // 같은 클라이언트는 같은 소켓을 통해서 통신함. (한번 연결되있음 계속 지속됨 그래야 통신되므로)
    // 사용자정보를 연결이 된 후에 아래 socket에다 정보를 연결해주면 그러면은 그 소켓 정보가 다른 메시지를 보낼떄 전부다 지속이 됩니다.
    async handleConnection(socket: Socket & { user: UsersModel }) {
        console.log(`on connect called : ${socket.id}`);

        const headers = socket.handshake.headers;

        const rawToken = headers["authorization"];

        if (!rawToken) {
            socket.disconnect();
        }
        try {
            const token = this.authService.extractTokenFromHeader(rawToken, true);
            const payload = this.authService.verifyToken(token);
            const user = await this.usersService.getUserByEmail(payload.email);

            socket.user = user;

            return true;
        } catch (e) {
            // 검증이 안되면 연결끊음
            socket.disconnect();
        }
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
    @SubscribeMessage("create_chat")
    async createChat(@MessageBody() data: CreateChatDto, @ConnectedSocket() socket: Socket & { user: UsersModel }) {
        const chat = await this.chatsService.createChat(data);
    }

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
    @SubscribeMessage("send_message")
    async sendMessage(@MessageBody() dto: CreateMessagesDto, @ConnectedSocket() socket: Socket & { user: UsersModel }) {
        const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

        if (!chatExists) {
            throw new WsException(`존재하지 않는 채팅방입니다. Chat ID: ${dto.chatId}`);
        }

        const message = await this.messagesService.createMessage(dto, socket.user.id);
        console.log(message);

        socket.to(message.chat.id.toString()).emit("receive_message", message.message);
    }
}
