export type Category = {
  id: string;
  name: string;
};

// カテゴリをフェッチしたときのレスポンスのデータ型
export type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事のカテゴリ選択用のデータ型
export type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};
