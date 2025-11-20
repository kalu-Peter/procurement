import { Metadata } from "next";

export const metadata: Metadata = {
  title: "P.O. Dispatch Log - TUM Procurement",
  description: "Track all purchase order dispatch activities and status",
};

export default function DispatchLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
