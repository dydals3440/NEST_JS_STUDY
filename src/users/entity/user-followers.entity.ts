import { BaseModel } from "src/common/entity/base.entity";
import { UsersModel } from "./users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class UserFollowersModel extends BaseModel {
    // UsersModel과 UserFollwersModel이 매핑됐을떄
    // 유저모델의 팔로워스에서, 특정 사용자가 여러개 유저 팔로워스를 레퍼런스 가능.
    // 1번 사용자가, 2번/3ㅂ/4ㅂ/ 여러개 사용자랑 레퍼런스도리 수있음.
    // 팔로워스 입장에서는
    @ManyToOne(() => UsersModel, (user) => user.followers)
    follower: UsersModel;

    @ManyToOne(() => UsersModel, (user) => user.followees)
    followee: UsersModel;

    @Column({
        default: false,
    })
    isConfirmed: boolean;
}
