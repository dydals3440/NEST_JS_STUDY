import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModel } from "./entity/users.entity";

@Module({
    // Service에서 Repository를 사용할려면 module에 import해주어야함.
    imports: [TypeOrmModule.forFeature([UsersModel])],
    exports: [UsersService],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule {}
