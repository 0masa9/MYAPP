// rankings.js
// 公開用の順位表。rankings.json と stadiums.json を利用し、J1/J2/J3 のテーブルを描画。

document.addEventListener("DOMContentLoaded", () => {
  const { fetchJson, leagueSettings, getLeagueStyle } = window.SoccerShared;
  const container = document.getElementById("rankingsContainer");
  const adminButton = document.getElementById("adminButton");
  const refreshButton = document.getElementById("refreshButton");
  const loginModalEl = document.getElementById("loginModal");
  const loginForm = document.getElementById("loginForm");
  const loginModal = loginModalEl ? new bootstrap.Modal(loginModalEl) : null;

  // 管理者ログイン
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

  init();

  // データ再読込（JSON 保存直後の反映用）
  refreshButton?.addEventListener("click", () => init(true));

  async function init(cacheBust = false) {
    try {
      const [stadiums, rankings] = await Promise.all([
        fetchJson("stadiums.json", false, cacheBust),
        fetchJson("rankings.json", false, cacheBust)
      ]);
      const stadiumMap = new Map(stadiums.map(item => [Number(item.id), item]));

      renderLeagueTable("J1", rankings.J1 || [], stadiumMap);
      renderLeagueTable("J2", rankings.J2 || [], stadiumMap);
      renderLeagueTable("J3", rankings.J3 || [], stadiumMap);
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="alert alert-danger">順位表の読み込みに失敗しました</div>`;
    }
  }

  // リーグ単位でテーブルを生成
  function renderLeagueTable(league, entries, stadiumMap) {
    const style = getLeagueStyle(league);
    const leagueDiv = document.createElement("div");
    leagueDiv.className = "col-12";

    const sorted = [...entries].sort((a, b) => {
      const pa = getPoints(a);
      const pb = getPoints(b);
      if (pb !== pa) return pb - pa;
      const gda = getGoalDiff(a);
      const gdb = getGoalDiff(b);
      if (gdb !== gda) return gdb - gda;
      return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
    });

    const tableRows =
      sorted.length > 0
        ? sorted
            .map((entry, index) => {
              const club = stadiumMap.get(Number(entry.clubId));
              const clubName = club ? club.club : `クラブID ${entry.clubId}`;
              const gd = getGoalDiff(entry);
              const points = getPoints(entry);
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${clubName}</td>
                  <td>${entry.played ?? 0}</td>
                  <td>${entry.wins ?? 0}</td>
                  <td>${entry.draws ?? 0}</td>
                  <td>${entry.losses ?? 0}</td>
                  <td>${entry.goalsFor ?? 0}</td>
                  <td>${entry.goalsAgainst ?? 0}</td>
                  <td>${gd}</td>
                  <td class="fw-bold">${points}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="10" class="text-center text-muted">データがありません</td></tr>`;

    leagueDiv.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-header d-flex align-items-center justify-content-between" style="border-left: 6px solid ${style.color}">
          <div class="d-flex align-items-center gap-2">
            <span class="badge" style="background:${style.color}">${league}</span>
            <span class="fw-semibold">${league} 順位表</span>
          </div>
          <span class="text-muted small">勝点→得失点差→得点の順で並び替え</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-striped table-hover mb-0 table-rankings">
              <thead class="table-light">
                <tr>
                  <th scope="col">順位</th>
                  <th scope="col">クラブ名</th>
                  <th scope="col">試合</th>
                  <th scope="col">勝</th>
                  <th scope="col">分</th>
                  <th scope="col">敗</th>
                  <th scope="col">得点</th>
                  <th scope="col">失点</th>
                  <th scope="col">得失点</th>
                  <th scope="col">勝点</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.appendChild(leagueDiv);
  }

  function getPoints(entry) {
    if (typeof entry.points === "number") return entry.points;
    return (entry.wins ?? 0) * 3 + (entry.draws ?? 0);
  }

  function getGoalDiff(entry) {
    if (typeof entry.goalDiff === "number") return entry.goalDiff;
    return (entry.goalsFor ?? 0) - (entry.goalsAgainst ?? 0);
  }
});
