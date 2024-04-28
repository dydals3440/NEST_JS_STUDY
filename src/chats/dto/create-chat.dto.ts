import { IsNumber } from "class-validator";

export class CreateChatDto {
    @IsNumber({}, { each: true }) // each true로 각각의 값들이 숫자인지 판단하게
    userIds: number[];
}
