import { IsOptional, IsString } from 'class-validator';
import { CreatePostDto } from './create-post.dto';
import { PartialType } from '@nestjs/mapped-types';
import { stringValidationMessage } from 'src/common/validation-message/string-validation-message';

// CreatePostDto는 무조건 title과 content를 입력해야하므로 옵셔널을 붙였을 떄 에러가 발생한다.
// 그래서 그냥 상속 받는 것이 아닌 무조건 옵셔널로 변경해주는 PartialType을 활용하여 상속받음된다.
export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsString({
    message: stringValidationMessage,
  })
  @IsOptional()
  title?: string;

  @IsString({
    message: stringValidationMessage,
  })
  @IsOptional()
  content?: string;
}
