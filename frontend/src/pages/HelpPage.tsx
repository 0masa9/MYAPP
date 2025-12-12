const HelpPage = () => {
  return (
    <div className="container">
      <div className="header">
        <h2 style={{ margin: 0 }}>使い方ガイド</h2>
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h3>基本操作</h3>
        <ul>
          <li>サインアップ/ログインすると自分専用の本棚が作成されます。</li>
          <li>「本棚」から本を追加し、ステータス（読んだ/今後読みたい）や表紙URLを設定できます。</li>
          <li>詳細ページでは「概要メモ（Markdown）」と「ノート（リッチエディタ）」でメモを残せます。</li>
        </ul>
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h3>ノートと章メモ</h3>
        <ul>
          <li>左側リストからノートを選択し、リッチエディタで装飾付きのメモを編集できます。</li>
          <li>「新規」ボタンでノートページを追加し、タイトルや並び順を編集できます。</li>
          <li>章メモは必要に応じて「章メモを表示/非表示」で折りたたみできます。</li>
        </ul>
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h3>カレンダーと分析</h3>
        <ul>
          <li>カレンダー: 読み始め日/読み終わり日がある日を色付きバッジで表示します。日付クリックでその日の本一覧を表示。</li>
          <li>分析: 読了数・積読数・今月の開始/完了数がカード表示されます。</li>
        </ul>
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h3>ソーシャル</h3>
        <ul>
          <li>コメント: 本の詳細ページの「コメント」から投稿/削除が可能です。</li>
          <li>フォロー: プロフィールページでユーザーIDを指定してフォロー/解除、一覧表示ができます。</li>
          <li>チャット: チャットページでユーザーIDを指定してメッセージを送受信できます（簡易・非リアルタイム）。</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpPage;
