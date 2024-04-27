import { BadRequestException, Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { CommonController } from "./common.controller";
import { MulterModule } from "@nestjs/platform-express";
import { extname } from "path";
import * as multer from "multer";
import { TEMP_FOLDER_PATH } from "src/common/const/path.const";
import { v4 as uuid } from "uuid";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [
        AuthModule,
        UsersModule,
        MulterModule.register({
            limits: {
                // byte 단위 입력(10mb -> 10만)
                fileSize: 1000000,
            },
            fileFilter: (req, file, cb) => {
                /**
                 * cb(에러, boolean)
                 *
                 * 첫번쨰 파라미터에는 에러가 있을 경우 에러정보를 넣어줌.
                 * 두번쨰 파라미터는 파일을 받을지 말지 boolean을 넣어줌.
                 */
                // xxx.jpg -> .jpg로 따오는게 extname 역할
                const ext = extname(file.originalname);

                if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
                    // 통과 못하면 저장 안할꺼니 False
                    return cb(new BadRequestException("jpg/jpeg/png 파일만 업로드 가능합니다."), false);
                }
                // 위에 에러가 없으면 파일을 받을꺼임.
                return cb(null, true);
            },
            storage: multer.diskStorage({
                destination: function (req, res, cb) {
                    // 1차적으로 파일이 저장되었을떄 업로드 할 temp 폴더
                    cb(null, TEMP_FOLDER_PATH);
                },
                filename: function (req, file, cb) {
                    // 12312312-123-123123-123123.png
                    cb(null, `${uuid()}${extname(file.originalname)}`);
                },
            }),
        }),
    ],
    controllers: [CommonController],
    providers: [CommonService],
    // CommonService를 CommonModule도 import하는 곳에서 쓰게하기ㅜ이하면 exports
    exports: [CommonService],
})
export class CommonModule {}
