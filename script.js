
let score = 0;
let totalAttempted = 0;
let totalQuestions = 0;
let currentWeek = 1;
let weekAnswers = {};

const STORAGE_KEY = "blockchainTrackerProgress";

// Get saved progress
function getSavedProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        console.error("Could not read saved progress:", error);
        return {};
    }
}

// Save current week's progress
function saveProgress() {
    try {
        const allProgress = getSavedProgress();

        allProgress[currentWeek] = {
            score: score,
            totalAttempted: totalAttempted,
            answers: weekAnswers
        };

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(allProgress)
        );
    } catch (error) {
        console.error("Could not save progress:", error);
    }
}

// Update scoreboard
function updateScoreboard() {
    document.getElementById('current-score').innerText = score;

    document.getElementById('attempted-count').innerText =
        totalAttempted;

    const progress = totalQuestions > 0
        ? Math.round((totalAttempted / totalQuestions) * 100)
        : 0;

    document.getElementById('progress-percent').innerText =
        progress + '%';
}


// Load selected week
async function loadWeek(weekNum) {

    currentWeek = weekNum;

    const container = document.getElementById('quiz-container');
    const title = document.getElementById('week-title');

    score = 0;
    totalAttempted = 0;
    totalQuestions = 0;
    weekAnswers = {};

    container.innerHTML = `
        <div class="scoreboard">
            <span>Score: <strong id="current-score">0</strong></span>
            <span>Questions: <strong id="attempted-count">0</strong></span>
            <span>Progress: <strong id="progress-percent">0%</strong></span>
        </div>
        <div id="questions-list">Loading...</div>
    `;

    try {
        const response = await fetch('questions.json');

        if (!response.ok) {
            throw new Error("Failed to load questions");
        }

        const data = await response.json();
        const questions = data.weeks[weekNum];

        if (!questions || questions.length === 0) {
            throw new Error("No questions found");
        }

        totalQuestions = questions.length;

        // Restore saved progress
        const savedProgress = getSavedProgress();
        const savedWeek = savedProgress[weekNum];

        if (savedWeek) {
            score = savedWeek.score || 0;
            totalAttempted = savedWeek.totalAttempted || 0;
            weekAnswers = savedWeek.answers || {};
        }

        const listBody = document.getElementById('questions-list');

        listBody.innerHTML = "";

        title.innerText = `Week ${weekNum} Practice Test`;

        questions.forEach((item, index) => {

            const card = document.createElement('div');

            card.className = 'question-card';
            card.dataset.questionIndex = index;

            let optionsHTML = "";

            item.options.forEach((opt, optIdx) => {

                optionsHTML += `
                    <button class="option-btn"
                        onclick="checkAnswer(this, ${optIdx}, ${item.correct}, '${item.explanation.replace(/'/g, "\\'")}')">
                        ${opt}
                    </button>
                `;
            });

            card.innerHTML = `
                <p><strong>Q${index + 1}:</strong> ${item.q}</p>

                <div class="options-grid">
                    ${optionsHTML}
                </div>

                <div class="explanation-box"
                    style="display:none;">
                </div>
            `;

            listBody.appendChild(card);

            // Restore previously attempted answer
            const savedAnswer = weekAnswers[index];

            if (savedAnswer) {

                const buttons = card.querySelectorAll('.option-btn');

                buttons.forEach(button => {
                    button.disabled = true;
                });

                if (savedAnswer.selected === savedAnswer.correct) {

                    buttons[savedAnswer.selected].style.background =
                        "#2ecc71";

                    buttons[savedAnswer.selected].style.color = "white";

                } else {

                    buttons[savedAnswer.selected].style.background =
                        "#e74c3c";

                    buttons[savedAnswer.selected].style.color = "white";

                    buttons[savedAnswer.correct].style.background =
                        "#2ecc71";

                    buttons[savedAnswer.correct].style.color = "white";
                }

                const expBox = card.querySelector('.explanation-box');

                expBox.innerHTML =
                    `<strong>Solution:</strong> ${savedAnswer.explanation}`;

                expBox.style.display = "block";
            }
        });

        updateScoreboard();

        // Restore completed quiz result
        if (totalAttempted === totalQuestions) {
            showFinalResult();
        }

    } catch (error) {

        container.innerHTML =
            "Error loading questions. Check questions.json file.";

        console.error(error);
    }
}


