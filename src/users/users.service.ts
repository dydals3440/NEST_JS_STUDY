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

    async getFollowers(userId: number): Promise<UsersModel[]> {
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
        const result = await this.userFollowersRepository.find({
            where: {
                followee: {
                    id: userId,
                },
            },
            relations: {
                follower: true,
                followee: true,
            },
        });

        return result.map((x) => x.follower);
    }
}
