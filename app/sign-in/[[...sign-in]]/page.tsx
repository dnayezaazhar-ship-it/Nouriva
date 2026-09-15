import { SignIn } from "@clerk/nextjs";
export default function SignInPage() { return <main className="auth-page"><div className="auth-brand"><span className="brand-mark">N</span> nouriva</div><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" /></main>; }
