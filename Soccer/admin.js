// admin.js

document.addEventListener("DOMContentLoaded", () => {
  let stadiums = [];
  let editIndex = null; // いま編集中の行インデックス（新規のときは null）

  const form = document.getElementById("stadiumForm");
  const idInput = document.getElementById("idInput");
  const leagueInput = document.getElementById("leagueInput");
  const clubInput = document.getElementById("clubInput");
  const stadiumNameInput = document.getElementById("stadiumNameInput");
  const latInput = document.getElementById("latInput");
  const lngInput = document.getElementById("lngInput");

  const tableBody = document.getElementById("stadiumTableBody");
  const jsonOutput = document.getElementById("jsonOutput");

  const loadJsonBtn = document.getElementById("loadJsonBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");

  // 「追加 / 更新」ボタン（フォーム内の最後のボタン）
  const submitButton = form.querySelector("button[type='submit']");

  // IDを自動採番（現在の最大ID + 1）
  function getNextId() {
    if (stadiums.length === 0) return 1;
    const maxId = stadiums.reduce(
      (max, s) => Math.max(max, Number(s.id) || 0),
      0
    );
    return maxId + 1;
  }

  // テーブル描画
  function renderTable() {
    tableBody.innerHTML = "";

    stadiums.forEach((s, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${s.league}</td>
        <td>${s.club}</td>
        <td>${s.stadiumName}</td>
        <td>${s.lat}</td>
        <td>${s.lng}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-secondary" data-edit="${index}">
              編集
            </button>
            <button class="btn btn-outline-danger" data-delete="${index}">
              削除
            </button>
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });
  }

  // JSON出力更新
  function updateJsonOutput() {
    jsonOutput.value = JSON.stringify(stadiums, null, 2);
  }

  // フォームをリセット（編集モード解除）
  function resetForm() {
    form.reset();
    idInput.value = "";
    editIndex = null;
    submitButton.textContent = "リストに追加";
    submitButton.classList.remove("btn-success");
    submitButton.classList.add("btn-primary");
  }

  // スタジアム追加 or 更新
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const league = leagueInput.value;
    const club = clubInput.value.trim();
    const stadiumName = stadiumNameInput.value.trim();
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    if (!league || !club || !stadiumName || Number.isNaN(lat) || Number.isNaN(lng)) {
      alert("必須項目が未入力です。");
      return;
    }

    let id = parseInt(idInput.value, 10);
    if (Number.isNaN(id)) {
      // 新規 or ID未入力のときだけ自動採番
      if (editIndex === null) {
        id = getNextId();
      } else {
        id = stadiums[editIndex].id; // 更新時は既存IDを維持
      }
    }

    const newData = {
      id,
      league,
      club,
      stadiumName,
      lat,
      lng
    };

    if (editIndex === null) {
      // 新規追加
      stadiums.push(newData);
    } else {
      // 更新
      stadiums[editIndex] = newData;
    }

    renderTable();
    updateJsonOutput();
    resetForm();
  });

  // 行の編集・削除（イベント委譲）
  tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("button[data-edit]");
    const deleteBtn = e.target.closest("button[data-delete]");

    // 編集
    if (editBtn) {
      const index = parseInt(editBtn.dataset.edit, 10);
      if (Number.isNaN(index)) return;

      const s = stadiums[index];
      editIndex = index;

      idInput.value = s.id;
      leagueInput.value = s.league;
      clubInput.value = s.club;
      stadiumNameInput.value = s.stadiumName;
      latInput.value = s.lat;
      lngInput.value = s.lng;

      submitButton.textContent = "この行を更新";
      submitButton.classList.remove("btn-primary");
      submitButton.classList.add("btn-success");

      // 一番上までスクロール（お好み）
      window.scrollTo({ top: 0, behavior: "smooth" });

      return;
    }

    // 削除
    if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.delete, 10);
      if (Number.isNaN(index)) return;

      if (!confirm("この行を削除しますか？")) return;

      stadiums.splice(index, 1);
      renderTable();
      updateJsonOutput();

      // 削除したものが編集中だったらフォームもリセット
      if (editIndex === index) {
        resetForm();
      }

      return;
    }
  });

  // 既存 stadiums.json を読み込む
  loadJsonBtn.addEventListener("click", () => {
    if (!confirm("既存の stadiums.json を読み込みますか？（今のリストは上書きされます）")) {
      return;
    }

    fetch("stadiums.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("stadiums.json の読み込みに失敗しました");
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("stadiums.json の形式が不正です（配列ではありません）");
        }
        stadiums = data;
        renderTable();
        updateJsonOutput();
        resetForm();
      })
      .catch((err) => {
        console.error(err);
        alert("stadiums.json の読み込みに失敗しました。\nコンソールを確認してください。");
      });
  });

  // 全削除
  clearAllBtn.addEventListener("click", () => {
    if (!confirm("リストをすべて削除しますか？")) return;
    stadiums = [];
    renderTable();
    updateJsonOutput();
    resetForm();
  });

  // クリップボードにコピー
  copyJsonBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput.value);
      alert("JSONをクリップボードにコピーしました。");
    } catch (err) {
      console.error(err);
      alert("コピーに失敗しました。手動で選択してコピーしてください。");
    }
  });

  // 初期状態
  updateJsonOutput();
});
