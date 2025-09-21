import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suppliers Directory',
};

export default function SuppliersListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
