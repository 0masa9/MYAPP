from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from models import BookStatus


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BookBase(BaseModel):
    title: str
    author: Optional[str] = None
    status: BookStatus = BookStatus.WANT_TO_READ
    amazon_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    note_markdown: Optional[str] = ""
    started_at: Optional[date] = None
    finished_at: Optional[date] = None
    title_guess: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[BookStatus] = None
    amazon_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    note_markdown: Optional[str] = None
    started_at: Optional[date] = None
    finished_at: Optional[date] = None
    title_guess: Optional[str] = None


class ChapterBase(BaseModel):
    title: str
    order: Optional[int] = 0
    note_markdown: Optional[str] = ""


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None
    note_markdown: Optional[str] = None


class ChapterOut(ChapterBase):
    id: int
    book_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotePageBase(BaseModel):
    title: str
    sort_order: Optional[int] = 0
    content: Optional[str] = ""  # React Quill HTML文字列


class NotePageCreate(NotePageBase):
    pass


class NotePageUpdate(BaseModel):
    title: Optional[str] = None
    sort_order: Optional[int] = None
    content: Optional[str] = None


class NotePageOut(NotePageBase):
    id: int
    book_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class CommentOut(CommentBase):
    id: int
    book_id: int
    user: UserOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FollowOut(BaseModel):
    follower: UserOut
    following: UserOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    pass


class MessageOut(MessageBase):
    id: int
    sender: UserOut
    receiver: UserOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookOut(BookBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    chapters: Optional[List[ChapterOut]] = None
    notes: Optional[List[NotePageOut]] = None

    model_config = ConfigDict(from_attributes=True)


class StatsOverview(BaseModel):
    total_read: int
    total_want_to_read: int
    read_this_month: int
    finished_this_month: int


BookOut.update_forward_refs()
