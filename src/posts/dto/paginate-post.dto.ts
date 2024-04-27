import { IsNumber, IsOptional, IsString } from "class-validator";
import { BasePaginationDto } from "src/common/dto/base-pagination.dto";

export class PaginatePostDto extends BasePaginationDto {
    @IsNumber()
    @IsOptional()
    where__likeCount__more_than: number;

    // main.ts whiteList: true 해주게되면, 아무리 쿼리를 보내도 데코레이더 적용이 안되면, 쿼리 요청이 안되게 함.
    // forbidNonWhitelisted: true, 어떤 쿼리가 빠졌는지 보고 싶으면 main.ts에서 이 옵션 켜줌.
    @IsString()
    @IsOptional()
    where__title__i_like: string;
}
