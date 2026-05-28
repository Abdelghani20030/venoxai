import LoginForm from '../../components/auth/LoginForm';

export const metadata = {
  title: 'Login - Venoxa Progress Sync',
  description: 'Sign in to access your dashboard and sync progress.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B1020] transition-colors">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
