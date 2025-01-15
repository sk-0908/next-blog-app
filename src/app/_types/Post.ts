import { Category } from "./Category";
import { CoverImage } from "./CoverImage";

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  categories: Category[];
  coverImage: CoverImage;
};

// 投稿記事をフェッチしたときのレスポンスのデータ型
export type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageKey: string;
  createdAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};
