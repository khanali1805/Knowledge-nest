"use client";
import { useState } from "react";
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form
      className="mt-5"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Thank you for subscribing.");
        setEmail("");
      }}
    >
      <div className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          className="min-w-0 flex-1 rounded-l-xl border border-r-0 border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/60 focus:border-white/50"
        />
        <button
          type="submit"
          className="rounded-r-xl bg-[var(--site-accent)] px-5 py-3 text-sm font-bold text-white"
        >
          Subscribe
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm font-semibold text-white/80">{message}</p>
      ) : null}
    </form>
  );
}
