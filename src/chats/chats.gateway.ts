// socket io 가 연결하는 곳을 nest에서 gateway라고 부름

import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

// 괄호 안에 옵션에 namespace정의
@WebSocketGateway({
    // ws://localhost:3000/chats
    namespace: "chats",
})
// onConnect 설정는 implements한다음에 onGatewayConnection을 이식
export class ChatsGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    handleConnection(socket: Socket) {
        console.log(`on connect called : ${socket.id}`);
    }

    @SubscribeMessage("enter_chat")
    enterChat(
        @MessageBody() data: number[],

        @ConnectedSocket() socket: Socket,
    ) {
        for (const chatId of data) {
            socket.join(chatId.toString());
        }
    }

    @SubscribeMessage("send_message")
    sendMessage(@MessageBody() message: { message: string; chatId: number }, @ConnectedSocket() socket: Socket) {
        socket.to(message.chatId.toString()).emit("receive_message", message.message);
    }
}
