import { FormEvent, useEffect, useState } from "react";
import { fetchMessages, sendMessageApi } from "../api";
import { Message } from "../types";

const ChatPage = () => {
  const [targetId, setTargetId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async (userId: number) => {
    try {
      const data = await fetchMessages(userId);
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (targetId) {
      load(Number(targetId));
    }
  }, [targetId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const id = Number(targetId);
    if (!id || !content.trim()) return;
    try {
      await sendMessageApi(id, content.trim());
      setContent("");
      load(id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2 style={{ margin: 0 }}>チャット</h2>
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>相手ユーザーID</h4>
        <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="例: 2" />
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>メッセージ</h4>
        {targetId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="chat-box">
              {messages.length === 0 && <p>まだメッセージがありません。</p>}
              {messages.map((m) => (
                <div key={m.id} className="chat-row">
                  <div>
                    <strong>@{m.sender.username}</strong>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                  <p style={{ margin: "4px 0" }}>{m.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend}>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="メッセージを入力"
              />
              <div className="footer-actions">
                <button type="submit">送信</button>
              </div>
            </form>
          </div>
        ) : (
          <p>ユーザーIDを入力してください。</p>
        )}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      </div>
    </div>
  );
};

export default ChatPage;
