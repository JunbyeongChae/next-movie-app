// src/app/login/page.tsx
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
        <LoginForm />
      </div>
    </main>
  );
}