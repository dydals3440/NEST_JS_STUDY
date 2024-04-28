import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber, IsOptional } from "class-validator";

export class BasePaginationDto {
    // Page 기반 Pagination에서 필요한 데이터 (page가 들어오면 page기반 pagination임)
    @ApiProperty({
        example: 1,
        description:
            "[page] page parameter를 사용하셨을 경우, 페이지 기반 페이지네이션의 API를 반환합니다. 아닐시 커서기반 페이지네이션으로 동작하는 API가 반환됩니다.",
        required: false,
    })
    @IsNumber()
    @IsOptional()
    page?: number;

    // 이전 마지막 데이터 ID
    // 이 프로퍼티에 입력된 ID 보다 높은 ID 부터 값을 가져오기
    @ApiProperty({
        example: 1,
        description: "[page, cursor] where__id__less_than 보다 id 값이 작은 게시글을 반환합니다.",
        required: false,
    })
    @IsNumber()
    @IsOptional()
    where__id__less_than?: number;

    // 이전 마지막 데이터 ID
    // 이 프로퍼티에 입력된 ID 보다 높은 ID 부터 값을 가져오기
    @ApiProperty({
        example: 1,
        description: "[page, cursor] where__id__more_than 보다 id 값이 큰 게시글을 반환합니다.",
        required: false,
    })
    @IsNumber()
    @IsOptional()
    where__id__more_than?: number;

    // 10, 9, 8, 7
    // 6, 5, 4, 3
    // where__id_more_than = 7
    // where__id_less_than = 7

    // 정렬
    // createdAt -> 생성된 시간의 내림차 / 오름차 순으로 정렬
    @ApiProperty({
        example: "ASC",
        description: "[page, cursor] ASC시 오름차순, DESC 내림차순 정렬로 게시글을 반환합니다.",
        required: false,
    })
    @IsIn(["ASC", "DESC"])
    @IsOptional()
    order__createdAt: "ASC" | "DESC" = "ASC";

    // 몇개의 데이터를 응답으로 받을지
    @ApiProperty({
        example: 20,
        description: "[page, cursor] 몇개의 데이터를 받을지 설정합니다.",
        required: false,
    })
    @IsNumber()
    @IsOptional()
    take: number = 20;
}
