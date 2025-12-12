// team.js
// チーム詳細ページ用：スタジアムデータとチームメタデータ、順位表示（雛形）

document.addEventListener("DOMContentLoaded", () => {
  const { fetchJson, getLeagueStyle } = window.SoccerShared;

  const params = new URLSearchParams(window.location.search);
  const teamId = Number(params.get("id"));

  const teamNameEl = document.getElementById("teamName");
  const leagueEl = document.getElementById("teamLeague");
  const stadiumEl = document.getElementById("stadiumName");
  const descriptionEl = document.getElementById("teamDescription");
  const officialLinkEl = document.getElementById("officialLink");
  const teamLogoEl = document.getElementById("teamLogo");
  const rankingEl = document.getElementById("teamRanking");
  const stadiumCoordsEl = document.getElementById("stadiumCoords");
  const adminButton = document.getElementById("adminButton");
  const loginModalEl = document.getElementById("loginModal");
  const loginForm = document.getElementById("loginForm");
  const loginModal = loginModalEl ? new bootstrap.Modal(loginModalEl) : null;

  if (!teamId) {
    teamNameEl.textContent = "クラブIDが指定されていません";
    descriptionEl.textContent = "URL に ?id=クラブID を付けてアクセスしてください。";
    rankingEl.textContent = "順位情報は未設定です";
    officialLinkEl.classList.add("disabled");
    officialLinkEl.setAttribute("aria-disabled", "true");
    return;
  }

  // 管理者ログインボタン
  if (adminButton) {
    function handleLoginSuccess() {
      loginModal?.hide();
      window.location.href = "admin.html";
    }
    window.SoccerAuth?.wireLoginForm(loginForm, handleLoginSuccess);
    adminButton.addEventListener("click", event => {
      if (window.SoccerAuth?.isLoggedIn()) {
        window.location.href = "admin.html";
      } else {
        event.preventDefault();
        loginModal?.show();
      }
    });
  }

  init(teamId);

  async function init(id) {
    try {
      const [stadiums, teams, rankings, history] = await Promise.all([
        fetchJson("stadiums.json"),
        fetchJson("teams.json"),
        // 順位情報は無くても動くよう optional に
        fetchJson("rankings.json", true),
        // 過去所属リーグ・順位の履歴（任意）
        fetchJson("history.json", true)
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
      renderHistory(history, id);
      renderStadiumMap(stadium);
    } catch (err) {
      console.error(err);
      teamNameEl.textContent = "データの読み込みに失敗しました";
      descriptionEl.textContent = "ネットワーク状態や JSON ファイルを確認してください。";
      rankingEl.textContent = "順位情報は未設定です";
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

    // ロゴ（読み込み失敗時はプレースホルダーへフォールバック）
    teamLogoEl.src = meta.logo || "img/placeholder-logo.svg";
    teamLogoEl.alt = `${meta.club || stadium.club} のロゴ`;
    teamLogoEl.onerror = () => {
      teamLogoEl.onerror = null;
      teamLogoEl.src = "img/placeholder-logo.svg";
    };
  }

  // 順位情報の描画（rankings.json を参照）
  function renderRanking(rankingsData, league, id) {
    if (!rankingsData || !rankingsData[league]) {
      rankingEl.textContent = "順位情報は未設定です";
      return;
    }

    const leagueRanks = rankingsData[league];
    const sorted = [...leagueRanks].sort((a, b) => {
      const pa = a.points ?? a.wins * 3 + a.draws;
      const pb = b.points ?? b.wins * 3 + b.draws;
      if (pb !== pa) return pb - pa;
      const gda = a.goalDiff ?? a.goalsFor - a.goalsAgainst;
      const gdb = b.goalDiff ?? b.goalsFor - b.goalsAgainst;
      if (gdb !== gda) return gdb - gda;
      return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
    });

    const entry = sorted.find(item => Number(item.clubId) === id);
    if (entry) {
      const rank = sorted.indexOf(entry) + 1;
      const points = entry.points ?? entry.wins * 3 + entry.draws;
      rankingEl.textContent = `${rank}位 / 勝点 ${points}`;
    } else {
      rankingEl.textContent = "順位情報は未設定です";
    }
  }

  // 過去の所属リーグ / 順位の描画
  function renderHistory(historyData, id) {
    const tbody = document.getElementById("historyBody");
    if (!tbody) return;
    if (!historyData || !Array.isArray(historyData)) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-muted text-center">履歴が設定されていません</td></tr>`;
      return;
    }
    const entry = historyData.find(item => Number(item.clubId) === id);
    if (!entry || !Array.isArray(entry.seasons) || entry.seasons.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-muted text-center">履歴が設定されていません</td></tr>`;
      return;
    }

    const sorted = [...entry.seasons].sort((a, b) => (b.year || 0) - (a.year || 0));
    const rows = sorted
      .slice(0, 20) // 念のため上限
      .map(season => {
        const year = season.year ?? "-";
        const league = season.league ?? "-";
        const rank = season.rank ?? "-";
        return `<tr><td>${year}</td><td>${league}</td><td>${rank}位</td></tr>`;
      })
      .join("");
    tbody.innerHTML = rows;
  }

  // スタジアム位置を簡易表示（Leaflet）
  function renderStadiumMap(stadium) {
    if (!stadium || !window.L) return;
    const { lat, lng, league, stadiumName } = stadium;
    stadiumCoordsEl.textContent = `緯度 ${lat.toFixed(5)} / 経度 ${lng.toFixed(5)}`;

    const style = getLeagueStyle(league);
    const map = L.map("stadiumMap").setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 10,
      color: style.color,
      fillColor: style.fillColor,
      fillOpacity: 0.9,
      weight: 2
    })
      .addTo(map)
      .bindPopup(stadiumName)
      .openPopup();
  }
});
