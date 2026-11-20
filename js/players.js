/* No React. This module adds player selection to the existing game. */
const PlayerSelection = (() => {
    const players = [
        { name: "Jared", image: "assets/players/jared.png", color: "#343e49" },
        { name: "Frederic", image: "assets/players/frederic.png", color: "#52764b" },
        { name: "Russel", image: "assets/players/russel.png", color: "#6688a6" },
        { name: "Eric", image: "assets/players/eric.png", color: "#b1775d" }
    ];
    let chosen = null;
    let onChoose = null;
    const game = document.querySelector(".game-container");
    const mainMenu = document.getElementById("startMenu");
    const startButton = document.getElementById("startBtn");
    const cashier = document.querySelector(".cashier");

    // Insert the selection screen without replacing your existing index.html.
    const screen = document.createElement("section");
    screen.id = "rushPlayerSelect";
    screen.className = "modal-overlay";
    screen.hidden = true;
    screen.setAttribute("role", "dialog");
    screen.setAttribute("aria-modal", "true");
    screen.setAttribute("aria-labelledby", "rushPlayerTitle");
    screen.innerHTML = `
        <div class="modal-content rush-player-panel">
            <p class="rush-kicker">CANTEEN RUSH!</p>
            <h2 id="rushPlayerTitle">SELECT PLAYER</h2>
            <p class="rush-intro">Who's running the canteen today?</p>
            <div class="rush-player-grid"></div>
            <button type="button" class="rush-back">← BACK TO MENU</button>
        </div>`;
    game.appendChild(screen);

    const grid = screen.querySelector(".rush-player-grid");
    const back = screen.querySelector(".rush-back");
    const badge = document.createElement("div");
    badge.className = "rush-player-badge";
    badge.hidden = true;
    badge.innerHTML = '<img alt=""><span>PLAYER: <strong></strong></span>';
    document.querySelector(".game-title").appendChild(badge);
    const face = document.createElement("img");
    face.className = "rush-cashier-face";
    face.alt = "";
    face.hidden = true;
    cashier.appendChild(face);

    // Generate a CSS body and use the real cut-out photo for its head.
    players.forEach(player => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "rush-player-card";
        card.dataset.player = player.name;
        card.setAttribute("aria-label", "Select " + player.name);
        card.innerHTML = `
            <span class="rush-avatar" aria-hidden="true">
                <span class="rush-shadow"></span>
                <span class="rush-leg rush-leg-left"></span>
                <span class="rush-leg rush-leg-right"></span>
                <span class="rush-arm rush-arm-left"></span>
                <span class="rush-arm rush-arm-right"></span>
                <span class="rush-torso"><span class="rush-apron"></span></span>
                <img class="rush-head" alt="">
            </span>
            <strong></strong>
            <span class="rush-choose">SELECT ▶</span>`;
        card.querySelector(".rush-avatar").style.setProperty("--rush-shirt", player.color);
        card.querySelector(".rush-head").src = player.image;
        card.querySelector("strong").textContent = player.name;
        card.addEventListener("click", () => select(player));
        grid.appendChild(card);
    });

    // Prevent interacting with the background while selecting a player.
    const background = Array.from(game.children).filter(el => el !== screen && el.tagName !== "TEMPLATE");
    function lockBackground(locked) {
        background.forEach(el => { el.inert = locked; });
    }
    function close() {
        screen.hidden = true;
        lockBackground(false);
    }
    function open(callback) {
        onChoose = callback;
        mainMenu.hidden = true;
        screen.hidden = false;
        lockBackground(true);
        grid.querySelector("button").focus();
    }
    function select(player) {
        chosen = player;
        face.src = player.image;
        face.alt = player.name + " as cashier";
        face.hidden = false;
        cashier.classList.add("rush-personalized");
        cashier.style.setProperty("--rush-shirt", player.color);
        badge.querySelector("img").src = player.image;
        badge.querySelector("strong").textContent = player.name;
        badge.hidden = false;
        const callback = onChoose;
        onChoose = null;
        close();
        if (typeof callback === "function") callback(player);
        document.getElementById("pauseBtn").focus();
    }
    function cancel() {
        onChoose = null;
        close();
        mainMenu.hidden = false;
        startButton.focus();
    }
    back.addEventListener("click", cancel);
    screen.addEventListener("keydown", event => {
        if (event.key === "Escape") { event.preventDefault(); cancel(); }
        if (event.key === "Tab") {
            const buttons = Array.from(screen.querySelectorAll("button"));
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
    function reset() {
        chosen = null;
        onChoose = null;
        close();
        badge.hidden = true;
        face.hidden = true;
        cashier.classList.remove("rush-personalized");
        cashier.style.removeProperty("--rush-shirt");
    }
    return { open, reset, getSelected: () => chosen };
})();
