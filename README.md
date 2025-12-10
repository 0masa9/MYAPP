# Book Memory

個人用の本棚アプリです。FastAPI + SQLite のシンプルな REST API と、React + TypeScript + Vite のフロントエンドで構成されています。認証はクライアント保持の JWT（Authorization ヘッダー）方式です。章ごとのメモ、リッチノート（複数ページ）、読書開始/終了日、カレンダー、分析、簡易ソーシャル（コメント・フォロー・簡易チャット）に対応しました。

## 技術スタック
- Backend: Python, FastAPI, SQLAlchemy, SQLite, JWT (python-jose), passlib (bcrypt)
- Frontend: React + TypeScript, Vite, React Router, react-markdown + remark-gfm, react-calendar, react-quill (リッチエディタ)

## フォルダ構成（`Book_memory/` 配下）
- `backend/` : FastAPI アプリ（`main.py`, `models.py`, `schemas.py`, `auth.py`, `database.py`, `requirements.txt`）
- `frontend/` : Vite React アプリ（`src/` 以下にページ・コンポーネント、`package.json`, `vite.config.ts` など）

## セットアップ手順
### Backend
```bash
cd Book_memory/backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd Book_memory/frontend
npm install
npm run dev -- --host --port 5173
```

※ 新しく追加した npm 依存: `react-calendar`, `react-quill`, `@types/react-calendar`

## 開発時の使い方
1. バックエンドを起動（`uvicorn main:app --reload --host 0.0.0.0 --port 8000`）。
2. フロントエンドを起動（`npm run dev -- --host --port 5173`）。表示された URL をブラウザで開く。
3. サインアップ後にログイン。JWT はローカルストレージに保存され、以降の API 呼び出しで `Authorization: Bearer <token>` として送信されます。

## 主な機能
- 本棚: 読んだ本/読みたい本の管理、Amazon 検索リンク、読書開始日/終了日、表紙URL、概要メモ（Markdown）。
- 章メモ: 章単位で Markdown メモを追加・編集・削除。
- リッチノート: 本ごとに複数ページのノートを持てます。エディタは React Quill（HTML形式で保存）。
- カレンダー: 読書開始/終了日に応じて日付をハイライト。
- 分析: 読了数・積読数・今月の開始/完了数を表示。
- コメント: 本のコメント投稿/削除。
- フォロー: ユーザーID指定でフォロー/解除、フォロー/フォロワー一覧。
- チャット: ユーザーIDを指定して非リアルタイムのメッセージ送受信。

## データベースとテーブル追加
- 追加テーブル: `comments`, `follows`, `messages`, `note_pages`（リッチノート用）。
- `books` に新カラム: `started_at`, `finished_at`, `title_guess`。
- SQLite 開発時は既存 `data.db` を削除して再起動すると新スキーマで再作成されます（削除する場合は `Book_memory/backend/data.db` を消してください）。既存データを残す場合は手動で `ALTER TABLE` してください。

## Amazon 連携について
現状は「Amazonで検索」ボタンで `https://www.amazon.co.jp/s?k=<タイトル>` を新規タブで開くのみです。将来的な Amazon Product Advertising API 連携のための TODO コメントを `backend/main.py` に残しています。
