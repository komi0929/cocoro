/**
 * cocoro — Space Layout
 * SSGプリレンダリングをスキップし、dynamic renderingを強制
 */
export const dynamic = 'force-dynamic';

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
