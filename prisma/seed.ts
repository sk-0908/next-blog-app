import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  // 既存のレコードを全て削除
  await prisma.postCategory?.deleteMany();
  await prisma.post?.deleteMany();
  await prisma.category?.deleteMany();

  // カテゴリデータの作成 (レコードのInsert)
  const c1 = await prisma.category.create({ data: { name: "カテゴリ1" } });
  const c2 = await prisma.category.create({ data: { name: "カテゴリ2" } });
  const c3 = await prisma.category.create({ data: { name: "カテゴリ3" } });
  const c4 = await prisma.category.create({ data: { name: "カテゴリ4" } });

  // 投稿記事データの作成 (レコードのInsert)
  const p1 = await prisma.post.create({
    data: {
      title: "投稿1",
      content: "投稿1の本文。<br/>投稿1の本文。投稿1の本文。",
      coverImageKey: "private/3fedfb5ef969643ef4cfd5fb411b3e94",
      categories: {
        create: [{ categoryId: c1.id }, { categoryId: c2.id }],
      },
    },
  });

  const p2 = await prisma.post.create({
    data: {
      title: "投稿2",
      content: "投稿2の本文。<br/>投稿2の本文。投稿2の本文。",
      coverImageKey: "private/66b5eaef3f153c05e3137717e0833985",
      categories: {
        create: [{ categoryId: c2.id }, { categoryId: c3.id }],
      },
    },
  });

  const p3 = await prisma.post.create({
    data: {
      title: "投稿3",
      content: "投稿3の本文。<br/>投稿3の本文。投稿3の本文。",
      coverImageKey: "private/85f1d26062b1b1b2a2b571e88e747df8",
      categories: {
        create: [
          { categoryId: c1.id },
          { categoryId: c3.id },
          { categoryId: c4.id },
        ],
      },
    },
  });

  const p4 = await prisma.post.create({
    data: {
      title: "投稿4",
      content: "投稿4の本文。<br/>投稿4の本文。投稿4の本文。",
      coverImageKey: "private/dc78202403844c73dd85f5a0938baa78",
      categories: {
        create: [],
      },
    },
  });

  console.log(JSON.stringify(p1, null, 2));
  console.log(JSON.stringify(p2, null, 2));
  console.log(JSON.stringify(p3, null, 2));
  console.log(JSON.stringify(p4, null, 2));
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
