"use client";
import { useSearchParams } from "next/navigation";

const Page: React.FC = () => {
  const searchParams = useSearchParams();
  const rawReturnPath: string | null = searchParams.get("returnPath");

  return (
    <main>
      <div>rawReturnPath={rawReturnPath}</div>
    </main>
  );
};

export default Page;
