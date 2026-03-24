export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-axiom-bg px-4">
      {children}
    </div>
  );
}
