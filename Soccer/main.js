// main.js
document.addEventListener("DOMContentLoaded", () => {
  // 地図初期化（日本の真ん中あたり）
  const map = L.map("map").setView([36.2048, 138.2529], 5);

  // OSM タイルレイヤー
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // マーカーを保持する配列
  const markers = [];

  // チェックボックス
  const filterJ1 = document.getElementById("filterJ1");
  const filterJ2 = document.getElementById("filterJ2");
  const filterJ3 = document.getElementById("filterJ3");

  // フィルタ関数
  function updateMarkers() {
    const showJ1 = filterJ1.checked;
    const showJ2 = filterJ2.checked;
    const showJ3 = filterJ3.checked;

    markers.forEach(entry => {
      const league = entry.league;
      const marker = entry.marker;

      let visible = false;
      if (league === "J1" && showJ1) visible = true;
      if (league === "J2" && showJ2) visible = true;
      if (league === "J3" && showJ3) visible = true;

      if (visible) {
        // まだ地図に無ければ追加
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      } else {
        // 表示しないときは削除
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    });
  }

  // JSON からスタジアムデータ取得
  fetch("stadiums.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("stadiums.json の読み込みに失敗しました");
      }
      return response.json();
    })
    .then(data => {
      data.forEach(stadium => {
        const { league, club, stadiumName, lat, lng } = stadium;

        const marker = L.marker([lat, lng], { title: club });

        marker.bindPopup(`
          <div>
            <strong>${club}</strong><br>
            ${stadiumName}<br>
            <span class="badge bg-secondary">${league}</span>
          </div>
        `);

        markers.push({
          league,
          marker
        });
      });

      // 初回フィルタ
      updateMarkers();
    })
    .catch(error => {
      console.error(error);
    });

  // フィルタイベント
  [filterJ1, filterJ2, filterJ3].forEach(input => {
    input.addEventListener("change", updateMarkers);
  });
});

