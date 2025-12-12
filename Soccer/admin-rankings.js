// admin-rankings.js
// 将来の管理画面で順位表を編集するための読み込み処理の雛形

async function loadRankings() {
  try {
    const res = await fetch("rankings.sample.json");
    if (!res.ok) {
      throw new Error("rankings.sample.json の読み込みに失敗しました");
    }
    const data = await res.json();
    console.log("rankings.sample.json 読み込み結果:", data);

    // TODO: 将来 admin.html などでフォームと連動し、
    // data を元に順位表の編集・保存を行う機能を追加予定。
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// デモ目的で即時呼び出し
loadRankings();
