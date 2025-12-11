import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supplier Registration',
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
