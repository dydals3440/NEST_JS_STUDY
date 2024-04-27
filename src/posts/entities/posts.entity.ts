import { Transform } from "class-transformer";
import { IsString } from "class-validator";
import { join } from "path";
import { POST_PUBLIC_IMAGE_PATH } from "src/common/const/path.const";
import { BaseModel } from "src/common/entity/base.entity";
import { ImageModel } from "src/common/entity/image.entity";
import { stringValidationMessage } from "src/common/validation-message/string-validation-message";
import { UsersModel } from "src/users/entities/users.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class PostsModel extends BaseModel {
    // 1) UsersModel과 연동 FK를 이용해서
    // 2) null이 될 수 없다.
    @ManyToOne(() => UsersModel, (user) => user.posts, {
        nullable: false,
    })
    author: UsersModel;
    // @Column()
    // author: string;

    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    title: string;

    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    content: string;

    @Column()
    likeCount: number;

    @Column()
    commentCount: number;

    @OneToMany((type) => ImageModel, (image) => image.post)
    images: ImageModel[];
}
