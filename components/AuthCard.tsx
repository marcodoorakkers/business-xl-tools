export default function AuthCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mb-6">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}
