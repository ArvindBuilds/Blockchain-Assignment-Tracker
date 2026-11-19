
let score = 0;
let totalAttempted = 0;
let totalQuestions = 0;

async function loadWeek(weekNum) {
    // Reset score and progress for new week
    score = 0;
    totalAttempted = 0;
    totalQuestions = 0;

    const container = document.getElementById('quiz-container');
    const title = document.getElementById('week-title');

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
            throw new Error("No questions found for this week");
        }

        // Calculate total questions
        totalQuestions = questions.length;

        const listBody = document.getElementById('questions-list');
        listBody.innerHTML = "";

        title.innerText = `Week ${weekNum} Practice Test`;

        questions.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';

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
                <div class="options-grid">${optionsHTML}</div>
                <div class="explanation-box" style="display:none;"></div>
            `;

            listBody.appendChild(card);
        });

    } catch (error) {
        container.innerHTML =
            "Error loading questions. Check questions.json file.";

        console.error(error);
    }
}

function checkAnswer(btn, selected, correct, explanation) {

    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('.option-btn');
    const expBox = parent.nextElementSibling;

    // Prevent multiple attempts
    if (btn.disabled) return;

    totalAttempted++;

    buttons.forEach(button => {
        button.disabled = true;
    });

    // Check answer
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

    // Update scoreboard
    document.getElementById('current-score').innerText = score;

    document.getElementById('attempted-count').innerText =
        totalAttempted;

    // Calculate progress percentage
    const progress = Math.round(
        (totalAttempted / totalQuestions) * 100
    );

    document.getElementById('progress-percent').innerText =
        progress + '%';

    // Show explanation
    expBox.innerHTML = `<strong>Solution:</strong> ${explanation}`;

    expBox.style.display = "block";
}
