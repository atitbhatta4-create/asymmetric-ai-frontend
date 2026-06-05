import React, { useEffect, useRef, useState } from "react";
import * as api from "../lib/api";

type Message = { sender: "user" | "admin"; message: string; sent_at: string };
type Ticket  = { id: number; status: string; subject: string; last_admin_reply_at: string | null };

const FAQ_QUESTIONS = [
  "How do I connect my exchange?",
  "Why is my AI not starting?",
  "How do MINI_ASYM settings work?",
  "How do I withdraw or reset my balance?",
];

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function SupportChat() {
  const [open, setOpen]         = useState(false);
  const [ticket, setTicket]     = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [unread, setUnread]     = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const res = await api.apiRequest("/support/ticket", { method: "GET" }) as any;
      if (res?.ticket) {
        const prevCount = messages.length;
        setTicket(res.ticket);
        setMessages(res.messages || []);
        if (!open && (res.messages || []).length > prevCount) setUnread(true);
      }
    } catch {}
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [open, messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      if (!ticket) {
        await api.apiRequest("/support/ticket", {
          method: "POST",
          body: JSON.stringify({ message: text.trim() }),
        });
      } else {
        await api.apiRequest("/support/message", {
          method: "POST",
          body: JSON.stringify({ message: text.trim() }),
        });
      }
      setInput("");
      await load();
    } catch (e: any) {
      alert("Failed to send: " + (e?.message || "unknown error"));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isResolved = ticket?.status === "resolved";

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9000,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg,#00ffe0,#0066ff)",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,255,224,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#050814", fontWeight: 900,
          transition: "transform 0.15s",
        }}
        title="Support"
      >
        {open ? "✕" : "?"}
        {unread && !open && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 12, height: 12, borderRadius: "50%",
            background: "#f87171", border: "2px solid #050814",
          }} />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 86, right: 24, zIndex: 8999,
          width: 340, maxHeight: 520,
          background: "rgba(9,15,30,0.97)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg,#00ffe0,#0066ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#050814", fontWeight: 900,
            }}>A</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>Asymmetric AI Support</div>
              <div style={{ fontSize: 10, opacity: 0.55 }}>We reply within 24 hours</div>
            </div>
            {isResolved && (
              <span style={{
                marginLeft: "auto", fontSize: 10, fontWeight: 900,
                color: "#00ffe0", background: "rgba(0,255,224,0.10)",
                border: "1px solid rgba(0,255,224,0.25)",
                borderRadius: 8, padding: "2px 8px",
              }}>Resolved</span>
            )}
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 8,
            minHeight: 180,
          }}>
            {loading && messages.length === 0 && (
              <div style={{ opacity: 0.4, fontSize: 12, textAlign: "center", marginTop: 20 }}>Loading…</div>
            )}

            {messages.length === 0 && !loading && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14, lineHeight: 1.6 }}>
                  Hi! How can we help you today?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {FAQ_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        background: "rgba(0,255,224,0.06)",
                        border: "1px solid rgba(0,255,224,0.18)",
                        borderRadius: 10, padding: "7px 10px",
                        color: "rgba(0,255,224,0.9)", fontSize: 11,
                        cursor: "pointer", textAlign: "left", fontWeight: 700,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}>
                <div style={{
                  padding: "8px 12px",
                  borderRadius: m.sender === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.sender === "user"
                    ? "linear-gradient(135deg,rgba(0,102,255,0.6),rgba(0,255,224,0.3))"
                    : "rgba(255,255,255,0.07)",
                  fontSize: 12, lineHeight: 1.55,
                }}>
                  {m.message}
                </div>
                <div style={{
                  fontSize: 9, opacity: 0.4, marginTop: 3,
                  textAlign: m.sender === "user" ? "right" : "left",
                }}>
                  {m.sender === "admin" ? "Support · " : ""}{fmtTime(m.sent_at)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!isResolved && (
            <div style={{
              padding: "10px 12px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", gap: 8, alignItems: "flex-end",
            }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                style={{
                  flex: 1, resize: "none",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 10, padding: "8px 10px",
                  color: "white", fontSize: 12, outline: "none",
                  fontFamily: "inherit", lineHeight: 1.5,
                  maxHeight: 80, overflowY: "auto",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: input.trim()
                    ? "linear-gradient(135deg,#00ffe0,#0066ff)"
                    : "rgba(255,255,255,0.07)",
                  border: "none", cursor: input.trim() ? "pointer" : "default",
                  color: input.trim() ? "#050814" : "rgba(255,255,255,0.3)",
                  fontSize: 16, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                  fontWeight: 900,
                }}
              >
                ↑
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
