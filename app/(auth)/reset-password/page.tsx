import Link from "next/link";

export const metadata = {
  title: "Reset Password",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-graphite/65">BERIL</p>
        <h1 className="mt-2 text-4xl text-graphite">Reset Password</h1>
        <p className="mt-3 text-sm text-graphite/72">
          Password reset integration is planned in the admin operations phase.
        </p>
      </div>

      <form className="space-y-4" aria-label="Reset password form">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-graphite">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="owner@beril.store"
            className="w-full rounded-xl border border-graphite/20 bg-white/80 px-4 py-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
        >
          Send reset link
        </button>
      </form>

      <Link href="/login" className="text-sm text-graphite/74 hover:text-graphite">
        Back to login
      </Link>
    </div>
  );
}
