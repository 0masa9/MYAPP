import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Book, BookStatus } from "../types";
import { createBook, fetchBooks } from "../api";
import BookCard from "../components/BookCard";

const BooksPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<"all" | BookStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Partial<Book>>({ status: "want_to_read" });
  const [error, setError] = useState<string | null>(null);

  const loadBooks = async () => {
    try {
      const data = await fetchBooks(filter === "all" ? undefined : filter);
      setBooks(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      setError("タイトルを入力してください");
      return;
    }
    try {
      await createBook({
        title: form.title,
        author: form.author,
        status: (form.status as BookStatus) || "want_to_read",
        amazon_url: form.amazon_url,
        cover_image_url: form.cover_image_url,
        note_markdown: form.note_markdown || "",
      });
      setForm({ status: "want_to_read" });
      setShowCreate(false);
      setError(null);
      loadBooks();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openAmazonSearch = () => {
    if (!form.title) return;
    const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(form.title)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="container">
      <div className="header">
        <h2 style={{ margin: 0 }}>マイ本棚</h2>
        <div className="nav-actions">
          <button className="secondary" onClick={() => navigate("/books")}>トップ</button>
          <button className="secondary" onClick={logout}>ログアウト</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          すべて
        </button>
        <button className={`tab ${filter === "read" ? "active" : ""}`} onClick={() => setFilter("read")}>
          読んだ本
        </button>
        <button className={`tab ${filter === "want_to_read" ? "active" : ""}`} onClick={() => setFilter("want_to_read")}>
          今後読みたい本
        </button>
      </div>

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>本一覧</h3>
        <button onClick={() => setShowCreate(!showCreate)}>本を追加する</button>
      </div>

      {showCreate && (
        <div className="section" style={{ marginBottom: 16 }}>
          <h4 style={{ marginTop: 0 }}>新しい本</h4>
          <form onSubmit={handleCreate} className="form-grid">
            <div>
              <label className="label">タイトル</label>
              <input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="タイトル"
                required
              />
              <button type="button" className="secondary" style={{ marginTop: 6 }} onClick={openAmazonSearch}>
                Amazonで検索
              </button>
            </div>
            <div>
              <label className="label">著者</label>
              <input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <label className="label">ステータス</label>
              <select
                value={form.status || "want_to_read"}
                onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
              >
                <option value="want_to_read">今後読みたい本</option>
                <option value="read">読んだ本</option>
              </select>
            </div>
            <div>
              <label className="label">Amazon URL</label>
              <input
                value={form.amazon_url || ""}
                onChange={(e) => setForm({ ...form, amazon_url: e.target.value })}
                placeholder="https://www.amazon.co.jp/..."
              />
            </div>
            <div>
              <label className="label">表紙画像URL</label>
              <input
                value={form.cover_image_url || ""}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">メモ (Markdown)</label>
              <textarea
                rows={3}
                value={form.note_markdown || ""}
                onChange={(e) => setForm({ ...form, note_markdown: e.target.value })}
              />
            </div>
            <div className="footer-actions" style={{ gridColumn: "1 / -1" }}>
              <button type="submit">保存</button>
              <button type="button" className="secondary" onClick={() => setShowCreate(false)}>
                キャンセル
              </button>
            </div>
          </form>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        </div>
      )}

      {error && !showCreate && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div className="card-grid">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onClick={() => navigate(`/books/${book.id}`)} />
        ))}
      </div>
    </div>
  );
};

export default BooksPage;
