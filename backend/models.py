import enum
from datetime import datetime, date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    ForeignKey,
    Date,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, backref

from database import Base


class BookStatus(str, enum.Enum):
    READ = "read"
    WANT_TO_READ = "want_to_read"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    books = relationship("Book", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys='Message.sender_id')
    received_messages = relationship("Message", back_populates="receiver", foreign_keys='Message.receiver_id')
    following = relationship(
        "Follow",
        foreign_keys='Follow.follower_id',
        cascade="all, delete-orphan",
        back_populates="follower",
    )
    followers = relationship(
        "Follow",
        foreign_keys='Follow.following_id',
        cascade="all, delete-orphan",
        back_populates="following",
    )


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    author = Column(String(200))
    status = Column(Enum(BookStatus), default=BookStatus.WANT_TO_READ, nullable=False)
    amazon_url = Column(String(500))
    cover_image_url = Column(String(500))
    note_markdown = Column(Text, default="")
    started_at = Column(Date)
    finished_at = Column(Date)
    title_guess = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="books")
    chapters = relationship(
        "Chapter",
        backref=backref("book"),
        cascade="all, delete-orphan",
        order_by="Chapter.order",
    )
    notes = relationship(
        "NotePage",
        backref=backref("book"),
        cascade="all, delete-orphan",
        order_by="NotePage.sort_order",
    )
    comments = relationship("Comment", back_populates="book", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    order = Column(Integer, default=0)
    note_markdown = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NotePage(Base):
    __tablename__ = "note_pages"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    sort_order = Column(Integer, default=0)
    content = Column(Text, default="")  # rich text (React Quill HTML)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint('follower_id', 'following_id', name='uq_follow'),)

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
