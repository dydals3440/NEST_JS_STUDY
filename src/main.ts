import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });

    const config = new DocumentBuilder()
        .setTitle("API 문서")
        .setDescription("API 문서입니다.")
        .setVersion("1.0")
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
    // next.js 전반적으로 적용할 파이프를 전달
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                // 임의로 변화하는 것을 허가한다.
                // true -> transform이 될떄, class validator를 기반으로 isNumber()라고 되어있으면, 숫자라고 변환이 되어 있어야지 정상인 것을 자동으로 인지하고, 자동으로 숫자를 변환하고 annotation들을 통과합니다.
                enableImplicitConversion: true,
            },
            // 이 옵션이 트루면, validator가 validation decorator가 적용되지 않은 모든 프로퍼티들을 삭제할 것이다.
            whitelist: true,
            // true시 stripping 대신 에러던짐
            forbidNonWhitelisted: true,
        }),
    );
    // // 글로벌 에러 적용
    // app.useGlobalFilters(new HttpExceptionFilter());

    await app.listen(3000);
}
bootstrap();
