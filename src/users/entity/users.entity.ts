import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { RolesEnum } from "../const/roles.const";
import { PostsModel } from "src/posts/entity/posts.entity";
import { BaseModel } from "src/common/entity/base.entity";
import { IsEmail, IsString, Length } from "class-validator";
import { lengthValidationMessage } from "src/common/validation-message/length-validation.message";
import { stringValidationMessage } from "src/common/validation-message/string-validation-message";
import { emailValidationMessage } from "src/common/validation-message/email-validation-message";
import { Exclude, Expose } from "class-transformer";
import { ChatsModel } from "src/chats/entity/chats.entity";
import { MessagesModel } from "src/chats/messages/entity/messages.entity";

/**
 * id: number
 *
 * nickname: string
 *
 * email: string
 *
 * password: string
 *
 * role [RolesEnum.USER, RolesEnum.ADMIN]
 *
 *
 */

@Entity()
// @Exclude()
export class UsersModel extends BaseModel {
    @Column({
        length: 20,
        unique: true,
    })
    @IsString({
        message: stringValidationMessage,
    })
    @Length(1, 20, {
        message: lengthValidationMessage,
    })
    // 1) 길이가 20을 넘지 않을 것 @Length(최소, 최대)
    // 2) 유일 무이한 값이 될 것 (중복 X)
    nickname: string;

    // 위에를 보여주고 싶으면 exclude annotation 반대인 expose를 사용
    // getter를 만듬. 닉네임과 이메일을 조합한 , 존재하지 않은 프로퍼티를 expose할 수 있음.
    @Expose()
    get nicknameAndEmail() {
        return this.nickname + "/" + this.email;
    }

    @Column({
        unique: true,
    })
    @IsString({
        message: stringValidationMessage,
    })
    @IsEmail({}, { message: emailValidationMessage })
    // 1) 유일 무이한 값이 될 것
    email: string;

    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    @Length(3, 8, {
        message: lengthValidationMessage,
    })
    /**
     * Request
     * FE -> BE
     * plain object (JSON) -> class instance dto
     *
     * Response
     * BE -> FE
     * class instance (dto) -> plain object (JSON)
     *
     * toClassOnly -> class instance로 변환될떄만 (요청시만 적용)
     * toPlainOnly -> plain object로 변환될떄만 (응답시만 적용)
     *
     * 요청시 우리는 비밀번호를 받아야하고, 클라이언트에서 응답할때만 exclude 시켜야함.
     */
    @Exclude({
        // 응답에서만 삭제
        toPlainOnly: true,
        // toClassOnly 요청에서만 삭제
    })
    password: string;

    // 그냥 RolesEnum이라고 타입만 전해주는 것 만으로는 Column에서 enum값을 인지못함.
    @Column({
        enum: Object.values(RolesEnum),
        default: RolesEnum.USER,
    })
    role: RolesEnum;

    @OneToMany(() => PostsModel, (post) => post.author)
    posts: PostsModel[];

    @ManyToMany(() => ChatsModel, (chat) => chat.users)
    @JoinTable()
    chats: ChatsModel[];

    @OneToMany(() => MessagesModel, (message) => message.author)
    messages: MessagesModel;
}
