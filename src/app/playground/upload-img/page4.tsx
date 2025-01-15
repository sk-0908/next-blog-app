"use client";
import { useState, ChangeEvent } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import CryptoJS from "crypto-js";
import Image from "next/image";

// ファイルのMD5ハッシュ値を計算する関数
const calculateMD5Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
};

const Page: React.FC = () => {
  const bucketName = "cover_image";
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>();
  const { session } = useAuth();

  // ▼ 変更: handleImageChange → uploadImage
  const uploadImage = async (file: File) => {
    setCoverImageKey(undefined); // 画像のキーをリセット
    setCoverImageUrl(undefined); // 画像のURLをリセット

    // ファイルのハッシュ値を計算
    const fileHash = await calculateMD5Hash(file);
    const path = `private/${fileHash}`;
    // ファイルが存在する場合は上書きするための設定 → upsert: true
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });

    if (error || !data) {
      window.alert(`アップロードに失敗 ${error.message}`);
      return;
    }
    // 画像のキー (実質的にバケット内のパス) を取得
    setCoverImageKey(data.path);
    const publicUrlResult = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    // 画像のURLを取得
    setCoverImageUrl(publicUrlResult.data.publicUrl);
  };

  // ▼ 追加 ▼
  const openImageFileSelector = () => {
    // 非表示の FileInput 要素を動的に生成して
    // プログラム的にクリックイベントを発生させる
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        await uploadImage(file);
      } catch (error) {
        alert("画像のアップロードに失敗しました。");
      }
    };
    fileInput.click(); // クリックイベントを発生
  };

  // ログインしていないとき (＝supabase.storageが使えない状態のとき)
  if (!session) return <div>ログインしていません。</div>;

  return (
    <div>
      {/* ▼ 変更 ▼ */}
      <button
        className="rounded-md bg-indigo-500 px-3 py-1 text-white"
        onClick={openImageFileSelector}
      >
        ファイルを選択
      </button>
      {/* ▲ 変更 ▲ */}
      <div className="break-all text-sm">coverImageKey : {coverImageKey}</div>
      <div className="break-all text-sm">coverImageUrl : {coverImageUrl}</div>
      {coverImageUrl && (
        <div className="mt-2">
          <Image
            className="w-1/2 border-2 border-gray-300"
            src={coverImageUrl}
            alt="プレビュー画像"
            width={1024}
            height={1024}
            priority
          />
        </div>
      )}
    </div>
  );
};

export default Page;
