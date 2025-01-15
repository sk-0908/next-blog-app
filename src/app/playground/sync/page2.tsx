"use client";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";

const syncTask = (name: string) => {
  // なんらかの処理が実行されると仮定
  console.log(`同期処理 ${name} が完了しました`);
};

const heavySyncTask = (workload: number) => {
  const startTime = Date.now();
  while (Date.now() - startTime < 1000) {}
  const ret = Math.floor(Math.random() * 10);
  console.log("同期処理 heavySyncTask が完了しました");
  return ret;
};

const heavyAsyncTask = async (workload: number) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const ret = Math.floor(Math.random() * 10);
  console.log("非同期処理 heavyAsyncTask が完了しました");
  return ret;
};

const Page: React.FC = () => {
  const syncProcess = () => {
    console.log("関数 syncProcess を開始");
    syncTask("処理1");
    heavySyncTask(1500);
    syncTask("処理2");
    console.log("関数 syncProcess の最後に到達");
  };

  const asyncProcess = async () => {
    console.log("関数 asyncProcess を開始");
    syncTask("処理1");
    heavyAsyncTask(1500);
    syncTask("処理2");
    console.log("関数 asyncProcess の最後に到達");
  };

  return (
    <main>
      <div className="mb-5 text-2xl font-bold">同期処理と非同期処理</div>
      <div className="space-y-3">
        <div className="space-x-2">
          <button
            type="button"
            onClick={syncProcess}
            className={twMerge(
              "rounded-md px-3 py-1 ",
              "bg-indigo-500 font-bold text-white hover:bg-indigo-600"
            )}
          >
            同期処理の実行
          </button>
          <button
            type="button"
            onClick={asyncProcess}
            className={twMerge(
              "rounded-md px-3 py-1 ",
              "bg-indigo-500 font-bold text-white hover:bg-indigo-600"
            )}
          >
            非同期処理の実行
          </button>
        </div>
        <div className="flex justify-items-start space-x-2">
          <div>
            <FontAwesomeIcon
              icon={faGear}
              className="animate-spin text-2xl [animation-duration:2s]"
            />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <input
                id={`cb-${i}`}
                type="checkbox"
                className="mr-1"
                defaultChecked={i === 1}
              />
              <label htmlFor={`cb-${i}`} className="font-bold">
                項目{i}
              </label>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Page;
