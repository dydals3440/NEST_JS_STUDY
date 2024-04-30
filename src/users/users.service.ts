import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersModel } from "./entity/users.entity";
import { Repository } from "typeorm";
import { UserFollowersModel } from "./entity/user-followers.entity";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UsersModel)
        private readonly usersRepository: Repository<UsersModel>,
        @InjectRepository(UserFollowersModel)
        private readonly userFollowersRepository: Repository<UserFollowersModel>,
    ) {}

    async createUser(user: Pick<UsersModel, "email" | "nickname" | "password">) {
        // 1) 닉네임 중복이 없는지 확인
        // exist() => 만약에 조건에 해당되는 값이 있으면 true 반환
        const nicknameExists = await this.usersRepository.exists({
            where: {
                nickname: user.nickname,
            },
        });

        if (nicknameExists) {
            throw new BadRequestException("이미 존재하는 nickname 입니다!");
        }
        // 2) email 중복 체크
        const emailExists = await this.usersRepository.exists({
            where: {
                email: user.email,
            },
        });

        if (emailExists) {
            throw new BadRequestException("이미 가입한 email 입니다!");
        }

        const userObject = this.usersRepository.create({
            nickname: user.nickname,
            email: user.email,
            password: user.password,
        });

        const newUser = await this.usersRepository.save(userObject);

        return newUser;
    }

    async getAllUsers() {
        return this.usersRepository.find();
    }

    //
    async getUserByEmail(email: string) {
        return this.usersRepository.findOne({
            where: {
                email,
            },
        });
    }

    // follow
    async followUser(followerId: number, followeeId: number) {
        const result = await this.userFollowersRepository.save({
            follower: {
                id: followerId,
            },
            followee: {
                id: followeeId,
            },
        });

        return true;
    }

    async getFollowers(userId: number, includeNotConfirmed: boolean) {
        // find하면 배열로나옴
        /**
         * [
         *  {
         *      id: number;
         *      createdAt: Date;
         *      updatedAt: Date;
         *      isConfirmed: boolean;
         *      follower: UsersModel[];
         *      followee: UsersModel[];
         *  }
         * ]
         */

        const where = {
            followee: {
                id: userId,
            },
        };

        if (!includeNotConfirmed) {
            where["isConfirmed"] = true;
        }

        // where = { followee: { id: userId }, isConfirmed: true }

        const result = await this.userFollowersRepository.find({
            where: where,
            relations: {
                follower: true,
                followee: true,
            },
        });

        return result.map((x) => ({
            id: x.follower.id,
            nickname: x.follower.nickname,
            email: x.follower.email,
            isConfirmed: x.isConfirmed,
        }));
    }

    async confirmFollow(followerId: number, followeeId: number) {
        // followerId, followeeId로 중간테이블에 데이터가 있는지 확인
        const existing = await this.userFollowersRepository.findOne({
            where: {
                followee: {
                    id: followeeId,
                },
                follower: {
                    id: followerId,
                },
            },

            relations: {
                follower: true,
                followee: true,
            },
        });

        if (!existing) {
            throw new BadRequestException("존재하지 않는 팔로우 요청입니다.");
        }

        // save할때 id값만 넣으면, 변경된 부분만 업데이트
        // console.log(...existing);
        await this.userFollowersRepository.save({
            ...existing,
            isConfirmed: true,
        });

        return true;
    }

    async deleteFollow(followerId: number, followeeId: number) {
        await this.userFollowersRepository.delete({
            follower: {
                id: followerId,
            },
            followee: {
                id: followeeId,
            },
        });

        return true;
    }
}
