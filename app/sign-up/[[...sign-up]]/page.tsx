import { SignUp } from "@clerk/nextjs";
export default function SignUpPage() { return <main className="auth-page"><div className="auth-brand"><span className="brand-mark">N</span> nouriva</div><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" /></main>; }
