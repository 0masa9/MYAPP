// team.js
// チーム詳細ページ用：スタジアムデータとチームメタデータ、順位サンプルを表示

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const teamId = Number(params.get("id"));

  const teamNameEl = document.getElementById("teamName");
  const leagueEl = document.getElementById("teamLeague");
  const stadiumEl = document.getElementById("stadiumName");
  const descriptionEl = document.getElementById("teamDescription");
  const officialLinkEl = document.getElementById("officialLink");
  const teamLogoEl = document.getElementById("teamLogo");
  const rankingEl = document.getElementById("teamRanking");

  if (!teamId) {
    teamNameEl.textContent = "クラブIDが指定されていません";
    descriptionEl.textContent = "URL に ?id=クラブID を付けてアクセスしてください。";
    rankingEl.textContent = "順位情報は未設定です";
    officialLinkEl.classList.add("disabled");
    officialLinkEl.setAttribute("aria-disabled", "true");
    return;
  }

  init(teamId);

  async function init(id) {
    try {
      const [stadiums, teams, rankings] = await Promise.all([
        fetchJson("stadiums.json"),
        fetchJson("teams.json"),
        // 順位情報は今は準備段階なので存在しなくても動くようにしておく
        fetchJson("rankings.sample.json", true)
      ]);

      const stadium = stadiums.find(item => Number(item.id) === id);
      if (!stadium) {
        teamNameEl.textContent = "該当するクラブが見つかりません";
        descriptionEl.textContent = "stadiums.json を確認してください。";
        rankingEl.textContent = "順位情報は未設定です";
        officialLinkEl.classList.add("disabled");
        officialLinkEl.setAttribute("aria-disabled", "true");
        return;
      }

      const meta = teams.find(item => Number(item.id) === id) || {};
      renderClubInfo(stadium, meta);
      renderRanking(rankings, stadium.league, id);
    } catch (err) {
      console.error(err);
      teamNameEl.textContent = "データの読み込みに失敗しました";
      descriptionEl.textContent = "ネットワーク状態や JSON ファイルを確認してください。";
      rankingEl.textContent = "順位情報は未設定です";
    }
  }

  /**
   * JSON を読み込むユーティリティ
   * @param {string} path ファイルパス
   * @param {boolean} [optional=false] true のとき、失敗しても undefined を返す
   */
  async function fetchJson(path, optional = false) {
    try {
      const res = await fetch(path);
      if (!res.ok) {
        throw new Error(`${path} の読み込みに失敗しました`);
      }
      return await res.json();
    } catch (error) {
      if (optional) {
        console.warn(error.message);
        return undefined;
      }
      throw error;
    }
  }

  // クラブ情報の描画
  function renderClubInfo(stadium, meta) {
    const leagueLabel = `${stadium.league} / ${stadium.stadiumName}`;
    teamNameEl.textContent = meta.club || stadium.club;
    leagueEl.textContent = leagueLabel;
    stadiumEl.textContent = stadium.stadiumName;
    descriptionEl.textContent =
      meta.description ||
      `${stadium.club} の紹介文をここに追記してください。`;

    // 公式サイトリンク
    if (meta.officialUrl) {
      officialLinkEl.href = meta.officialUrl;
      officialLinkEl.textContent = "公式サイトへ";
      officialLinkEl.classList.remove("disabled");
      officialLinkEl.removeAttribute("aria-disabled");
    } else {
      officialLinkEl.href = "#";
      officialLinkEl.textContent = "公式サイト情報は未設定です";
      officialLinkEl.classList.add("disabled");
      officialLinkEl.setAttribute("aria-disabled", "true");
    }

    // ロゴ
    teamLogoEl.src = meta.logo || "img/placeholder-logo.svg";
    teamLogoEl.alt = `${meta.club || stadium.club} のロゴ`;
  }

  // 順位情報の描画（rankings.sample.json を参照）
  function renderRanking(rankingsData, league, id) {
    if (!rankingsData || !rankingsData[league]) {
      rankingEl.textContent = "順位情報は未設定です";
      return;
    }

    const leagueRanks = rankingsData[league];
    const entry = leagueRanks.find(item => Number(item.clubId) === id);

    if (entry) {
      rankingEl.textContent = `${entry.rank}位 / 勝点 ${entry.points}`;
    } else {
      rankingEl.textContent = "順位情報は未設定です";
    }
  }
});
