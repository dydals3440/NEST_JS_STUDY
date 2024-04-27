import { join } from "path";

// 서버 프로젝트의 루트 폴더 (cwd 현재 서버를 실행한 위치 NEST_SNS 폴더의 절대경로)
export const PROJECT_ROOT_PATH = process.cwd();
// 외부에서 접근 가능한 파일들을 모아둔 폴더 이름.
export const PUBLIC_FOLDER_NAME = "public";
// 포스트 이미지들을 저장할 폴더 이름.
export const POSTS_FOLDER_NAME = "posts";

// 실제 공개폴더의 절대 경로
// /${프로젝트의 위치}/public
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

// 포스트 이미지룰 저장할 폴더
export const POST_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POSTS_FOLDER_NAME);

// 절대경로 x
// 앞에 경로는 사용자가 붙일 수 있게/public/posts/xxx.jpg
export const POST_PUBLIC_IMAGE_PATH = join(PUBLIC_FOLDER_NAME, POSTS_FOLDER_NAME);
