const courseDetails = {
    html: {
        title: "HTML Fundamentals",
        modules: 8,
        description: "Build accessible page structure, forms, and content layout.",
        materials: [
            "Annotated HTML reference guide",
            "Semantic markup workbook",
            "Form and accessibility tutorial",
            "HTML project starter kit",
            "Quiz review sheets"
        ]
    },
    css: {
        title: "CSS Design & Layout",
        modules: 7,
        description: "Create responsive styling, grids, and polished page designs.",
        materials: [
            "Responsive grid examples",
            "Design token checklist",
            "CSS animation lab",
            "Visual style system notes",
            "Style reference quicksheet"
        ]
    },
    js: {
        title: "JavaScript Essentials",
        modules: 10,
        description: "Add interactivity, DOM control, and practical scripting skills.",
        materials: [
            "DOM scripting exercises",
            "Async patterns tutorial",
            "JavaScript logic workbook",
            "Project-based code examples",
            "Debugging and best practices guide"
        ]
    },
    python: {
        title: "Python for Web",
        modules: 7,
        description: "Learn Python fundamentals for automation and data handling.",
        materials: [
            "Python syntax lessons",
            "Data processing workbook",
            "Automation script examples",
            "Web tool project guides",
            "Python productivity checklist"
        ]
    },
    data: {
        title: "Data Science Basics",
        modules: 6,
        description: "Explore analysis concepts, charts, and data workflows.",
        materials: [
            "Data visualization templates",
            "Statistics fundamentals guide",
            "Dataset exploration lab",
            "Charts and storytelling workbook",
            "Analysis project brief"
        ]
    },
    ux: {
        title: "UI / UX Foundations",
        modules: 6,
        description: "Understand user-centered design, research, and layout strategy.",
        materials: [
            "Research and persona templates",
            "Wireframe and prototype guide",
            "Accessibility review checklist",
            "Interaction design notes",
            "UX case study workbook"
        ]
    }
};

const quizAnswers = {
    q1: "h1",
    q2: "padding",
    q3: "let"
};

function registerUser() {
    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!username || !password) {
        alert("Enter a username and password.");
        return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    localStorage.setItem("loggedIn", "true");

    window.location.href = "/";
}

function loginUser() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const savedUser = localStorage.getItem("username");
    const savedPass = localStorage.getItem("password");

    if (username === savedUser && password === savedPass) {
        localStorage.setItem("loggedIn", "true");
        window.location.href = "/";
    } else {
        alert("Wrong username or password");
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "/login";
}

function isPublicPage() {
    const path = window.location.pathname.toLowerCase();
    const page = (path.replace(/\/+$/, "").split("/").pop() || "index").replace(/\.html$/, "");
    return ["index", "login", "register", "contact", "styleguide"].includes(page);
}

function applyTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", theme);
}

function initPageTransitions() {
    document.body.classList.add("js-enabled");
    document.body.classList.add("page-visible");

    const currentUrl = window.location.href;
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.hasAttribute('download')) return;

        const url = new URL(href, currentUrl);
        const sameOrigin = url.protocol === window.location.protocol && url.host === window.location.host;
        const isExternal = link.target === '_blank' || !sameOrigin;

        if (isExternal) return;

        link.addEventListener('click', event => {
            event.preventDefault();
            const destination = url.href;
            document.body.classList.remove("page-visible");
            setTimeout(() => window.location.href = destination, 220);
        });
    });
}

function getStorageNumber(key) {
    return parseInt(localStorage.getItem(key) || "0", 10);
}

function setCourseProgress(courseId, value) {
    localStorage.setItem(`course-${courseId}-progress`, value);
}

function getCourseProgress(courseId) {
    return getStorageNumber(`course-${courseId}-progress`);
}

function completeModule(courseId) {
    const course = courseDetails[courseId];
    if (!course) return;

    const current = getCourseProgress(courseId);
    if (current >= course.modules) {
        alert(`${course.title} is already complete.`);
        return;
    }

    setCourseProgress(courseId, current + 1);
    updateProgress();
    alert(`Great job! You completed a module in ${course.title}.`);
}

