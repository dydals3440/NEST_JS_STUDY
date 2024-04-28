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

    // handleConnection은 연결이 되었을 떄 실행됨.
    handleConnection(socket: Socket) {
        console.log(`on connect called : ${socket.id}`);
    }

    @SubscribeMessage("enter_chat")
    enterChat(
        // 방의 ID들을 리스트로 받는 이유: 하나의 방만 join이 아닌, 여러개의 방을 join하고 싶을 수 있기 여러번 보내면 안좋을 것 같으니,
        // 한번에 여러개 방들을 받을 수 있게
        @MessageBody() data: number[],
        // 위에 인자로 받은 socket (현재 함수에 연결된 소켓 가져오는 방법)
        @ConnectedSocket() socket: Socket,
    ) {
        for (const chatId of data) {
            // socket.join() -> 방에 들어가는 이유
            // join하는 방 이름은 무조건 string
            socket.join(chatId.toString());
        }
    }

    @SubscribeMessage("send_message")
    sendMessage(@MessageBody() message: { message: string; chatId: number }, @ConnectedSocket() socket: Socket) {
        // this.server.emit("receive_message", "hello from server");
        // 특정 채팅방에만 보내고 싶을떄
        this.server.in(message.chatId.toString()).emit("receive_message", message.message);
    }
}
