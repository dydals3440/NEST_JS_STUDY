import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PostsModule } from "./posts/posts.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsModel } from "./posts/entities/posts.entity";
import { UsersModule } from "./users/users.module";
import { UsersModel } from "./users/entities/users.entity";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import {
    ENV_DB_DATABASE_KEY,
    ENV_DB_HOST_KEY,
    ENV_DB_PASSWORD_KEY,
    ENV_DB_PORT_KEY,
    ENV_DB_USERNAME_KEY,
} from "./common/const/env-keys.const";
import { ServeStaticModule } from "@nestjs/serve-static";
import { PUBLIC_FOLDER_PATH } from "./common/const/path.const";
import { ImageModel } from "./common/entity/image.entity";
import { LogMiddleware } from "./common/middleware/log.middleware";
import { ChatsModule } from './chats/chats.module';

@Module({
    // 다른 모듈을 불러올 떄 사용
    imports: [
        PostsModule,
        ServeStaticModule.forRoot({
            // public 폴더에 이미지가 있기에 public 폴더의 절대 경로
            // image.jpg 를 갖고올려면
            // rootPath만하면: http://localhost:3000/posts/image.jpg (X)
            // public이 안붙게됨. public 접두어를 붙고싶음.
            rootPath: PUBLIC_FOLDER_PATH,
            // http://localhost:3000/public/posts/image.jpg (O) 우리가 원하는 방향대로함.
            serveRoot: "/public",
        }),
        ConfigModule.forRoot({
            envFilePath: ".env",
            // module 이기떄문에 쓸려는 모든 곳에서 import를 넣어줘야함.
            // 그래야 특정 모듈 정보를 쓸 수 있음. isGlobal: true는 Appmodule에 한번만 해도 모두 사용 가능!
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            // database 타입
            type: "postgres",
            host: process.env[ENV_DB_HOST_KEY],
            // 포트는 무조건 숫자
            port: parseInt(process.env[ENV_DB_PORT_KEY]),
            username: process.env[ENV_DB_USERNAME_KEY],
            password: process.env[ENV_DB_PASSWORD_KEY],
            database: process.env[ENV_DB_DATABASE_KEY],
            entities: [PostsModel, UsersModel, ImageModel],
            // nestjs에서 작성하는 typeorm코드와 DB 싱크를 자동으로 맞출꺼나.(개발환경에서는 true / production 환경에서는 마음대로 바뀔 수 있기에 false로 자동싱크맞추기 안하게)
            synchronize: true,
        }),
        UsersModule,
        AuthModule,
        CommonModule,
        ChatsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogMiddleware).forRoutes({
            path: "*",
            method: RequestMethod.ALL,
        });
    }
}
