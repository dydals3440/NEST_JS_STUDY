// socket io 가 연결하는 곳을 nest에서 gateway라고 부름

import {
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

    @SubscribeMessage("send_message")
    sendMessage(@MessageBody() message: string) {
        console.log(message);
        this.server.emit("receive_message", "hello from server");
    }
}
