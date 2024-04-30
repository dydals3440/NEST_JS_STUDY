import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersModel } from "./entity/users.entity";
import { Repository } from "typeorm";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UsersModel)
        private readonly usersRepository: Repository<UsersModel>,
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
        const user = await this.usersRepository.findOne({
            where: {
                id: followerId,
            },
            relations: {
                followees: true,
            },
        });

        if (!user) {
            throw new BadRequestException("존재하지 않는 팔로워입니다.");
        }

        await this.usersRepository.save({
            ...user,
            followees: [
                ...user.followees,
                {
                    id: followeeId,
                },
            ],
        });
    }

    async getFollowers(userId: number): Promise<UsersModel[]> {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
            relations: {
                followers: true,
            },
        });

        return user.followers;
    }
}
