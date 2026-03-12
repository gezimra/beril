"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { FloatInput, FloatTextarea } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { trackEvent } from "@/lib/analytics/track";

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [subject, setSubject] = useState("Live chat support");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedThreadId = window.localStorage.getItem("beril_chat_thread");
      if (storedThreadId) {
        setThreadId(storedThreadId);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  async function submitMessage() {
    if (!message.trim()) {
      setErrorMessage("Shkruaj nje mesazh.");
      setStatusMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          subject,
          message: message.trim(),
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
          channel: "web_chat",
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        threadId?: string;
        mode?: "thread" | "message";
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Nuk u dergua mesazhi.");
      }

      if (payload.threadId) {
        setThreadId(payload.threadId);
        try {
          window.localStorage.setItem("beril_chat_thread", payload.threadId);
        } catch {
          // Ignore storage write errors.
        }
      }

      setMessage("");
      setStatusMessage(
        payload.mode === "thread"
          ? "Biseda u hap. Ekipi do te pergjigjet sa me shpejt."
          : "Mesazhi u dergua.",
      );

      trackEvent("start_chat", {
        route: window.location.pathname,
        source: "live_chat_widget",
        threadId: payload.threadId,
        channel: "web_chat",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Deshtoi dergimi.");
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-graphite/15 bg-ivory shadow-[0_30px_80px_-50px_rgba(44,44,44,0.55)]">
          <div className="flex items-center justify-between border-b border-graphite/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-graphite/65">Live Chat</p>
              <p className="text-sm text-graphite/78">BERIL Support</p>
            </div>
            <button
              type="button"
              aria-label="Close live chat"
              onClick={() => startTransition(() => setIsOpen(false))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-graphite/16 bg-white/80 text-graphite"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            {!threadId ? (
              <>
                <FloatInput
                  label="Emri"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
                <FloatInput
                  label="Email (opsionale)"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                />
                <PhoneInput
                  label="Telefoni (opsionale)"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                />
                <FloatInput
                  label="Subjekti"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </>
            ) : (
              <p className="rounded-lg border border-graphite/10 bg-white/70 px-3 py-2 text-xs text-graphite/68">
                Thread ID: <span className="font-medium">{threadId}</span>
              </p>
            )}

            <FloatTextarea
              label="Shkruaj mesazhin..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />

            {statusMessage ? <p className="text-xs text-mineral">{statusMessage}</p> : null}
            {errorMessage ? <p className="text-xs text-walnut">{errorMessage}</p> : null}

            <button
              type="button"
              onClick={submitMessage}
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-walnut px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Duke derguar..." : "Dergo"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => startTransition(() => setIsOpen(true))}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-mineral/35 bg-mineral px-4 text-sm font-medium text-white shadow-lg"
        >
          <MessageCircle className="h-4 w-4" />
          Live Chat
        </button>
      )}
    </div>
  );
}