function showCourseSummary(courseId) {
    const details = courseDetails[courseId];
    if (!details) return;

    const current = getCourseProgress(courseId);
    const summary = document.getElementById("courseSummary");
    if (!summary) return;

    const materialsHtml = details.materials.map(item => `<li>${item}</li>`).join("");

    summary.innerHTML = `
        <h2>${details.title}</h2>
        <p>${details.description}</p>
        <p><strong>${current} / ${details.modules}</strong> modules completed.</p>
        <h3>Learning materials</h3>
        <ul class="module-list">${materialsHtml}</ul>
        <p>Use these resources to study each module and build practical skills.</p>
    `;
}

function submitContact(event) {
    event.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();
    const feedback = document.getElementById("contactFeedback");

    if (!name || !email || !message) {
        feedback.textContent = "Please complete every field before sending.";
        return;
    }

    feedback.textContent = "Thanks! Your message has been sent in this demo environment.";
    document.getElementById("contactForm").reset();
}

function submitQuiz() {
    const selectedQ1 = document.querySelector('input[name="q1"]:checked');
    const selectedQ2 = document.querySelector('input[name="q2"]:checked');
    const selectedQ3 = document.querySelector('input[name="q3"]:checked');
    const essay = document.getElementById("essayAnswer").value.trim();
    const essay2 = document.getElementById("essayAnswer2").value.trim();
    const essay3 = document.getElementById("essayAnswer3").value.trim();
    const result = document.getElementById("quizResult");

    if (!selectedQ1 || !selectedQ2 || !selectedQ3) {
        result.textContent = "Please answer all multiple-choice questions before submitting.";
        result.style.color = "#b91c1c";
        return;
    }

    if (essay.length < 50 || essay2.length < 50 || essay3.length < 50) {
        result.textContent = "Please write at least 50 characters for every essay question.";
        result.style.color = "#b91c1c";
        return;
    }

    let score = 0;
    if (selectedQ1.value === quizAnswers.q1) score += 1;
    if (selectedQ2.value === quizAnswers.q2) score += 1;
    if (selectedQ3.value === quizAnswers.q3) score += 1;

    const percent = Math.round((score / 3) * 100);
    const passed = percent >= 70;
    const quizEntry = {
        date: new Date().toISOString(),
        score: percent,
        passed,
        essay,
        essay2,
        essay3
    };

    const history = getQuizHistory();
    history.unshift(quizEntry);
    localStorage.setItem("quizHistory", JSON.stringify(history));
    localStorage.setItem("latestQuizScore", percent);

    const summary = passed ? "Nice work!" : "Good attempt.";
    result.innerHTML = `
        <strong>${summary}</strong>
        <p>Multiple choice score: ${percent}% (${score} / 3)</p>
        <p>Your essay responses were saved for review.</p>
    `;
    result.style.color = "";
}

function resetQuiz() {
    const inputs = document.querySelectorAll('input[name="q1"], input[name="q2"], input[name="q3"]');
    inputs.forEach(input => input.checked = false);
    document.getElementById("essayAnswer").value = "";
    document.getElementById("essayAnswer2").value = "";
    document.getElementById("essayAnswer3").value = "";
    const result = document.getElementById("quizResult");
    if (result) result.textContent = "";
}

function getQuizHistory() {
    const stored = localStorage.getItem("quizHistory");
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (error) {
        return [];
    }
}

function getQuizMetrics() {
    const history = getQuizHistory();
    const count = history.length;
    const average = count > 0 ? Math.round(history.reduce((sum, entry) => sum + (entry.score || 0), 0) / count) : 0;
    const essays = history.reduce((sum, entry) => {
        let essayCount = 0;
        if (entry.essay && entry.essay.trim().length) essayCount += 1;
        if (entry.essay2 && entry.essay2.trim().length) essayCount += 1;
        if (entry.essay3 && entry.essay3.trim().length) essayCount += 1;
        return sum + essayCount;
    }, 0);

    return {
        count,
        average,
        essays,
        latest: history.length ? history[0].score : null
    };
}

