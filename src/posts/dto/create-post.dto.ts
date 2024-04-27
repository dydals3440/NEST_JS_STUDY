import { IsOptional, IsString } from "class-validator";
import { PostsModel } from "../entities/posts.entity";
import { PickType } from "@nestjs/mapped-types";

// Pick, Omit, Partial  (타입을 반환)
// PickType, OmitType, PartialType (Nest에서 만들어줌 값을 반환 => extends를 할 수 있음.)

// OOP에서 상속을 받을 때 타입(Pick)을 입력할 수 없고, 값을 입력 받아야 한다.
// Pick 타입과 같은 기능을 해주는데 값을 반환해주는 친구가 필요하다.
export class CreatePostDto extends PickType(PostsModel, ["title", "content"]) {
    @IsString()
    @IsOptional()
    image?: string;
}
