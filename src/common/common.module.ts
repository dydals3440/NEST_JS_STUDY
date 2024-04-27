import { Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { CommonController } from "./common.controller";

@Module({
    controllers: [CommonController],
    providers: [CommonService],
    // CommonService를 CommonModule도 import하는 곳에서 쓰게하기ㅜ이하면 exports
    exports: [CommonService],
})
export class CommonModule {}
