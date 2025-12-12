// admin.js
// フロントのみで管理機能を擬似実装し、JSONプレビューを表示する

document.addEventListener("DOMContentLoaded", () => {
  const { fetchJson } = window.SoccerShared;
  window.SoccerAuth.requireLogin("index.html");

  const leagueForm = document.getElementById("leagueForm");
  const leagueClubSelect = document.getElementById("leagueClubSelect");
  const leagueSelect = document.getElementById("leagueSelect");

  const teamForm = document.getElementById("teamForm");
  const teamSelect = document.getElementById("teamSelect");
  const clubNameInput = document.getElementById("clubNameInput");
  const stadiumNameInput = document.getElementById("stadiumNameInput");
  const logoInput = document.getElementById("logoInput");
  const officialUrlInput = document.getElementById("officialUrlInput");
  const descriptionInput = document.getElementById("descriptionInput");

  const resultForm = document.getElementById("resultForm");
  const homeClubSelect = document.getElementById("homeClubSelect");
  const awayClubSelect = document.getElementById("awayClubSelect");
  const homeScoreInput = document.getElementById("homeScoreInput");
  const awayScoreInput = document.getElementById("awayScoreInput");

  const stadiumsPreview = document.getElementById("stadiumsPreview");
  const teamsPreview = document.getElementById("teamsPreview");
  const rankingsPreview = document.getElementById("rankingsPreview");

  const logoutButton = document.getElementById("logoutButton");
  const reloadDataButton = document.getElementById("reloadDataButton");
  const addTeamForm = document.getElementById("addTeamForm");
  const deleteTeamForm = document.getElementById("deleteTeamForm");
  const syncRankingsButton = document.getElementById("syncRankingsButton");

  // 追加用フィールド
  const newTeamId = document.getElementById("newTeamId");
  const newTeamLeague = document.getElementById("newTeamLeague");
  const newTeamName = document.getElementById("newTeamName");
  const newStadiumName = document.getElementById("newStadiumName");
  const newLat = document.getElementById("newLat");
  const newLng = document.getElementById("newLng");
  const newLogo = document.getElementById("newLogo");
  const newOfficial = document.getElementById("newOfficial");
  const newDescription = document.getElementById("newDescription");
  const deleteTeamId = document.getElementById("deleteTeamId");

  const state = {
    stadiums: [],
    teams: [],
    rankings: { J1: [], J2: [], J3: [] }
  };

  init();

  async function init(cacheBust = false) {
    try {
      const [stadiums, teams, rankings] = await Promise.all([
        fetchJson("stadiums.json", false, cacheBust),
        fetchJson("teams.json", false, cacheBust),
        fetchJson("rankings.json", false, cacheBust)
      ]);

      state.stadiums = stadiums;
      state.teams = teams;
      state.rankings = { J1: [], J2: [], J3: [], ...rankings };

      populateClubOptions();
      prefillTeamForm();
      updatePreviews();
    } catch (error) {
      console.error(error);
      alert("データの読み込みに失敗しました。リロードしてください。");
    }
  }

  // セレクトにクラブ一覧を反映
  function populateClubOptions() {
    const options = state.teams
      .slice()
      .sort((a, b) => a.club.localeCompare(b.club, "ja"))
      .map(team => `<option value="${team.id}">${team.club}</option>`)
      .join("");

    [leagueClubSelect, teamSelect, homeClubSelect, awayClubSelect].forEach(select => {
      if (select) {
        select.innerHTML = `<option value="">選択してください</option>${options}`;
      }
    });
  }

  function prefillTeamForm() {
    if (teamSelect && teamSelect.options.length > 1) {
      teamSelect.selectedIndex = 1;
      loadTeamForm(Number(teamSelect.value));
    }
  }

  // リーグ変更
  leagueForm?.addEventListener("submit", event => {
    event.preventDefault();
    const clubId = Number(leagueClubSelect.value);
    const nextLeague = leagueSelect.value;
    if (!clubId || !nextLeague) return;

    const stadium = state.stadiums.find(item => Number(item.id) === clubId);
    const team = state.teams.find(item => Number(item.id) === clubId);
    if (stadium) stadium.league = nextLeague;
    if (team) team.league = nextLeague;

    alert("リーグを更新しました。プレビューを stadiums.json / teams.json へコピペしてください。");
    updatePreviews();
  });

  // チーム情報フォーム
  teamSelect?.addEventListener("change", () => {
    loadTeamForm(Number(teamSelect.value));
  });

  teamForm?.addEventListener("submit", event => {
    event.preventDefault();
    const clubId = Number(teamSelect.value);
    if (!clubId) return;
    const team = state.teams.find(item => Number(item.id) === clubId);
    const stadium = state.stadiums.find(item => Number(item.id) === clubId);
    if (!team || !stadium) return;

    team.club = clubNameInput.value.trim();
    team.stadiumName = stadiumNameInput.value.trim();
    team.logo = logoInput.value.trim() || team.logo;
    team.officialUrl = officialUrlInput.value.trim() || team.officialUrl;
    team.description = descriptionInput.value.trim() || team.description;

    stadium.club = team.club;
    stadium.stadiumName = team.stadiumName;

    alert("チーム情報を更新しました。プレビューをコピペしてファイルを更新してください。");
    updatePreviews();
    populateClubOptions();
  });

  // 勝敗登録
  resultForm?.addEventListener("submit", event => {
    event.preventDefault();
    const homeId = Number(homeClubSelect.value);
    const awayId = Number(awayClubSelect.value);
    const homeScore = Number(homeScoreInput.value);
    const awayScore = Number(awayScoreInput.value);

    if (!homeId || !awayId || homeId === awayId) {
      alert("ホームとアウェイは別のクラブを選択してください");
      return;
    }

    applyMatchResult(homeId, awayId, homeScore, awayScore);
    alert("rankings.json を更新しました。プレビューをコピペして反映してください。");
    updatePreviews();
  });

  // ログアウト
  logoutButton?.addEventListener("click", () => {
    window.SoccerAuth.logout();
    window.location.href = "index.html";
  });

  // データ再読込（JSON 保存直後の反映用）
  reloadDataButton?.addEventListener("click", () => init(true));

  // チーム追加
  addTeamForm?.addEventListener("submit", event => {
    event.preventDefault();
    const id = Number(newTeamId.value);
    if (!id) {
      alert("IDを入力してください");
      return;
    }
    if (state.teams.some(t => Number(t.id) === id)) {
      alert("既存IDです。別のIDを指定してください。");
      return;
    }
    const league = newTeamLeague.value || "J3";
    const club = newTeamName.value.trim();
    const stadiumName = newStadiumName.value.trim();
    const lat = Number(newLat.value);
    const lng = Number(newLng.value);
    const logo = newLogo.value.trim() || `img/club-${id}.png`;
    const officialUrl = newOfficial.value.trim() || "";
    const description = newDescription.value.trim() || `${club}の紹介文を追記してください。`;

    const base = { id, league, club, stadiumName, lat, lng };
    state.stadiums.push(base);
    state.teams.push({
      ...base,
      officialUrl,
      logo,
      description
    });

    // ランキングにも空のエントリを用意
    const rankEntry = getOrCreateRanking(league, id);
    Object.assign(rankEntry, {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0
    });

    alert("チームを追加しました。プレビューをコピペしてファイルを更新してください。");
    populateClubOptions();
    updatePreviews();
  });

  // チーム削除
  deleteTeamForm?.addEventListener("submit", event => {
    event.preventDefault();
    const id = Number(deleteTeamId.value);
    if (!id) return;
    const beforeLen = state.teams.length;
    state.teams = state.teams.filter(t => Number(t.id) !== id);
    state.stadiums = state.stadiums.filter(s => Number(s.id) !== id);
    ["J1", "J2", "J3"].forEach(league => {
      state.rankings[league] = (state.rankings[league] || []).filter(r => Number(r.clubId) !== id);
    });
    if (state.teams.length === beforeLen) {
      alert("該当するIDが見つかりませんでした。");
      return;
    }
    alert("チームを削除しました。プレビューをコピペしてファイルを更新してください。");
    populateClubOptions();
    updatePreviews();
  });

  // ランキングへ全クラブを反映（不足は0で埋める、最大20クラブ想定）
  syncRankingsButton?.addEventListener("click", () => {
    ["J1", "J2", "J3"].forEach(league => {
      const clubs = state.stadiums.filter(s => s.league === league).slice(0, 20);
      clubs.forEach(club => {
        getOrCreateRanking(league, Number(club.id));
      });
    });
    alert("不足していたクラブを順位表に追加しました。プレビューをコピペしてファイルを更新してください。");
    updatePreviews();
  });

  function loadTeamForm(clubId) {
    const team = state.teams.find(item => Number(item.id) === clubId);
    if (!team) return;
    clubNameInput.value = team.club || "";
    stadiumNameInput.value = team.stadiumName || "";
    logoInput.value = team.logo || "";
    officialUrlInput.value = team.officialUrl || "";
    descriptionInput.value = team.description || "";
  }

  // 試合結果を rankings オブジェクトへ反映
  function applyMatchResult(homeId, awayId, homeScore, awayScore) {
    const homeLeague = findLeagueById(homeId);
    const awayLeague = findLeagueById(awayId);

    const homeEntry = getOrCreateRanking(homeLeague, homeId);
    const awayEntry = getOrCreateRanking(awayLeague, awayId);

    // 試合数
    homeEntry.played = (homeEntry.played ?? 0) + 1;
    awayEntry.played = (awayEntry.played ?? 0) + 1;

    // 得点・失点・得失点
    homeEntry.goalsFor = (homeEntry.goalsFor ?? 0) + homeScore;
    homeEntry.goalsAgainst = (homeEntry.goalsAgainst ?? 0) + awayScore;
    awayEntry.goalsFor = (awayEntry.goalsFor ?? 0) + awayScore;
    awayEntry.goalsAgainst = (awayEntry.goalsAgainst ?? 0) + homeScore;

    homeEntry.goalDiff = (homeEntry.goalsFor ?? 0) - (homeEntry.goalsAgainst ?? 0);
    awayEntry.goalDiff = (awayEntry.goalsFor ?? 0) - (awayEntry.goalsAgainst ?? 0);

    // 勝敗
    if (homeScore > awayScore) {
      homeEntry.wins = (homeEntry.wins ?? 0) + 1;
      awayEntry.losses = (awayEntry.losses ?? 0) + 1;
    } else if (homeScore < awayScore) {
      awayEntry.wins = (awayEntry.wins ?? 0) + 1;
      homeEntry.losses = (homeEntry.losses ?? 0) + 1;
    } else {
      homeEntry.draws = (homeEntry.draws ?? 0) + 1;
      awayEntry.draws = (awayEntry.draws ?? 0) + 1;
    }

    // 勝点 (勝3/分1)
    homeEntry.points = (homeEntry.wins ?? 0) * 3 + (homeEntry.draws ?? 0);
    awayEntry.points = (awayEntry.wins ?? 0) * 3 + (awayEntry.draws ?? 0);
  }

  function getOrCreateRanking(league, clubId) {
    if (!state.rankings[league]) state.rankings[league] = [];
    let entry = state.rankings[league].find(item => Number(item.clubId) === clubId);
    if (!entry) {
      entry = {
        clubId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
      };
      state.rankings[league].push(entry);
    }
    return entry;
  }

  function findLeagueById(clubId) {
    const club = state.stadiums.find(item => Number(item.id) === clubId);
    return club?.league || "J1";
  }

  // プレビュー描画
  function updatePreviews() {
    stadiumsPreview.textContent = JSON.stringify(state.stadiums, null, 2);
    teamsPreview.textContent = JSON.stringify(state.teams, null, 2);
    rankingsPreview.textContent = JSON.stringify(state.rankings, null, 2);
  }
});
