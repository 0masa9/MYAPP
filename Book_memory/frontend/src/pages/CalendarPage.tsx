import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { fetchBooks } from "../api";
import { Book } from "../types";

const CalendarPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, []);

  const activityDates = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.started_at) set.add(b.started_at);
      if (b.finished_at) set.add(b.finished_at);
    });
    return set;
  }, [books]);

  const booksByDate = useMemo(() => {
    const map: Record<string, Book[]> = {};
    books.forEach((b) => {
      if (b.started_at) {
        map[b.started_at] = map[b.started_at] ? [...map[b.started_at], b] : [b];
      }
      if (b.finished_at) {
        map[b.finished_at] = map[b.finished_at] ? [...map[b.finished_at], b] : [b];
      }
    });
    return map;
  }, [books]);

  const dateKey = (d: Date) => d.toISOString().slice(0, 10);

  const selectedKey = dateKey(selectedDate);
  const selectedBooks = booksByDate[selectedKey] || [];

  return (
    <div className="container">
      <div className="header">
        <div>
          <h2 style={{ margin: 0 }}>カレンダー</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>読書開始/終了の日付が色付きで表示されます。</p>
        </div>
      </div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div className="calendar-wrap section" style={{ marginTop: 12 }}>
        <div className="calendar-panel">
          <div className="legend">
            <span className="legend-dot start" /> 読み始め
            <span className="legend-dot finish" /> 読み終わり
          </div>
          <Calendar
            onChange={(value) => setSelectedDate(value as Date)}
            value={selectedDate}
            tileContent={({ date }) => {
              const key = dateKey(date);
              const isStart = books.some((b) => b.started_at === key);
              const isFinish = books.some((b) => b.finished_at === key);
              return (
                <div className="tile-badges">
                  {isStart && <span className="dot start" />}
                  {isFinish && <span className="dot finish" />}
                </div>
              );
            }}
            tileClassName={({ date }) =>
              activityDates.has(dateKey(date)) ? "calendar-active-day" : undefined
            }
          />
        </div>

        <div className="calendar-summary">
          <div className="summary-card">
            <div className="summary-title">今月の開始</div>
            <div className="summary-value">
              {books.filter((b) => b.started_at?.startsWith(selectedKey.slice(0, 7))).length} 冊
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-title">今月の完了</div>
            <div className="summary-value">
              {books.filter((b) => b.finished_at?.startsWith(selectedKey.slice(0, 7))).length} 冊
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-title">総ブック数</div>
            <div className="summary-value">{books.length} 冊</div>
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>{selectedKey} の記録</h4>
        {selectedBooks.length === 0 && <p>この日に記録はありません。</p>}
        <div className="activity-list">
          {selectedBooks.map((b) => (
            <div key={`${b.id}-${selectedKey}`} className="activity-item">
              <div>
                <strong>{b.title}</strong>
                <div style={{ color: "#4b5563" }}>{b.author || "作者不明"}</div>
              </div>
              <span className={`badge ${b.status === "want_to_read" ? "want" : ""}`}>
                {b.status === "read" ? "読んだ本" : "今後読みたい本"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
