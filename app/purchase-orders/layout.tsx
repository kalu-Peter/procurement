import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Orders - TUM Procurement",
  description: "Manage purchase orders and track deliveries",
};

export default function PurchaseOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
