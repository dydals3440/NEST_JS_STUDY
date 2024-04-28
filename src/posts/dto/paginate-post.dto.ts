import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { BasePaginationDto } from "src/common/dto/base-pagination.dto";

export class PaginatePostDto extends BasePaginationDto {
    @ApiProperty({
        example: 1,
        description: "[page, cursor] where__likeCount__more_than 보다 높은 likeCount수의 게시글을 추출합니다.",
        required: false,
    })
    @IsNumber()
    @IsOptional()
    where__likeCount__more_than: number;

    // main.ts whiteList: true 해주게되면, 아무리 쿼리를 보내도 데코레이더 적용이 안되면, 쿼리 요청이 안되게 함.
    // forbidNonWhitelisted: true, 어떤 쿼리가 빠졌는지 보고 싶으면 main.ts에서 이 옵션 켜줌.
    @ApiProperty({
        example: "제목",
        description: "[page, cursor] 대소문자 구분하지 않고, title과 일치하는 포스트를 반환합니다..",
        required: false,
    })
    @IsString()
    @IsOptional()
    where__title__i_like: string;
}
