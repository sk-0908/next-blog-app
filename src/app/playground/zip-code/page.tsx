"use client";
import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";

const Page: React.FC = () => {
  const endpoint = "https://zipcloud.ibsnet.co.jp/api/search";

  const [response, setResponse] = useState<string>("");
  const [statusCode, setStatusCode] = useState<number>(200);
  const [queryParameter, setQueryParameter] = useState("zipcode=572-0832");

  const [requestUrl, setRequestUrl] = useState<string>("");
  const updateQueryParameter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryParameter(e.target.value);
  };

  useEffect(() => {
    // クエリパラメータが変更されたらリクエストURLを再構築
    // (パラメータに日本語が含まれるときのencodeURIでエンコード処理を含む)
    setRequestUrl(encodeURI(`${endpoint}?${queryParameter}`));
  }, [queryParameter]);

  const sendGetRequest = async (e: React.FormEvent) => {
    console.log("送信ボタンが押下されました");

    // Submitではデフォルトで、ページの再読み込みが発生するので、それを抑制
    e.preventDefault();

    // 初期状態に戻す
    setResponse("");
    setStatusCode(200);

    const response = await fetch(requestUrl, {
      method: "GET",
      cache: "no-store", // キャッシュを利用しない
    });

    setStatusCode(response.status);

    // JSON形式でデータ取得
    const parsedData = await response.json();

    // レスポンス全体確認を整形して表示
    setResponse(JSON.stringify(parsedData, null, 2));
  };

  return (
    <main>
      <div className="mb-5 text-2xl font-bold">郵便番号の検索</div>
      <div className="space-y-3">
        <form>
          <div className="flex items-center gap-x-3">
            <label htmlFor="parameter" className="font-bold">
              クエリパラメータ
            </label>
            <input
              type="text"
              id="parameter"
              value={queryParameter}
              onChange={updateQueryParameter}
              className="grow rounded-md border border-gray-400 px-2 py-0.5"
            />

            <button
              type="submit"
              onClick={sendGetRequest}
              className={twMerge(
                "rounded-md px-3 py-1 ",
                "bg-indigo-500 font-bold text-white hover:bg-indigo-600"
              )}
            >
              送信
            </button>
          </div>
        </form>

        <div className="flex items-center gap-x-2">
          <div className="font-bold">リクエストURL</div>
          <div className="grow text-sm text-blue-500">{requestUrl}</div>
        </div>

        <div>実行結果</div>
        <pre
          className={twMerge(
            "rounded-md bg-green-100 p-3 text-sm",
            statusCode !== 200 && "bg-red-100"
          )}
        >
          {response}
        </pre>
      </div>
    </main>
  );
};

export default Page;
