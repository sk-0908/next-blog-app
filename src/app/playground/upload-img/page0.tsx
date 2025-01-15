"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import Image from "next/image";
import CryptoJS from "crypto-js";

// next.config.mjs

const calculateMD5Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
};

const Page: React.FC = () => {
  const bucketName = "cover_image";
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>("");
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>("");
  const [isImgLoading, setIsImgLoading] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    if (!coverImageKey) return;
    const fetcher = async () => {
      const r = supabase.storage.from(bucketName).getPublicUrl(coverImageKey);
      setCoverImageUrl(r.data?.publicUrl);
    };
    fetcher();
  }, [coverImageKey]);

  const uploadImage = async (file: File) => {
    setIsImgLoading(true);
    const fileHash = await calculateMD5Hash(file);
    const filePath = `private/${fileHash}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    setIsImgLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    setCoverImageKey(data?.path);
  };

  const openImageFileSelector = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".jpg,.jpeg,.png";
    fileInput.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await uploadImage(file);
        }
      } catch (error) {
        alert("画像のアップロードに失敗しました。");
      }
    };
    fileInput.click();
  };

  if (!session) return <div>ログインしていません。</div>;

  return (
    <div>
      <div>
        <button
          className="rounded-md bg-indigo-500 px-3 py-1 text-white"
          onClick={openImageFileSelector}
        >
          画像を選択
        </button>
      </div>
      {isImgLoading && <div>アップロード中...</div>}
      {coverImageKey && (
        <div className="text-sm">ImageKey: {coverImageKey}</div>
      )}
      {coverImageUrl && (
        <div className="break-all text-sm">ImageUrl: {coverImageUrl}</div>
      )}
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
