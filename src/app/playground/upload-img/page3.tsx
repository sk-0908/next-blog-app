"use client";
import { useState, ChangeEvent } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import CryptoJS from "crypto-js";
import Image from "next/image"; // ◀ 追加

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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setCoverImageKey(undefined); // 画像のキーをリセット
    setCoverImageUrl(undefined); // 画像のURLをリセット

    // 画像が選択されていない場合は戻る
    if (!e.target.files || e.target.files.length === 0) return;

    // 複数ファイルが選択されている場合は最初のファイルを使用する
    const file = e.target.files?.[0];
    // ファイルのハッシュ値を計算
    const fileHash = await calculateMD5Hash(file); // ◀ 追加
    // バケット内のパスを指定
    const path = `private/${fileHash}`; // ◀ 変更
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

  // ログインしていないとき (＝supabase.storageが使えない状態のとき)
  if (!session) return <div>ログインしていません。</div>;

  return (
    <div>
      <input
        id="imgSelector"
        type="file" // ファイルを選択するinput要素に設定
        accept="image/*" // 画像ファイルのみを選択可能に設定
        onChange={handleImageChange}
      />
      <div className="break-all text-sm">coverImageKey : {coverImageKey}</div>
      <div className="break-all text-sm">coverImageUrl : {coverImageUrl}</div>
      {/* ▼ 追加 ▼ */}
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
