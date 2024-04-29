import { FindManyOptions } from "typeorm";
import { PostsModel } from "../entity/posts.entity";

export const DEFAULT_POST_FIND_OPTIONS: FindManyOptions<PostsModel> = {
    // relations: ["author", "images"],
    // 배열도 가능, 객체로 넣은다음 추가하고 싶은 릴레이션의 값을 키값으로 넣어줄 수 있음.
    // 자동완성도 가능. true라고 하면, author를 릴레이션으로 포함해서 갖고오라는 의미
    relations: {
        author: true,
        images: true,
    },
};