function renderEssayHistory() {
    const summary = document.getElementById("essaySummary");
    const historyList = document.getElementById("essayHistoryList");
    const history = getQuizHistory();

    if (!summary || !historyList) return;

    if (!history.length) {
        summary.innerHTML = `<p>No essay submissions yet. Take a quiz to save your first response.</p>`;
        historyList.innerHTML = "";
        return;
    }

    summary.innerHTML = `<p>You have ${history.length} saved quiz submission${history.length === 1 ? "" : "s"}.</p>`;
    historyList.innerHTML = history.map(entry => {
        const date = new Date(entry.date).toLocaleString();
        return `
            <article class="essay-item card">
                <div class="essay-meta">
                    <span><strong>${date}</strong></span>
                    <span>Score: ${entry.score}%</span>
                    <span>Status: ${entry.passed ? "Passed" : "Review"}</span>
                </div>
                <p>${entry.essay.replace(/\n/g, "<br>")}</p>
            </article>
        `;
    }).join("");
}

function updateProgress() {
    const usernameDisplay = document.getElementById("usernameDisplay");
    if (usernameDisplay) {
        usernameDisplay.textContent = localStorage.getItem("username") || "Learner";
    }

    Object.keys(courseDetails).forEach(courseId => {
        const progress = getCourseProgress(courseId);
        const course = courseDetails[courseId];
        const textElement = document.getElementById(`${courseId}Progress`);
        const fillElement = document.getElementById(`fill-${courseId}`);

        if (textElement) {
            textElement.textContent = `${progress} / ${course.modules}`;
        }
        if (fillElement) {
            fillElement.style.width = `${Math.min((progress / course.modules) * 100, 100)}%`;
        }
    });

    const completedModules = Object.keys(courseDetails).reduce((total, courseId) => {
        return total + Math.min(getCourseProgress(courseId), courseDetails[courseId].modules);
    }, 0);
    const totalModules = Object.values(courseDetails).reduce((total, course) => total + course.modules, 0);
    const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const overallPercent = document.getElementById("overallPercent");
    const overallFill = document.getElementById("overallFill");
    const progressNote = document.getElementById("progressNote");

    if (overallPercent) {
        overallPercent.textContent = `${percent}%`;
    }
    if (overallFill) {
        overallFill.style.width = `${percent}%`;
    }
    if (progressNote) {
        progressNote.textContent = completedModules > 0 ? `You're currently working through ${completedModules} of ${totalModules} modules.` : "Complete modules and quizzes to improve your mastery score.";
    }

    const metrics = getQuizMetrics();
    const quizCount = document.getElementById("quizCount");
    const quizAverage = document.getElementById("quizAverage");
    const essayCount = document.getElementById("essayCount");
    const latestStoredScore = document.getElementById("latestStoredScore");

    if (quizCount) quizCount.textContent = metrics.count;
    if (quizAverage) quizAverage.textContent = `${metrics.average}%`;
    if (essayCount) essayCount.textContent = metrics.essays;
    if (latestStoredScore) {
        latestStoredScore.textContent = metrics.latest !== null ? `${metrics.latest}%` : "N/A";
    }

    const latestQuizScore = localStorage.getItem("latestQuizScore");
    if (latestQuizScore && progressNote) {
        progressNote.textContent += ` Your latest quiz score is ${latestQuizScore}%.`;
    }
}

function protectPage() {
    if (!isPublicPage() && localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "/login";
    }
}

window.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    protectPage();
    updateProgress();
    initPageTransitions();

    const courseSummary = document.getElementById("courseSummary");
    if (courseSummary) {
        courseSummary.innerHTML = `
            <h2>Course summary</h2>
            <p>Select a course card to review progress, or complete a module to see your dashboard improve.</p>
        `;
    }

    const essayHistoryList = document.getElementById("essayHistoryList");
    if (essayHistoryList) {
        renderEssayHistory();
    }
});
