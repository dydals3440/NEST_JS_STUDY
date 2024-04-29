import { PickType } from "@nestjs/mapped-types";
import { MessagesModel } from "../entity/messages.entity";
import { IsNumber } from "class-validator";

export class CreateMessagesDto extends PickType(MessagesModel, [
    // author, chat은 Model로 정의되기에 객체가 통쨰로 들어옴.
    "message",
]) {
    @IsNumber()
    chatId: number;
}
