from datetime import datetime, date
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, extract, or_
from sqlalchemy.orm import Session

import models
import schemas
from auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Book Memory API")

# Adjust origins as needed in production
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/logout")
def logout():
    # Stateless JWT: client forgets token to logout.
    return {"message": "Logged out"}


@app.get("/api/books", response_model=List[schemas.BookOut])
def list_books(
    status_filter: Optional[models.BookStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Book).filter(models.Book.user_id == current_user.id)
    if status_filter:
        query = query.filter(models.Book.status == status_filter)
    books = query.order_by(models.Book.created_at.desc()).all()
    return books


@app.post("/api/books", response_model=schemas.BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    book: schemas.BookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # TODO: integrate Amazon Product Advertising API to auto-populate URLs and cover images.
    new_book = models.Book(
        **book.dict(),
        user_id=current_user.id,
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book


@app.get("/api/books/{book_id}", response_model=schemas.BookOut)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = (
        db.query(models.Book)
        .filter(models.Book.id == book_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


@app.put("/api/books/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id: int,
    book_update: schemas.BookUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = (
        db.query(models.Book)
        .filter(models.Book.id == book_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    update_data = book_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)
    book.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(book)
    return book


@app.delete("/api/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = (
        db.query(models.Book)
        .filter(models.Book.id == book_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    db.delete(book)
    db.commit()
    return None


# --- Chapter APIs ---
@app.get("/api/books/{book_id}/chapters", response_model=List[schemas.ChapterOut])
def list_chapters(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = (
        db.query(models.Book)
        .filter(models.Book.id == book_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book.chapters


@app.post("/api/books/{book_id}/chapters", response_model=schemas.ChapterOut, status_code=status.HTTP_201_CREATED)
def create_chapter(
    book_id: int,
    chapter: schemas.ChapterCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = (
        db.query(models.Book)
        .filter(models.Book.id == book_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    new_chapter = models.Chapter(
        **chapter.dict(),
        book_id=book.id,
    )
    db.add(new_chapter)
    db.commit()
    db.refresh(new_chapter)
    return new_chapter


@app.put("/api/chapters/{chapter_id}", response_model=schemas.ChapterOut)
def update_chapter(
    chapter_id: int,
    chapter_update: schemas.ChapterUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    chapter = (
        db.query(models.Chapter)
        .join(models.Book)
        .filter(models.Chapter.id == chapter_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    for field, value in chapter_update.dict(exclude_unset=True).items():
        setattr(chapter, field, value)
    chapter.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(chapter)
    return chapter


@app.delete("/api/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    chapter = (
        db.query(models.Chapter)
        .join(models.Book)
        .filter(models.Chapter.id == chapter_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    db.delete(chapter)
    db.commit()
    return None


# --- Note Pages (rich editor JSON) ---
@app.get("/api/books/{book_id}/notes", response_model=List[schemas.NotePageOut])
def list_notes(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = db.query(models.Book).filter(models.Book.id == book_id, models.Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book.notes


@app.post("/api/books/{book_id}/notes", response_model=schemas.NotePageOut, status_code=status.HTTP_201_CREATED)
def create_note(
    book_id: int,
    note: schemas.NotePageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = db.query(models.Book).filter(models.Book.id == book_id, models.Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    new_note = models.NotePage(**note.dict(), book_id=book.id)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@app.put("/api/notes/{note_id}", response_model=schemas.NotePageOut)
def update_note(
    note_id: int,
    note_update: schemas.NotePageUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = (
        db.query(models.NotePage)
        .join(models.Book)
        .filter(models.NotePage.id == note_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    for field, value in note_update.dict(exclude_unset=True).items():
        setattr(note, field, value)
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note


@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = (
        db.query(models.NotePage)
        .join(models.Book)
        .filter(models.NotePage.id == note_id, models.Book.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    db.delete(note)
    db.commit()
    return None


# --- Comments ---
@app.get("/api/books/{book_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    # Only owner can see own book; others cannot access
    if book.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return (
        db.query(models.Comment)
        .filter(models.Comment.book_id == book_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )


@app.post("/api/books/{book_id}/comments", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    book_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    new_comment = models.Comment(book_id=book_id, user_id=current_user.id, content=comment.content)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@app.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db.delete(comment)
    db.commit()
    return None


# --- Follow ---
@app.post("/api/users/{user_id}/follow")
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")
    existing = (
        db.query(models.Follow)
        .filter(models.Follow.follower_id == current_user.id, models.Follow.following_id == user_id)
        .first()
    )
    if existing:
        return {"message": "Already following"}
    follow = models.Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()
    return {"message": "followed"}


@app.post("/api/users/{user_id}/unfollow")
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    follow = (
        db.query(models.Follow)
        .filter(models.Follow.follower_id == current_user.id, models.Follow.following_id == user_id)
        .first()
    )
    if not follow:
        return {"message": "not following"}
    db.delete(follow)
    db.commit()
    return {"message": "unfollowed"}


@app.get("/api/users/me/following", response_model=List[schemas.FollowOut])
def get_following(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    follows = (
        db.query(models.Follow)
        .filter(models.Follow.follower_id == current_user.id)
        .all()
    )
    return follows


@app.get("/api/users/me/followers", response_model=List[schemas.FollowOut])
def get_followers(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    follows = (
        db.query(models.Follow)
        .filter(models.Follow.following_id == current_user.id)
        .all()
    )
    return follows


# --- Messages ---
@app.get("/api/messages/{other_user_id}", response_model=List[schemas.MessageOut])
def get_messages(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    messages = (
        db.query(models.Message)
        .filter(
            or_(
                and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == other_user_id),
                and_(models.Message.sender_id == other_user_id, models.Message.receiver_id == current_user.id),
            )
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@app.post("/api/messages/{other_user_id}", response_model=schemas.MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    other_user_id: int,
    msg: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if other_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send to yourself")
    message = models.Message(sender_id=current_user.id, receiver_id=other_user_id, content=msg.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


# --- Stats ---
@app.get("/api/stats/overview", response_model=schemas.StatsOverview)
def stats_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    total_read = db.query(models.Book).filter(models.Book.user_id == current_user.id, models.Book.status == models.BookStatus.READ).count()
    total_want = db.query(models.Book).filter(models.Book.user_id == current_user.id, models.Book.status == models.BookStatus.WANT_TO_READ).count()

    today = date.today()
    read_this_month = (
        db.query(models.Book)
        .filter(
            models.Book.user_id == current_user.id,
            extract('year', models.Book.started_at) == today.year,
            extract('month', models.Book.started_at) == today.month,
        )
        .count()
    )
    finished_this_month = (
        db.query(models.Book)
        .filter(
            models.Book.user_id == current_user.id,
            extract('year', models.Book.finished_at) == today.year,
            extract('month', models.Book.finished_at) == today.month,
        )
        .count()
    )
    return schemas.StatsOverview(
        total_read=total_read,
        total_want_to_read=total_want,
        read_this_month=read_this_month,
        finished_this_month=finished_this_month,
    )
