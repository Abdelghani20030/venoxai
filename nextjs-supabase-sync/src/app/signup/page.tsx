import SignupForm from '../../components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up - Venoxa Progress Sync',
  description: 'Create an account to start syncing your language learning progress.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B1020] transition-colors">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </main>
  );
}
