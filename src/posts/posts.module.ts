import { UsersModel } from "src/users/entities/users.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BadRequestException, Module } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { PostsModel } from "./entities/posts.entity";
import { AuthService } from "src/auth/auth.service";
import { UsersService } from "src/users/users.service";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";
import { CommonModule } from "src/common/common.module";
import { MulterModule } from "@nestjs/platform-express";
import { extname } from "path";
import * as multer from "multer";
import { POST_IMAGE_PATH } from "src/common/const/path.const";
import { v4 as uuid } from "uuid";
import { ImageModel } from "src/common/entity/image.entity";

// controllers에는 컨트롤러들을 등록할 수 있는 위치
// ()해야 인스턴스를 넣는건데 우리는 PostsService이런식으로 인스턴스를 넣은게 아님
// 모듈이 생성되는 순간에 클래스를 인스턴스 화 시키고 싶은 게 아니라, iOC 컨테이너가 자동으로 인스턴스화하고 관리하는 것을 원하기에
// 인스턴스화 해서 관리할 클래스만 그대로 클래스로 입력.
// Service라는 명칭은 어떤 역할을 하는지에 대한 정의, 데이터를 다루는 로직을 작성을 서비스라고 부름
// 나중에, DB와 쉽게 통신하는 Type ORM이나, 인증과 검증에 필요한 기능들을 컨트롤러 안에서, 서비스 안에서 주입을 받아야 하는 경우
// 서비스가 아니더라도 특정 클래스에 컨트롤러에서 주입 받은 것처럼, 그 클래스들은 providers안에 넣어주면 됩니다.
// 이 모듈안에 등록되어 있는 컨트롤러와 프로바이더스 안에서는 모든 클래스들을 인스턴스화 없이 IoC컨테이너에 의존하면서 사용가능.
// 컨트롤러 내부에서 ()이런식으로 인스턴스화 하지 않고 포스트 서비스에서 사용할 수 있는것과 같다.
@Module({
    imports: [
        JwtModule.register({}),
        TypeOrmModule.forFeature([PostsModel, UsersModel, ImageModel]),
        AuthModule,
        UsersModule,
        CommonModule,
    ],
    controllers: [PostsController],
    providers: [PostsService, AuthService, UsersService],
})
// PostsService는 PostsModule안에 provider로 등록되어있음.
// PostsService안에서, PostRepository를 사용할 것이기 떄문에 위와같이 해주어야한다.
export class PostsModule {}
