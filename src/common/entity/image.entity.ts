import { Column, Entity, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { join } from "path";
import { POST_PUBLIC_IMAGE_PATH } from "../const/path.const";
import { PostsModel } from "src/posts/entity/posts.entity";

export enum ImageModelType {
    POST_IMAGE,
}

@Entity()
export class ImageModel extends BaseModel {
    @Column({
        default: 0,
    })
    @IsInt()
    @IsOptional()
    order: number;

    // UserModel -> 사용자 프로필 이미지
    // PostsModel -> 포스트 이미지
    @Column({
        enum: ImageModelType,
    })
    @IsEnum(ImageModelType)
    @IsString()
    type: ImageModelType;

    // 이미지의 경로.
    @Column()
    @IsString()
    // obj는 현재 객체 ImageModel이 인스턴스되었을떄 현재 객체를 가져올 수 있음.
    @Transform(({ value, obj }) => {
        if (obj.type === ImageModelType.POST_IMAGE) {
            return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
        } else {
            return value;
        }
    })
    path: string;

    @ManyToOne((type) => PostsModel, (post) => post.images)
    post?: PostsModel;
}
