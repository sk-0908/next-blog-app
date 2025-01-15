"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";

import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

import DOMPurify from "isomorphic-dompurify";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;
  const dtFmt = "YYYY年MM月DD日 HH:mm";

  // 動的ルートパラメータから id を取得 （URL:/posts/[id]）
  const { id } = useParams() as { id: string };

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const requestUrl = `/api/posts/${id}`;
        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const postApiResponse: PostApiResponse = await response.json();
        setPost({
          id: postApiResponse.id,
          title: postApiResponse.title,
          content: postApiResponse.content,
          coverImage: {
            url: supabase.storage
              .from(bucketName)
              .getPublicUrl(postApiResponse.coverImageKey).data.publicUrl,
            width: 1000,
            height: 1000,
          },
          createdAt: postApiResponse.createdAt,
          categories: postApiResponse.categories.map((category) => ({
            id: category.category.id,
            name: category.category.name,
          })),
        });
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [bucketName, id]);

  if (fetchError) {
    return <div>{fetchError}</div>;
  }

  // 投稿データの取得中は「Loading...」を表示
  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // 投稿データが取得できなかったらエラーメッセージを表示
  if (!post) {
    return <div>指定idの投稿の取得に失敗しました。</div>;
  }

  // HTMLコンテンツのサニタイズ
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });

  console.log(post, null, 2);

  return (
    <main>
      <div className="space-y-2">
        <div className="text-2xl font-bold">{post.title}</div>
        <div className="flex justify-end">
          投稿日：{dayjs(post.createdAt).format(dtFmt)}
        </div>
        <div>
          <Image
            src={post.coverImage.url}
            alt="Example Image"
            width={post.coverImage.width}
            height={post.coverImage.height}
            priority
            className="rounded-xl"
          />
        </div>
        <div className="flex space-x-1.5">
          {post.categories.map((category) => (
            <div
              key={category.id}
              className={twMerge(
                "rounded-md px-2 py-0.5",
                "text-xs font-bold",
                "border border-slate-400 text-slate-500"
              )}
            >
              {category.name}
            </div>
          ))}
        </div>
        <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
      </div>
    </main>
  );
};

export default Page;
