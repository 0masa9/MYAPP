import { Book } from "../types";

interface Props {
  book: Book;
  onClick?: () => void;
}

const BookCard: React.FC<Props> = ({ book, onClick }) => {
  const showPlaceholder = !book.cover_image_url;
  return (
    <div className="card" onClick={onClick} role="button" tabIndex={0}>
      {showPlaceholder ? (
        <div className="cover-thumb placeholder-cover">{book.title.slice(0, 1)}</div>
      ) : (
        <img className="cover-thumb" src={book.cover_image_url || ""} alt={book.title} />
      )}
      <div style={{ marginTop: 10 }}>
        <span className={`badge ${book.status === "want_to_read" ? "want" : ""}`}>
          {book.status === "read" ? "読んだ本" : "今後読みたい本"}
        </span>
        <h3 style={{ margin: "6px 0" }}>{book.title}</h3>
        <p style={{ margin: 0, color: "#4b5563" }}>{book.author || "作者不明"}</p>
      </div>
    </div>
  );
};

export default BookCard;
