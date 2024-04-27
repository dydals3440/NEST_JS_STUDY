import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, LessThan, MoreThan, Repository } from "typeorm";
import { PostsModel } from "./entities/posts.entity";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PaginatePostDto } from "./dto/paginate-post.dto";

import { CommonService } from "src/common/common.service";
import { ConfigService } from "@nestjs/config";
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from "src/common/const/env-keys.const";
import { POST_IMAGE_PATH, PUBLIC_FOLDER_PATH, TEMP_FOLDER_PATH } from "src/common/const/path.const";
import { basename, join } from "path";
import { promises } from "fs";

/**
 * author: string;
 * title: string;
 * content: string;
 * likeCount: number;
 * commentCount: number;
 */

export interface PostModel {
    id: number;
    author: string;
    title: string;
    content: string;
    likeCount: number;
    commentCount: number;
}

// 주입할 수 있다. 결과적으로, 모듈안에다가 우리가 프로바이더 안에 원하는 클래스를 등록하면, 디펜던시 인젝션의 용도로 사용가능.
// 그거외에도 실제로 프로바이더에다가, Injectable을 해줘야만 프로바이더로 사용할 수 있다.
// 프로바이더로 사용하고 싶은 클래스에다 모듈 등록 + 인젝터블로 애노테이션 해주는 것. 그럼 IoC 컨테이너가, 그 어떤 곳에서 사용할 수 있게 된다.
@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(PostsModel)
        private readonly postsRepository: Repository<PostsModel>,
        private readonly commonService: CommonService,
        private readonly configService: ConfigService,
    ) {}

    async getAllPosts() {
        return this.postsRepository.find({
            // 포스트에서 relation 연결한 author도 같이 받아오고 싶을 떄.
            relations: ["author"],
        });
    }

    async generatePosts(userId: number) {
        for (let i = 0; i < 100; i++) {
            await this.createPost(userId, {
                title: `임의로 생성된 포스트 제목 ${i}`,
                content: `임의로 생성도니 컨텐트 예시 ${i}`,
            });
        }
    }

    async paginatePosts(dto: PaginatePostDto) {
        return this.commonService.paginate(
            dto,
            this.postsRepository,
            {
                relations: ["author"],
            },
            "posts",
        );
        // 0번 페이지라는 개념은 없음, 0페이지부터 책을 읽었어 이런 개소리는 없음.
        // if (dto.page) {
        //     return this.pagePaginatePosts(dto)
        // } else {
        //     return this.cursorPaginatePosts(dto)
        // }
    }

    async pagePaginatePosts(dto: PaginatePostDto) {
        /**
         * data: Data[],
         * total: number
         *
         * [1] [2] [3] [4]
         */
        // const posts = await this.postsRepository.find({
        //   // page가 1부터 시작하기에 - 1 (1 - 1 = 0 이면 아무것도 스킵 안함.)
        //   skip: dto.take * (dto.page - 1),
        //   take: dto.take,
        //   order: {
        //     createdAt: dto.order__createdAt,
        //   },
        // });
        const [posts, count] = await this.postsRepository.findAndCount({
            // page가 1부터 시작하기에 - 1 (1 - 1 = 0 이면 아무것도 스킵 안함.)
            skip: dto.take * (dto.page - 1),
            take: dto.take,
            order: {
                createdAt: dto.order__createdAt,
            },
        });

        return {
            data: posts,
            total: count,
        };
    }

    // 1) 오름차순으로 정렬하는 커서기반의 pagination만 구현한다
    // 데이터 사라질떄 추가되었을떄 인피니트 스크롤할때 커서기반의 페이지네이션을 사용하면 중복피함. 데이터 스킵도 피함.
    async cursorPaginatePosts(dto: PaginatePostDto) {
        // 내림차순 가정
        const where: FindOptionsWhere<PostsModel> = {};

        if (dto.where__id__less_than) {
            /**
             * {
             *  id: LessThan(dto.where__id_less_than)
             * }
             */
            where.id = LessThan(dto.where__id__less_than);
        } else if (dto.where__id__more_than) {
            where.id = MoreThan(dto.where__id__more_than);
        }

        // 1, 2, 3, 4, 5
        const posts = await this.postsRepository.find({
            where,
            // order__createdAt (생성된 시간과 날짜를 기준으로 오름차순)
            order: {
                createdAt: dto.order__createdAt,
            },
            take: dto.take,
        });

        // 해당되는 포스트가 0개 이상이면
        // 마지막 포스트를 가져오고
        // 아니면 null을 반환한다.
        // 추가적으로, 데이터가 4개남았는데 take가 20인경우, take에 관한 내용은 안받아오게 다음 페이지가 없다는 설정을 할 수 있다.
        // posts.length == dto.take 관한 설명
        const lastItem = posts.length > 0 && posts.length === dto.take ? posts[posts.length - 1] : null;

        const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
        const host = this.configService.get<string>(ENV_HOST_KEY);

        // lastItem이 null이면 nextUrl도 null
        const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);

        if (nextUrl) {
            /**
             * dto의 키값들을 루핑하면서
             * 키값에 해당하는 밸류가 존재하면
             * param에 그대로 붙여 넣는다.
             *
             * 단, where__id_more_than 값만 lastItem의 마지막 값으로 넣어준다.
             */
            for (const key of Object.keys(dto)) {
                if (dto[key]) {
                    if (key !== "where__id__more_than" && key !== "where__id__less_than") {
                        nextUrl.searchParams.append(key, dto[key]);
                    }
                }
            }

            let key = null;

            if (dto.order__createdAt === "ASC") {
                key = "where__id__more_than";
            } else {
                key = "where__id__less_than";
            }

            nextUrl.searchParams.append(key, lastItem.id.toString());
        }

        /**
         * Response
         *
         * data: Data[]
         * cursor: {
         *      after: 마지막 Data의 ID
         * },
         * count: 응답한 데이터 갯수
         * next: 다음 요청을 할 떄 사용할 URL
         */

        return {
            data: posts,
            cursor: {
                // lastItem?. 을 통해 false인 값이 아닐떄만 .id를 실행.
                // 뒤에 데이터가 없을때 "cursor": {} 이런식으로 오게되는데
                // 이게 불편하면 lastItem?.id ?? null
                after: lastItem?.id ?? null,
            },
            counts: posts.length,
            // null이면 toString() 못하므로 ?.하기
            next: nextUrl?.toString() ?? null,
        };
    }

    async getPostById(id: number) {
        const post = await this.postsRepository.findOne({
            where: {
                id,
            },
            relations: ["author"],
        });

        if (!post) {
            throw new NotFoundException();
        }

        return post;
    }

    async createPostImage(dto: CreatePostDto) {
        // dto 이미지 이름 기반으로
        // 파일의 경로를 생성
        const tempFilePath = join(TEMP_FOLDER_PATH, dto.image);

        try {
            // 파일 존재하는지 확인. (promises는 전부다 비동기)
            // access란 함수는, 경로를 넣었을 때 해당하는 파일이 접근가능한 상태인지 알려줌.
            // 즉, 파일이 존재하는지 확인 존재하지 않으면 에러 발생.
            await promises.access(tempFilePath);
        } catch (e) {
            // 위에서 에러시
            throw new BadRequestException("존재하지 않는 파일 입니다.");
        }
        // 파일의 이름만 가져오기 (fs module basename)
        // /Users/aaa/bbb/asdf.jpg => asdf.jpg 만 뽑아줌.
        const fileName = basename(tempFilePath);
        // 새로 이동할 포스트 폴더의 경로 + 이미지 이름.
        // /posts/asdf.jpg
        const newPath = join(POST_IMAGE_PATH, fileName);
        // 실제 옮기기 (rename)
        await promises.rename(tempFilePath, newPath);

        return true;
    }

    // async createPost(authorId: number, title: string, content: string)
    async createPost(authorId: number, postDto: CreatePostDto) {
        // 1) create -> 저장할 객체를 생성한다.
        // 2) save -> 객체를 저장한다. (create method에서 생성한 객체로 저장한다.)

        // 이거는 await를 안해도된다. 실제로 db에 저장하는 것이 아닌, 객체만 생성하는 것이기 떄문에 비동기가 아닌 동기이기 떄문.
        // 여기서 생성한 포스트는 id가 없음. (db에서 생성해줌)
        const post = this.postsRepository.create({
            author: {
                id: authorId,
            },
            // title,
            // content,
            ...postDto,
            likeCount: 0,
            commentCount: 0,
        });
        // 여기서 await하주고 실제 저장하는 기능 save를 실행하게 되면 newPost값에는, id까지 포함해서 모든 데이터들이 입력이 됩니다.
        const newPost = await this.postsRepository.save(post);
        // SNS시 완전히 같은 내용 제목 사용자 아이디를 갖고서 포스트를 할 수 있음. 실제로 하지만 다른 포스트가 될 것
        // 다른 포스트라는 의도를 갖고 올렸을 것. 완전히 같은 값들을 어떻게 구분할 수 있냐, 이것을 아이디로만 구분할 수 있다.
        // 그래서 PrimaryColumn이 꼭 필요한 것 이다.
        return newPost;
    }

    async updatePost(postDto: UpdatePostDto, id: number) {
        const { title, content } = postDto;
        // save의 기능
        // 1) 만약 데이터가 존재하지 않는 경우 (id 기준) 새로 생성한다.
        // 2) 만약 데이터가 존재한다. (같은 id 존재) 존재하는 값을 update한다.

        const post = await this.postsRepository.findOne({
            where: {
                id,
            },
        });

        if (!post) {
            throw new NotFoundException();
        }
        // Body에다 입력한 값만 수정할 수 있게함.
        // 기존의 찾은 post에다가 원하는 거 변경함.

        // 포스트를 만들면 포스트 author가 자동으로 들어가고 바뀔일 없음.
        // if (author) {
        //   post.author = author;
        // }

        if (title) {
            post.title = title;
        }

        if (content) {
            post.content = content;
        }

        // 여기의 post는 DB에서 실제로 가져온 post이기에, id값이 존재 할 것.
        const newPost = await this.postsRepository.save(post);

        return newPost;
    }

    async deletePost(postId: number) {
        const post = await this.postsRepository.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException();
        }

        // posts = posts.filter((post) => post.id !== +postId);

        await this.postsRepository.delete(postId);

        return postId;
    }
}
