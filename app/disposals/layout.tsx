import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disposals',
};

export default function DisposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
