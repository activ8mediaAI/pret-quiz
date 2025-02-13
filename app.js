// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}

// Questions from the document
const questions = [
    {
        question: "Which iconic London landmark houses the Big Ben bell?",
        options: ["Tower of London", "Buckingham Palace", "Houses of Parliament", "Westminster Abbey"],
        correct: 2,
        audio: "audio/london-Q1.wav"
    },
    {
        question: "What is the name of London's famous underground train system?",
        options: ["The Subway", "The Tube", "The Metro", "The Underground Express"],
        correct: 1,
        audio: "audio/london-Q2.wav"
    },
    {
        question: "Which London street is famous for its luxury shopping?",
        options: ["Bond Street", "Abbey Road", "Oxford Street", "Camden Market"],
        correct: 0,
        audio: "audio/london-Q3.wav"
    },
    {
        question: "What colour are traditional London phone booths?",
        options: ["Blue", "Red", "Green", "Yellow"],
        correct: 1,
        audio: "audio/london-Q4.wav"
    },
    {
        question: "What famous river runs through London?",
        options: ["The Seine", "The Thames", "The Danube", "The Mersey"],
        correct: 1,
        audio: "audio/london-Q5.wav"
    },
    {
        question: "How long does Pret keep its sandwiches before making fresh ones?",
        options: ["1 day", "2 days", "They don't---they make fresh ones every day!", "A week"],
        correct: 2,
        audio: "audio/pret-Q1.wav"
    },
    {
        question: "Which type of chocolate gives Pret's hot chocolate that deliciously smooth and indulgent taste?",
        options: ["Swiss Chocolate", "Belgian Chocolate", "French Chocolate", "Italian Chocolate"],
        correct: 1,
        audio: "audio/pret-Q2.wav"
    },
    {
        question: "What type of coffee beans does Pret use for its rich, smooth brews?",
        options: ["Robusta Beans", "Liberica Beans", "Arabica Beans", "Espresso Beans"],
        correct: 2,
        audio: "audio/pret-Q3.wav"
    },
    {
        question: "Where does Pret A Manger prepare its fresh food every day?",
        options: ["In a central factory", "In kitchens inside every Pret shop", "In a secret underground kitchen", "It's delivered frozen and heated up"],
        correct: 1,
        audio: "audio/pret-Q4.wav"
    },
    {
        question: "How are the leafy greens used in Pret's salads and sandwiches grown?",
        options: ["In underground farms", "Using hydroponics -- grown in water, not soil!", "Picked fresh from Pret's rooftop garden", "Imported from tropical rainforests"],
        correct: 1,
        audio: "audio/pret-Q5.wav"
    }
];

let timer;
const QR_URL = "https://your-landing-page-url.com";
let currentQuestion;
let usedQuestions = [];
let currentAudio = null;

function showPage(pageId) {
    ['homePage', 'quizPage', 'thankYouPage'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function getRandomQuestion() {
    if (usedQuestions.length === questions.length) {
        usedQuestions = [];
    }
    let availableQuestions = questions.filter(q => !usedQuestions.includes(q));
    let randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.push(randomQuestion);
    return randomQuestion;
}

function startQuiz() {
    currentQuestion = questions.indexOf(getRandomQuestion());
    showPage('quizPage');
    displayQuestion();
    startTimer();
}

function playQuestionAudio(audioFile) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    currentAudio = new Audio(audioFile);
    currentAudio.play().catch(error => console.log('Audio playback failed:', error));
}

function displayQuestion() {
    const question = questions[currentQuestion];
    document.getElementById('question').textContent = question.question;
    playQuestionAudio(question.audio);
    
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'button quiz-option';
        button.textContent = option;
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });
}

function startTimer() {
    let timeLeft = 30;
    clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time remaining: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            showThankYou(false);
        }
    }, 1000);
}

function checkAnswer(selectedIndex) {
    clearInterval(timer);
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    const correct = questions[currentQuestion].correct === selectedIndex;
    showThankYou(correct);
}

function showThankYou(isWinner) {
    showPage('thankYouPage');
    const resultMessage = document.getElementById('resultMessage');
    
    if (isWinner) {
        resultMessage.textContent = "Congratulations! You've won!";
        new QRCode(document.getElementById("qrCode"), {
            text: QR_URL,
            width: 128,
            height: 128
        });
    } else {
        resultMessage.textContent = "Better luck next time!";
        document.getElementById("qrCode").innerHTML = '';
    }

    setTimeout(() => {
        showPage('homePage');
        document.getElementById("qrCode").innerHTML = '';
        document.getElementById('resultMessage').textContent = '';
    }, 20000);
}

// Add this function to app.js
function returnHome() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    showPage('homePage');
    document.getElementById("qrCode").innerHTML = '';
    document.getElementById('resultMessage').textContent = '';
}

// Initial setup
window.onload = function() {
    showPage('homePage');
};