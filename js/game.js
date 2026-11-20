
$(document).ready(function () {

    // ========================================
    // 01. QUEUE INITIALIZATION
    // ========================================

    const queue = new Queue();

    const MAX_QUEUE = 6;
    const SHIFT_DURATION = 60;
    const TARGET_SCORE = 10;


    // ========================================
    // 02. FOOD ITEMS
    // ========================================

    const foods = [
        {
            id: "siomai",
            name: "Siomai Rice",
            icon: "🍚"
        },
        {
            id: "adobo",
            name: "Chicken Adobo",
            icon: "🍗"
        },
        {
            id: "pancit",
            name: "Pancit Canton",
            icon: "🍜"
        },
        {
            id: "gulaman",
            name: "Sago't Gulaman",
            icon: "🥤"
        }
    ];


    // ========================================
    // 03. DIFFICULTY SETTINGS
    // ========================================

    const difficulties = {

        easy: {
            arrival: 4,
            patience: 15,
            penalty: 1,
            description: "Easy: A student every 4s, patience 15s."
        },

        normal: {
            arrival: 3,
            patience: 10,
            penalty: 2,
            description: "Normal: A student every 3s, patience 10s."
        },

        hard: {
            arrival: 1.8,
            patience: 7,
            penalty: 3,
            description: "Hard: A student every 1.8s, patience 7s."
        }

    };


    // ========================================
    // 04. GAME VARIABLES
    // ========================================

    let difficulty = "normal";
    let settings = difficulties.normal;

    let score = 0;
    let missed = 0;
    let wrongOrders = 0;

    let customerNumber = 0;
    let timeLeft = SHIFT_DURATION;
    let arrivalTimer = 0;

    let gameState = "menu";

    let gameInterval = null;
    let lastUpdate = 0;

    let soundEnabled = true;
    let audioContext = null;

    const customerNodes = new Map();


    // ========================================
    // 05. CUSTOMER APPEARANCE
    // ========================================

    const shirtColors = [
        "#6688a6",
        "#b1775d",
        "#789654",
        "#8875a1",
        "#ba9955",
        "#548f8a"
    ];

    const hairColors = [
        "#49382d",
        "#302a29",
        "#795338"
    ];

    const skinColors = [
        "#dfae85",
        "#c79268",
        "#efbd96",
        "#b98160"
    ];

    function randomItem(array) {
        return array[
            Math.floor(Math.random() * array.length)
        ];
    }


    // ========================================
    // 06. DIFFICULTY SELECTION
    // ========================================

    $('input[name="difficulty"]').change(function () {

        difficulty = $(this).val();

        settings = difficulties[difficulty];

        $("#difficultyDescription").text(
            settings.description
        );

        playSound("click");

    });


    // ========================================
    // 07. START GAME
    // ========================================

    function startGame() {

        clearInterval(gameInterval);

        queue.clear();

        customerNodes.clear();

        $("#customerQueue").empty();

        score = 0;
        missed = 0;
        wrongOrders = 0;

        customerNumber = 0;

        timeLeft = SHIFT_DURATION;
        arrivalTimer = 0;

        difficulty = $('input[name="difficulty"]:checked').val()
            || "normal";

        settings = difficulties[difficulty];

        gameState = "running";

        $("#startMenu").prop("hidden", true);
        $("#pauseScreen").prop("hidden", true);
        $("#gameOver").prop("hidden", true);
        $("#howToPlayModal").prop("hidden", true);

        $("#pauseBtn").prop("disabled", false);
        $("#restartBtn").prop("disabled", false);
        $("#menuBtn").prop("disabled", false);

        setMessage("The canteen is open!");

        spawnCustomer();

        updateUI();

        lastUpdate = performance.now();

        gameInterval = setInterval(gameLoop, 100);

        playSound("start");

    }


    // ========================================
    // 08. GENERATE CUSTOMER
    // ========================================

    function spawnCustomer() {

        if (gameState !== "running") {
            return;
        }

        // Check whether the queue is full
        if (queue.isFull(MAX_QUEUE)) {

            missed++;

            setMessage(
                "The queue is full! A student walked away."
            );

            playSound("wrong");

            updateUI();

            return;

        }

        customerNumber++;

        const food = randomItem(foods);

        const customer = {

            id: customerNumber,

            food: food,

            patience: settings.patience,

            maxPatience: settings.patience,

            shirtColor: randomItem(shirtColors),

            hairColor: randomItem(hairColors),

            skinColor: randomItem(skinColors)

        };

        // ENQUEUE:
        // Add the new customer at the rear
        queue.enqueue(customer);

        renderQueue();

        updateUI();

    }


// ========================================
// 09. RENDER CUSTOMER QUEUE
// ========================================

function renderQueue(exitAnimation = "leaving") {

    const customers = queue.getItems();

    const activeIds = new Set(
        customers.map(customer => customer.id)
    );

    // Animate removed customers
    for (const [id, node] of customerNodes) {

        if (!activeIds.has(id)) {

            clearTimeout(node.walkingTimer);

            node.classList.remove(
                "walking",
                "is-front",
                "entering"
            );

            node.classList.add(
                "departing",
                exitAnimation
            );

            node.setAttribute("aria-hidden", "true");

            customerNodes.delete(id);

            setTimeout(function () {

                node.remove();

            }, 420);

        }

    }

    // Create and position customers
    customers.forEach(function (customer, index) {

        let node = customerNodes.get(customer.id);

        // Create a new customer
        if (!node) {

            const template = document.getElementById(
                "customerTemplate"
            );

            node = template.content
                .firstElementChild.cloneNode(true);

            node.dataset.customerId = customer.id;

            node.style.setProperty(
                "--shirt-color",
                customer.shirtColor
            );

            node.style.setProperty(
                "--hair-color",
                customer.hairColor
            );

            node.style.setProperty(
                "--skin-color",
                customer.skinColor
            );

            node.querySelector(
                ".customer-order-icon"
            ).textContent = customer.food.icon;

            node.querySelector(
                ".customer-number"
            ).textContent =
                "#" + String(customer.id).padStart(3, "0");

            // Start from the right side
            node.style.left = "100%";

            document.getElementById(
                "customerQueue"
            ).appendChild(node);

            customerNodes.set(customer.id, node);

            // Apply the initial position
            void node.offsetWidth;

        }

        // Move customer to the correct queue slot
        moveCustomer(node, index);

        // Highlight the front customer
        node.classList.toggle(
            "is-front",
            index === 0
        );

    });

}


// ========================================
// SMOOTH CUSTOMER MOVEMENT
// ========================================

function moveCustomer(node, index) {

    const position = (index / MAX_QUEUE) * 100;

    // Do not animate if the position is unchanged
    if (node.dataset.slot === String(index)) {
        return;
    }

    node.dataset.slot = String(index);

    clearTimeout(node.walkingTimer);

    node.classList.add("walking");

    node.style.left = position + "%";

    // Stop walking after reaching the position
    node.walkingTimer = setTimeout(function () {
    node.classList.remove("walking");
    }, 1500);

}

    
    // ========================================
    // 10. MAIN GAME LOOP
    // ========================================

    function gameLoop() {

        if (gameState !== "running") {
            return;
        }

        const now = performance.now();

        const elapsed = Math.min(
            (now - lastUpdate) / 1000,
            timeLeft
        );

        lastUpdate = now;

        timeLeft = Math.max(
            0,
            timeLeft - elapsed
        );

        updatePatience(elapsed);

        // End the shift when the timer reaches zero
        if (timeLeft <= 0) {

            updateUI();

            endGame();

            return;

        }

        // Control customer arrivals
        arrivalTimer += elapsed;

        if (arrivalTimer >= settings.arrival) {

            arrivalTimer %= settings.arrival;

            spawnCustomer();

        }

        updateUI();

    }


    // ========================================
    // 11. CUSTOMER PATIENCE
    // ========================================

    function updatePatience(elapsed) {

        const customers = queue.getItems();

        // Every waiting customer loses patience
        customers.forEach(function (customer) {

            customer.patience = Math.max(
                0,
                customer.patience - elapsed
            );

        });

        // Only remove expired customers from the front
        while (
            !queue.isEmpty() &&
            queue.peek().patience <= 0
        ) {

            removeImpatientCustomer();

        }

    }


    // ========================================
    // 12. REMOVE IMPATIENT CUSTOMER
    // ========================================

    function removeImpatientCustomer() {

        if (queue.isEmpty()) {
            return;
        }

        // DEQUEUE:
        // Remove the first customer
        const customer = queue.dequeue();

        missed++;

        setMessage(
            "Student #" + customer.id +
            " ran out of patience!"
        );

        renderQueue();

        playSound("wrong");

    }


    // ========================================
    // 13. SERVE CUSTOMER
    // ========================================

    function serveCustomer(selectedFood) {

        if (gameState !== "running") {
            return;
        }

        if (queue.isEmpty()) {

            setMessage("There are no customers!");

            return;

        }

        // PEEK:
        // Check the first customer in line
        const customer = queue.peek();

        const button = $(
            '.food-btn[data-food="' + selectedFood + '"]'
        );

        // CORRECT FOOD
        if (customer.food.id === selectedFood) {

            // DEQUEUE:
            // Remove the customer at the front
            queue.dequeue();

            score++;

            setMessage(
                "Student #" + customer.id +
                " received " + customer.food.name + "! +1"
            );

            button.addClass("correct");

            setTimeout(function () {

                button.removeClass("correct");

            }, 250);

            playSound("correct");

            renderQueue("served");

            // Complete the shift after serving 10 customers

if (score >= TARGET_SCORE) {
    updateUI();
    endGame();
    return;
}
        }

        // WRONG FOOD
        else {

            wrongOrders++;

            customer.patience = Math.max(
                0,
                customer.patience - settings.penalty
            );

            setMessage(
                "Wrong order! The customer wants " +
                customer.food.name + "."
            );

            button.addClass("incorrect");

            setTimeout(function () {

                button.removeClass("incorrect");

            }, 250);

            const node = customerNodes.get(customer.id);

            if (node) {

                node.classList.add("wrong-order");

                setTimeout(function () {

                    node.classList.remove("wrong-order");

                }, 300);

            }

            playSound("wrong");

            // Customer leaves if patience reaches zero
            if (customer.patience <= 0) {

                removeImpatientCustomer();

            }

        }

        updateUI();

    }


    // ========================================
    // 14. FOOD BUTTON EVENTS
    // ========================================

    $(".food-btn").click(function () {

        const selectedFood = $(this).data("food");

        serveCustomer(selectedFood);

    });


    // ========================================
    // 15. UPDATE GAME INTERFACE
    // ========================================

    function updateUI() {

        $("#score").text(
      score + "/" + TARGET_SCORE
        );

        $("#missed").text(
            String(missed).padStart(2, "0")
        );

        $("#queueCount").text(queue.size());

        $("#timer").text(
            formatTime(timeLeft)
        );

        updateCurrentOrder();

        updateCustomerBars();

        $(".food-btn").prop(
            "disabled",
            gameState !== "running" || queue.isEmpty()
        );

    }
    
    // ========================================
    // 16. FORMAT GAME TIMER
    // ========================================

    function formatTime(seconds) {

        const total = Math.max(
            0,
            Math.ceil(seconds)
        );

        const minutes = Math.floor(total / 60);

        const remainingSeconds = total % 60;

        return String(minutes).padStart(2, "0") +
            ":" +
            String(remainingSeconds).padStart(2, "0");

    }


    // ========================================
    // 17. UPDATE CURRENT ORDER
    // ========================================

    function updateCurrentOrder() {

        if (queue.isEmpty()) {

            $("#orderNumber").text("#---");

            $("#orderIcon").text("🍽️");

            $("#orderName").text("No Customer");

            $("#orderStatus").text(
                "Waiting for customers..."
            );

            $("#currentPatience").css("width", "0%");

            return;

        }

        // Get the first customer
        const customer = queue.peek();

        $("#orderNumber").text(
            "#" + String(customer.id).padStart(3, "0")
        );

        $("#orderIcon").text(
            customer.food.icon
        );

        $("#orderName").text(
            customer.food.name
        );

        const percentage =
            (customer.patience / customer.maxPatience) * 100;

        $("#currentPatience").css({

            width: percentage + "%",

            background: patienceColor(percentage)

        });

        if (percentage <= 25) {

            $("#orderStatus").text("Hurry! Almost leaving!");

        } else if (percentage <= 50) {

            $("#orderStatus").text("Getting impatient...");

        } else {

            $("#orderStatus").text("Ready to order");

        }

    }


    // ========================================
    // 18. UPDATE CUSTOMER PATIENCE BARS
    // ========================================

    function updateCustomerBars() {

        queue.getItems().forEach(function (customer) {

            const node = customerNodes.get(customer.id);

            if (!node) {
                return;
            }

            const percentage =
                (customer.patience / customer.maxPatience) * 100;

            const bar = node.querySelector(
                ".customer-patience-fill"
            );

            bar.style.width = percentage + "%";

            bar.style.background =
                patienceColor(percentage);

            node.classList.toggle(
                "impatient",
                percentage <= 50 && percentage > 25
            );

            node.classList.toggle(
                "angry",
                percentage <= 25
            );

        });

    }


    function patienceColor(percentage) {

        if (percentage <= 25) {
            return "#bd5146";
        }

        if (percentage <= 50) {
            return "#d3a044";
        }

        return "#729b45";

    }


    // ========================================
    // 19. COUNTER MESSAGES
    // ========================================

    function setMessage(message) {

        $("#gameMessage").text(message);

    }


    // ========================================
    // 20. PAUSE GAME
    // ========================================

    function pauseGame() {

        if (gameState !== "running") {
            return;
        }

        gameState = "paused";

        clearInterval(gameInterval);

        $("#pauseScreen").prop("hidden", false);

        $("#pauseBtn").text("RESUME");

        updateUI();

        playSound("click");

    }


    // ========================================
    // 21. RESUME GAME
    // ========================================

    function resumeGame() {

        if (gameState !== "paused") {
            return;
        }

        gameState = "running";

        $("#pauseScreen").prop("hidden", true);

        $("#pauseBtn").text("PAUSE");

        lastUpdate = performance.now();

        clearInterval(gameInterval);

        gameInterval = setInterval(gameLoop, 100);

        updateUI();

        playSound("click");

    }


    // ========================================
    // 22. TOGGLE PAUSE
    // ========================================

    function togglePause() {

        if (gameState === "running") {

            pauseGame();

        } else if (gameState === "paused") {

            resumeGame();

        }

    }


    // ========================================
    // 23. END GAME
    // ========================================

    function endGame() {

        gameState = "over";

        clearInterval(gameInterval);

        const totalAttempts = score + wrongOrders;

        const accuracy = totalAttempts > 0
            ? Math.round((score / totalAttempts) * 100)
            : 0;

        $("#finalScore").text(score);

        $("#finalMissed").text(missed);

        $("#finalWrong").text(wrongOrders);

        $("#finalAccuracy").text(
            accuracy + "%"
        );

       $("#resultTitle").text(
        score >= TARGET_SCORE
        ? "SHIFT COMPLETED!"
        : "SHIFT FAILED!"

        );

if (score >= TARGET_SCORE) {
            $("#resultIcon").text("🏆");

            $("#resultMessage").text(
                "Excellent work! You're a canteen master!"
            );

        } else if (score >= 8) {

            $("#resultIcon").text("⭐");

            $("#resultMessage").text(
                "Great job! Keep practicing your FIFO skills."
            );

        } else {

            $("#resultIcon").text("🍱");

            $("#resultMessage").text(
                "Good effort! Try again to improve your score."
            );

        }

        $("#pauseBtn").prop("disabled", true);

        updateUI();

        $("#gameOver").prop("hidden", false);

        playSound("finish");

    }


    // ========================================
    // 24. RETURN TO MAIN MENU
    // ========================================

    function showMainMenu() {

    PlayerSelection.reset();

    clearInterval(gameInterval);

        gameState = "menu";

        queue.clear();

        customerNodes.clear();

        $("#customerQueue").empty();

        score = 0;
        missed = 0;
        wrongOrders = 0;

        customerNumber = 0;
        timeLeft = SHIFT_DURATION;
        arrivalTimer = 0;

        $("#pauseScreen").prop("hidden", true);

        $("#gameOver").prop("hidden", true);

        $("#howToPlayModal").prop("hidden", true);

        $("#pauseBtn")
            .prop("disabled", true)
            .text("PAUSE");

        $("#restartBtn").prop("disabled", true);

        $("#menuBtn").prop("disabled", true);

        setMessage(
            "Start a shift to open the canteen."
        );

        updateUI();

        $("#startMenu").prop("hidden", false);

    }


    // ========================================
    // 25. GAME CONTROL BUTTONS
    // ========================================

   $("#startBtn").click(function () {

    PlayerSelection.open(function () {

        $("#pauseBtn").text("PAUSE");

        startGame();

    });

}); 

    $("#pauseBtn").click(togglePause);

    $("#resumeBtn").click(resumeGame);

    $("#restartBtn, #pauseRestartBtn, #playAgainBtn")
        .click(function () {

            $("#pauseBtn").text("PAUSE");

            startGame();

        });

    $("#menuBtn, #pauseMenuBtn, #resultMenuBtn")
        .click(showMainMenu);


    // ========================================
    // 26. HOW TO PLAY MODAL
    // ========================================

    $("#howToPlayBtn").click(function () {

        $("#howToPlayModal").prop("hidden", false);

        playSound("click");

    });

    $("#closeHowToPlayBtn").click(function () {

        $("#howToPlayModal").prop("hidden", true);

        playSound("click");

    });


    // ========================================
    // 27. KEYBOARD CONTROLS
    // ========================================

    $(document).keydown(function (event) {

        if (event.repeat) {
            return;
        }

        if (
            $(event.target).is(
                "input, textarea, select"
            )
        ) {
            return;
        }

        if (
            event.code === "Space" &&
            (
                gameState === "running" ||
                gameState === "paused"
            )
        ) {

            event.preventDefault();

            togglePause();

            return;

        }

        if (gameState !== "running") {
            return;
        }

        switch (event.key) {

            case "1":
                serveCustomer("siomai");
                break;

            case "2":
                serveCustomer("adobo");
                break;

            case "3":
                serveCustomer("pancit");
                break;

            case "4":
                serveCustomer("gulaman");
                break;

        }

    });


    // ========================================
    // 28. SOUND CONTROL
    // ========================================

    function toggleSound() {

        soundEnabled = !soundEnabled;

        const label = soundEnabled
            ? "SOUND: ON"
            : "SOUND: OFF";

        $("#soundBtn, #menuSoundBtn").text(label);

        if (soundEnabled) {

            playSound("click");

        }

    }

    $("#soundBtn, #menuSoundBtn").click(toggleSound);


    // ========================================
    // 29. SIMPLE ARCADE SOUND EFFECTS
    // ========================================

    function playSound(type) {

        if (!soundEnabled) {
            return;
        }

        try {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) {
                return;
            }

            if (!audioContext) {

                audioContext = new AudioContextClass();

            }

            if (audioContext.state === "suspended") {

                audioContext.resume().catch(function () {});

            }

            const effects = {

                click: [440, 0.06],

                start: [660, 0.15],

                correct: [880, 0.12],

                wrong: [160, 0.18],

                finish: [1046, 0.3]

            };

            const effect = effects[type] || effects.click;

            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            const now = audioContext.currentTime;

            oscillator.type = "triangle";

            oscillator.frequency.value = effect[0];

            gain.gain.setValueAtTime(0.06, now);

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + effect[1]
            );

            oscillator.connect(gain);

            gain.connect(audioContext.destination);

            oscillator.start(now);

            oscillator.stop(now + effect[1]);

        } catch (error) {

            // The game continues even if audio is unavailable

        }

    }


    // ========================================
    // 30. AUTO-PAUSE WHEN LEAVING THE TAB
    // ========================================

    document.addEventListener(
        "visibilitychange",
        function () {

            if (document.hidden) {

                pauseGame();

            }

        }
    );


    // ========================================
    // 31. INITIALIZE GAME
    // ========================================

    $("#difficultyDescription").text(
        settings.description
    );

    showMainMenu();

});