// Check selected answer
function checkAnswer(btn, selected, correct, explanation) {

    const parent = btn.parentElement;
    const card = parent.parentElement;

    const buttons = parent.querySelectorAll('.option-btn');
    const expBox = parent.nextElementSibling;

    if (btn.disabled) return;

    totalAttempted++;

    buttons.forEach(button => {
        button.disabled = true;
    });

    if (selected === correct) {

        score++;

        btn.style.background = "#2ecc71";
        btn.style.color = "white";

    } else {

        btn.style.background = "#e74c3c";
        btn.style.color = "white";

        buttons[correct].style.background = "#2ecc71";
        buttons[correct].style.color = "white";
    }

    // Save answer against question index
    const questionIndex = card.dataset.questionIndex;

    weekAnswers[questionIndex] = {
        selected: selected,
        correct: correct,
        explanation: explanation
    };

    updateScoreboard();

    // Show explanation
    expBox.innerHTML =
        `<strong>Solution:</strong> ${explanation}`;

    expBox.style.display = "block";

    // Automatically save progress
    saveProgress();

    // Check quiz completion
    if (totalAttempted === totalQuestions) {
        showFinalResult();
    }
}


// Final result screen
function showFinalResult() {

    if (document.getElementById('final-result')) return;

    const wrongAnswers = totalQuestions - score;

    const accuracy = totalQuestions > 0
        ? Math.round((score / totalQuestions) * 100)
        : 0;

    const resultBox = document.createElement('div');

    resultBox.id = 'final-result';

    resultBox.style.cssText = `
        background: white;
        padding: 30px;
        margin: 25px 0;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        border-top: 5px solid #27ae60;
    `;

    let message = "Keep Practicing! 💪";

    if (accuracy >= 80) {
        message = "Excellent Work! 🏆";
    } else if (accuracy >= 60) {
        message = "Good Job! 🎉";
    }

    resultBox.innerHTML = `
        <h2>🎉 Quiz Completed!</h2>

        <h1 style="font-size:42px;color:#27ae60;">
            ${score}/${totalQuestions}
        </h1>

        <h3>${message}</h3>

        <div style="
            display:flex;
            justify-content:space-around;
            flex-wrap:wrap;
            gap:20px;
            margin:25px 0;
        ">
            <div>
                <h2 style="color:#27ae60;">${score}</h2>
                <p>Correct Answers</p>
            </div>

            <div>
                <h2 style="color:#e74c3c;">${wrongAnswers}</h2>
                <p>Wrong Answers</p>
            </div>

            <div>
                <h2 style="color:#3498db;">${accuracy}%</h2>
                <p>Accuracy</p>
            </div>
        </div>

        <p><strong>Completion: 100%</strong></p>

        <div style="
            background:#e0e0e0;
            height:12px;
            border-radius:10px;
            overflow:hidden;
            margin:15px 0 25px;
        ">
            <div style="
                background:#27ae60;
                width:100%;
                height:100%;
            "></div>
        </div>

        <button id="restart-quiz"
            style="
                background:#27ae60;
                color:white;
                border:none;
                padding:13px 28px;
                border-radius:7px;
                cursor:pointer;
                font-size:16px;
                font-weight:bold;
            ">
            🔄 Restart Quiz
        </button>
    `;

    document.getElementById('quiz-container')
        .appendChild(resultBox);

    document.getElementById('restart-quiz')
        .addEventListener('click', () => {

            // Clear only current week's progress
            const allProgress = getSavedProgress();

            delete allProgress[currentWeek];

            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(allProgress)
                );
            } catch (error) {
                console.error(error);
            }

            loadWeek(currentWeek);

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

    resultBox.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}
