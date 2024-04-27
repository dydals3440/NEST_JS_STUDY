import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { promises } from "fs";

import { basename, join } from "path";
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from "src/common/const/path.const";
import { ImageModel } from "src/common/entity/image.entity";
import { QueryRunner, Repository } from "typeorm";
import { CreatePostImageDto } from "./dto/create-image.dto";

@Injectable()
export class PostsImagesService {
    constructor(
        @InjectRepository(ImageModel)
        private readonly imageRepository: Repository<ImageModel>,
    ) {}

    getRepository(qr?: QueryRunner) {
        return qr ? qr.manager.getRepository<ImageModel>(ImageModel) : this.imageRepository;
    }

    async createPostImage(dto: CreatePostImageDto, qr?: QueryRunner) {
        const repository = this.getRepository(qr);

        // dto 이미지 이름 기반으로
        // 파일의 경로를 생성
        const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);

        try {
            // 파일 존재하는지 확인. (promises는 전부다 비동기)
            // access란 함수는, 경로를 넣었을 때 해당하는 파일이 접근가능한 상태인지 알려줌.
            // 즉, 파일이 존재하는지 확인 존재하지 않으면 에러 발생.
            await promises.access(tempFilePath);
        } catch (e) {
            // 위에서 에러시
            throw new BadRequestException("존재하지 않는 파일 입니다.");
        }
        // 파일의 이름만 가져오기 (fs module basename)
        // /Users/aaa/bbb/asdf.jpg => asdf.jpg 만 뽑아줌.
        const fileName = basename(tempFilePath);
        // 새로 이동할 포스트 폴더의 경로 + 이미지 이름.
        // /posts/asdf.jpg
        const newPath = join(POST_IMAGE_PATH, fileName);

        // save
        const result = await repository.save({
            ...dto,
        });

        // 실제 옮기기 (rename)
        await promises.rename(tempFilePath, newPath);

        return result;
    }
}
