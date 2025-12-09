import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  createCommentApi,
  createNote,
  deleteBook,
  deleteCommentApi,
  deleteNote,
  fetchBook,
  fetchComments,
  fetchNotes,
  updateBook,
  updateNote,
} from "../api";
import { Book, BookStatus, Comment, NotePage } from "../types";
import RichNoteEditor from "../components/RichNoteEditor";

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Book>>({});
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<NotePage[]>([]);
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [noteForm, setNoteForm] = useState<Partial<NotePage>>({});
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNote, setNewNote] = useState<Partial<NotePage>>({ title: "新規ノート", sort_order: 0, content: "" });

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      const data = await fetchBook(Number(id));
      setBook(data);
      setForm(data);
      const [noteList, comm] = await Promise.all([
        fetchNotes(Number(id)),
        fetchComments(Number(id)),
      ]);
      setNotes(noteList);
      setComments(comm);
      if (noteList.length > 0) {
        setOpenNoteId(noteList[0].id);
        setNoteForm(noteList[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveBook = async () => {
    if (!book) return;
    try {
      const updated = await updateBook(book.id, {
        title: form.title,
        author: form.author,
        status: form.status as BookStatus,
        amazon_url: form.amazon_url,
        cover_image_url: form.cover_image_url,
        note_markdown: form.note_markdown,
        started_at: form.started_at,
        finished_at: form.finished_at,
        title_guess: form.title_guess,
      });
      setBook(updated);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteBook = async () => {
    if (!book) return;
    if (!confirm("削除してもよろしいですか？")) return;
    await deleteBook(book.id);
    navigate("/books");
  };

  const openAmazonSearch = () => {
    const title = form.title || book?.title;
    if (!title) return;
    window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`, "_blank");
  };

  // Notes
  const selectNote = (note: NotePage) => {
    setOpenNoteId(note.id);
    setNoteForm(note);
  };

  const handleCreateNote = async () => {
    if (!book || !newNote.title) return;
    try {
      const created = await createNote(book.id, {
        title: newNote.title,
        sort_order: newNote.sort_order ?? notes.length,
        content: newNote.content || "",
      });
      const updatedNotes = [...notes, created].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setNotes(updatedNotes);
      setOpenNoteId(created.id);
      setNoteForm(created);
      setNewNote({ title: "新規ノート", sort_order: updatedNotes.length, content: "" });
      setShowNewNote(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdateNote = async () => {
    if (!openNoteId) return;
    try {
      const updated = await updateNote(openNoteId, {
        title: noteForm.title,
        sort_order: noteForm.sort_order,
        content: noteForm.content,
      });
      const updatedList = notes.map((n) => (n.id === updated.id ? updated : n)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setNotes(updatedList);
      setNoteForm(updated);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("ノートを削除しますか？")) return;
    await deleteNote(noteId);
    const remaining = notes.filter((n) => n.id !== noteId);
    setNotes(remaining);
    if (remaining.length > 0) {
      setOpenNoteId(remaining[0].id);
      setNoteForm(remaining[0]);
    } else {
      setOpenNoteId(null);
      setNoteForm({});
    }
  };

  // Comments
  const handleCreateComment = async () => {
    if (!book || !commentInput.trim()) return;
    try {
      const created = await createCommentApi(book.id, commentInput.trim());
      setComments([created, ...comments]);
      setCommentInput("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("コメントを削除しますか？")) return;
    await deleteCommentApi(commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  if (!book) {
    return (
      <div className="container">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <button className="secondary" onClick={() => navigate(-1)}>
          戻る
        </button>
        <div className="nav-actions">
          <button className="secondary" onClick={() => navigate("/books")}>
            一覧へ
          </button>
        </div>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <div className="flex-between">
          <h2 style={{ margin: 0 }}>{book.title}</h2>
          <div className="footer-actions">
            {!editing && <button onClick={() => setEditing(true)}>編集</button>}
            {editing && (
              <>
                <button onClick={handleSaveBook}>保存</button>
                <button className="secondary" onClick={() => setEditing(false)}>
                  キャンセル
                </button>
              </>
            )}
            <button className="secondary" onClick={handleDeleteBook}>
              削除
            </button>
          </div>
        </div>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <div className="form-grid" style={{ marginTop: 12 }}>
          <div>
            {book.cover_image_url ? (
              <img className="cover-thumb" src={book.cover_image_url} alt={book.title} />
            ) : (
              <div className="cover-thumb placeholder-cover" style={{ height: "auto" }}>
                {book.title.slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <label className="label">タイトル</label>
            {editing ? (
              <input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            ) : (
              <p>{book.title}</p>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              タイトル予測（任意）
            </label>
            {editing ? (
              <input value={form.title_guess || ""} onChange={(e) => setForm({ ...form, title_guess: e.target.value })} />
            ) : (
              <p>{book.title_guess || "未設定"}</p>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              著者
            </label>
            {editing ? (
              <input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            ) : (
              <p>{book.author}</p>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              ステータス
            </label>
            {editing ? (
              <select
                value={form.status || "want_to_read"}
                onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
              >
                <option value="read">読んだ本</option>
                <option value="want_to_read">今後読みたい本</option>
              </select>
            ) : (
              <span className={`badge ${book.status === "want_to_read" ? "want" : ""}`}>
                {book.status === "read" ? "読んだ本" : "今後読みたい本"}
              </span>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              読み始め日
            </label>
            {editing ? (
              <input
                type="date"
                value={form.started_at || ""}
                onChange={(e) => setForm({ ...form, started_at: e.target.value })}
              />
            ) : (
              <p>{book.started_at || "未設定"}</p>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              読み終わり日
            </label>
            {editing ? (
              <input
                type="date"
                value={form.finished_at || ""}
                onChange={(e) => setForm({ ...form, finished_at: e.target.value })}
              />
            ) : (
              <p>{book.finished_at || "未設定"}</p>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              Amazon URL
            </label>
            {editing ? (
              <>
                <input
                  value={form.amazon_url || ""}
                  onChange={(e) => setForm({ ...form, amazon_url: e.target.value })}
                  placeholder="https://www.amazon.co.jp/..."
                />
                <button type="button" className="secondary" style={{ marginTop: 6 }} onClick={openAmazonSearch}>
                  Amazonで検索
                </button>
              </>
            ) : book.amazon_url ? (
              <a href={book.amazon_url} target="_blank" rel="noreferrer">
                Amazonで見る
              </a>
            ) : (
              <p>未設定</p>
            )}
            <label className="label" style={{ marginTop: 10 }}>
              表紙画像URL
            </label>
            {editing ? (
              <input
                value={form.cover_image_url || ""}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                placeholder="https://example.com/cover.jpg"
              />
            ) : (
              <p>{book.cover_image_url || "未設定"}</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="flex-between">
            <h3 style={{ margin: 0 }}>概要メモ (Markdown)</h3>
            {editing && <small>プレビューは下部に表示</small>}
          </div>
          {editing ? (
            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <textarea
                  rows={10}
                  value={form.note_markdown || ""}
                  onChange={(e) => setForm({ ...form, note_markdown: e.target.value })}
                />
              </div>
              <div className="markdown-box">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.note_markdown || "メモを書きましょう"}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="markdown-box">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {book.note_markdown || "メモはまだありません。編集で追加できます。"}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }} className="note-section single-column">
          <div className="note-header">
            <div>
              <h3 style={{ margin: 0 }}>ノート</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>Notionのページ一覧のように開閉できます。</p>
            </div>
            <button className="secondary" onClick={() => setShowNewNote((v) => !v)}>
              {showNewNote ? "追加を閉じる" : "ノートを追加"}
            </button>
          </div>

          {showNewNote && (
            <div className="section" style={{ marginTop: 10 }}>
              <h4 style={{ marginTop: 0 }}>新しいノート</h4>
              <div className="form-grid">
                <div>
                  <label className="label">タイトル</label>
                  <input
                    value={newNote.title || ""}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="ノートタイトル"
                  />
                </div>
                <div>
                  <label className="label">順序</label>
                  <input
                    type="number"
                    value={newNote.sort_order ?? 0}
                    onChange={(e) => setNewNote({ ...newNote, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="label">内容</label>
                <RichNoteEditor value={newNote.content || ""} onChange={(v) => setNewNote({ ...newNote, content: v })} />
              </div>
              <div className="footer-actions">
                <button onClick={handleCreateNote}>作成</button>
                <button className="secondary" onClick={() => setShowNewNote(false)}>キャンセル</button>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {notes.length === 0 && <p>ノートがまだありません。「ノートを追加」で作成してください。</p>}
            {notes.map((n) => (
              <div key={n.id} className="note-card">
                <div className="note-card-header">
                  <div>
                    <strong>{n.title}</strong>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>順序: {n.sort_order ?? 0}</div>
                  </div>
                  <div className="footer-actions">
                    <button className="secondary" onClick={() => selectNote(n)}>
                      {openNoteId === n.id ? "閉じる" : "開く"}
                    </button>
                    <button className="secondary" onClick={() => handleDeleteNote(n.id)}>削除</button>
                  </div>
                </div>
                {openNoteId === n.id && (
                  <div className="note-card-body">
                    <div className="form-grid" style={{ gridTemplateColumns: "1fr 150px" }}>
                      <div>
                        <label className="label">タイトル</label>
                        <input
                          value={noteForm.title || ""}
                          onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">順序</label>
                        <input
                          type="number"
                          value={noteForm.sort_order ?? 0}
                          onChange={(e) => setNoteForm({ ...noteForm, sort_order: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <RichNoteEditor value={noteForm.content || ""} onChange={(v) => setNoteForm({ ...noteForm, content: v })} />
                    </div>
                    <div className="footer-actions">
                      <button onClick={handleUpdateNote}>ノート保存</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="flex-between">
            <h3 style={{ margin: 0 }}>コメント</h3>
          </div>
          <div className="section" style={{ marginTop: 12 }}>
            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="コメントを書く"
            />
            <div className="footer-actions">
              <button type="button" onClick={handleCreateComment}>投稿</button>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {comments.length === 0 && <p>コメントはまだありません。</p>}
            {comments.map((c) => (
              <div key={c.id} className="section">
                <div className="flex-between">
                  <div>
                    <strong>@{c.user.username}</strong>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <button className="secondary" onClick={() => handleDeleteComment(c.id)}>削除</button>
                </div>
                <p style={{ marginTop: 8 }}>{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
