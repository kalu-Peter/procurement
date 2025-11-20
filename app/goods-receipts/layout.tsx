import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goods Receipts - TUM Procurement",
  description: "Manage goods receipts and track three-way match verification",
};

export default function GoodsReceiptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
