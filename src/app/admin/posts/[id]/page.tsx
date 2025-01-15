"use client";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";
import { calculateMD5Hash } from "@/app/_utils/calculateMD5Hash";
import { supabase } from "@/utils/supabase";
import Image from "next/image";
import { CategoryApiResponse, SelectableCategory } from "@/app/_types/Category";
import { PostApiResponse } from "@/app/_types/Post";

// 投稿記事の編集ページ
const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageUrl, setNewCoverImageUrl] = useState("");
  const [newCoverImageKey, setNewCoverImageKey] = useState("");

  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { token } = useAuth();

  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // 編集前の投稿記事のデータ (State)
  const [rawApiPostResponse, setRawApiPostResponse] =
    useState<PostApiResponse | null>(null);

  // 投稿記事の取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setRawApiPostResponse(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setRawApiPostResponse(apiResBody);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `投稿記事の取得に失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };

    fetchPost();
  }, [id]);

  // カテゴリの一覧の取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as CategoryApiResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchCategories();
  }, []);

  // 投稿記事のデータが取得できたらカテゴリの選択状態を更新する
  useEffect(() => {
    // 初期化済みなら戻る
    if (isInitialized) return;

    // 投稿記事 または カテゴリ一覧 が取得できていないなら戻る
    if (!rawApiPostResponse || !checkableCategories) return;

    // 投稿記事のタイトル、本文、カバーイメージURLを更新
    setNewTitle(rawApiPostResponse.title);
    setNewContent(rawApiPostResponse.content);
    setNewCoverImageKey(rawApiPostResponse.coverImageKey);
    const publicUrlResult = supabase.storage
      .from(bucketName)
      .getPublicUrl(rawApiPostResponse.coverImageKey);
    setNewCoverImageUrl(publicUrlResult.data.publicUrl);

    // カテゴリの選択状態を更新
    const selectedIds = new Set(
      rawApiPostResponse.categories.map((c) => c.category.id)
    );
    setCheckableCategories(
      checkableCategories.map((category) => ({
        ...category,
        isSelect: selectedIds.has(category.id),
      }))
    );
    setIsInitialized(true);
  }, [isInitialized, rawApiPostResponse, checkableCategories, bucketName]);

  // チェックボックスの状態 (State) を更新する関数
  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ここにタイトルのバリデーション処理を追加する
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // ここに本文のバリデーション処理を追加する
    setNewContent(e.target.value);
  };

  //
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setNewCoverImageKey("");
    setNewCoverImageUrl("");

    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files?.[0];
    const fileHash = await calculateMD5Hash(file);
    const path = `private/${fileHash}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });

    if (error || !data) {
      window.alert(`アップロードに失敗 ${error.message}`);
      return;
    }
    setNewCoverImageKey(data.path);
    const publicUrlResult = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    setNewCoverImageUrl(publicUrlResult.data.publicUrl);
  };

  // フォームの送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // この処理をしないとページがリロードされるので注意

    // ▼ 追加: トークンが取得できない場合はアラートを表示して処理中断
    if (!token) {
      window.alert("予期せぬ動作：トークンが取得できません。");
      return;
    }

    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/posts/[id]) にPUTリクエストを送信する処理
    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageKey: newCoverImageKey,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }

      // 投稿記事ページにリダイレクト
      setIsSubmitting(false);
      router.push(`/posts/${id}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  // 「削除」のボタンが押下されたときにコールされる関数
  const handleDelete = async () => {
    // prettier-ignore
    if (!window.confirm(`本当に削除しますか？`)) {
      return;
    }

    // ▼ 追加: トークンが取得できない場合はアラートを表示して処理中断
    if (!token) {
      window.alert("予期せぬ動作：トークンが取得できません。");
      return;
    }

    try {
      setIsSubmitting(true);
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Authorization: token,
        },
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      // 投稿記事ページにリダイレクト
      setIsSubmitting(false);
      router.push(`/admin/posts`);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の編集・削除</div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageKey" className="block font-bold">
            カバーイメージ (Key)
          </label>
          <input
            type="url"
            id="coverImageKey"
            name="coverImageKey"
            className="w-full rounded-md border-2 px-2 py-1 text-gray-500"
            value={newCoverImageKey}
            disabled
            readOnly
            required
          />

          <input
            id="imgSelector"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden={true}
            ref={hiddenFileInputRef}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => hiddenFileInputRef.current?.click()}
              className="mt-1.5 rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              画像ファイルを選択
            </button>
          </div>
        </div>

        {newCoverImageUrl != "" && (
          <div className="mt-2">
            <Image
              className="rounded-xl"
              src={newCoverImageUrl}
              alt="プレビュー画像"
              width={1024}
              height={0}
              priority
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories!.length > 0 ? (
              checkableCategories!.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed"
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>

          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600"
            )}
            onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
