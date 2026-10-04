import { buttonClass } from "@/components/ui/button";

// Shown at /admin/ when signed out. A plain <a>: the sign-in route redirects
// to GitHub, so it must not be prefetched.
export function SignIn({ next }: { next: string }) {
  return (
    <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 py-16">
      <h1 className="type-lead">Admin</h1>
      <p className="type-body text-fg-soft">Sign in with the site owner&apos;s GitHub account.</p>
      <p>
        <a href={`/api/auth/signin/?next=${encodeURIComponent(next)}`} className={buttonClass("primary")}>
          Sign in with GitHub
        </a>
      </p>
    </main>
  );
}
