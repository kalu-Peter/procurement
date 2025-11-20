import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goods Receipt Details - Procurement",
  description: "View and update goods receipt status and details",
};

export default function GoodsReceiptDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
