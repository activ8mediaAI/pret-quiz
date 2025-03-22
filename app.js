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
        correct: 1,
        audio: "audio/london-Q3.wav"
    },
    {
        question: "How do you pronounce Pret A Manger?",
        options: ["Pret A Manager", "Pret A Manger", "Pret A Monj-eh", "I don't know, you figure it out!"],
        correct: 2,
        audio: "audio/london-Qnew.wav"
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
let autoReturnTimer;
const QR_URL = "https://your-landing-page-url.com";
let currentQuestionIndex = 0;
let correctAnswers = 0;
let currentAudio = null;
let currentUser = {
    name: "",
    mobile: ""
};
let isQuizInProgress = false;
const TOTAL_QUESTIONS = 10;
const WINNING_SCORE = 5;

// Function to handle user data storage
function saveUserData(name, mobile, won) {
    const userData = {
        name: name,
        mobile: mobile,
        date: new Date().toISOString(),
        won: won
    };
    
    // Get existing data from localStorage
    let existingData = JSON.parse(localStorage.getItem('pretQuizUsers')) || [];
    
    // Add new data
    existingData.push(userData);
    
    // Save back to localStorage
    localStorage.setItem('pretQuizUsers', JSON.stringify(existingData));
}

// Function to get and increment counter for winners
function getNextCounterNumber() {
    // Get current counter from localStorage
    let counter = parseInt(localStorage.getItem('winnerCounter') || '0');
    
    // Increment the counter
    counter++;
    
    // Save the new counter value
    localStorage.setItem('winnerCounter', counter.toString());
    
    // Format to 3 digits with leading zeros
    return counter.toString().padStart(3, '0');
}

// Function to validate the form
function validateAndStart() {
    // Clear any existing timers first
    clearAllTimers();
    
    const nameInput = document.getElementById('userName');
    const mobileInput = document.getElementById('userMobile');
    const nameError = document.getElementById('nameError');
    const mobileError = document.getElementById('mobileError');
    
    // Reset errors
    nameError.textContent = '';
    mobileError.textContent = '';
    
    let isValid = true;
    
    // Validate name
    if (!nameInput.value.trim()) {
        nameError.textContent = 'Please enter your name';
        isValid = false;
    }
    
    // Validate mobile (simple validation)
    if (!mobileInput.value.trim()) {
        mobileError.textContent = 'Please enter your mobile number';
        isValid = false;
    } else if (!/^\d{10,15}$/.test(mobileInput.value.replace(/\s+/g, ''))) {
        mobileError.textContent = 'Please enter a valid mobile number';
        isValid = false;
    }
    
    if (isValid) {
        // Store user data
        currentUser.name = nameInput.value.trim();
        currentUser.mobile = mobileInput.value.trim();
        
        // Start the quiz
        startQuiz();
    }
}

function clearAllTimers() {
    // Clear any existing timers
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    if (autoReturnTimer) {
        clearTimeout(autoReturnTimer);
        autoReturnTimer = null;
    }
}

function showPage(pageId) {
    ['homePage', 'quizPage', 'thankYouPage', 'adminPage'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function startQuiz() {
    clearAllTimers();
    isQuizInProgress = true;
    
    // Reset quiz state
    currentQuestionIndex = 0;
    correctAnswers = 0;
    
    // Shuffle questions array to randomize order
    shuffleQuestions();
    
    // Show the quiz page
    showPage('quizPage');
    
    // Display the first question and start the timer
    displayQuestion();
    startTimer();
}

function shuffleQuestions() {
    // Fisher-Yates shuffle algorithm
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
}

function playQuestionAudio(audioFile) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Create new audio instance
    currentAudio = new Audio(audioFile);
    
    // Add error handling
    currentAudio.addEventListener('error', function(e) {
        console.log('Audio error:', e);
    });
    
    // Play audio with error catching
    currentAudio.play().catch(error => {
        console.log('Audio playback failed:', error);
    });
}

function displayQuestion() {
    if (!isQuizInProgress) return;
    
    // Update question counter
    const questionNumber = document.getElementById('question');
    questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${TOTAL_QUESTIONS}: ${questions[currentQuestionIndex].question}`;
    
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    questions[currentQuestionIndex].options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'button quiz-option';
        button.textContent = option;
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });
    
    // Play audio after DOM is updated
    setTimeout(() => {
        if (isQuizInProgress) {
            playQuestionAudio(questions[currentQuestionIndex].audio);
        }
    }, 100);
}

function startTimer() {
    let timeLeft = 30;
    clearInterval(timer);
    
    document.getElementById('timer').textContent = `Time remaining: ${timeLeft}s`;
    
    timer = setInterval(() => {
        if (!isQuizInProgress) {
            clearInterval(timer);
            return;
        }
        
        timeLeft--;
        document.getElementById('timer').textContent = `Time remaining: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            // Time's up for this question - move to the next
            moveToNextQuestion(false);
        }
    }, 1000);
}

function checkAnswer(selectedIndex) {
    if (!isQuizInProgress) return;
    
    clearInterval(timer);
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    const correct = questions[currentQuestionIndex].correct === selectedIndex;
    if (correct) {
        correctAnswers++;
    }
    
    moveToNextQuestion(true);
}

function moveToNextQuestion(answered) {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
        // All questions answered, show results
        showThankYou(correctAnswers >= WINNING_SCORE);
    } else {
        // Display next question and restart timer
        displayQuestion();
        startTimer();
    }
}

function showThankYou(isWinner) {
    clearAllTimers();
    isQuizInProgress = false;
    
    showPage('thankYouPage');
    const resultMessage = document.getElementById('resultMessage');
    
    if (isWinner) {
        // Get next counter number
        const counterNumber = getNextCounterNumber();
        
        // Create counter element if it doesn't exist
        let counterElement = document.getElementById('winnerCounter');
        if (!counterElement) {
            counterElement = document.createElement('div');
            counterElement.id = 'winnerCounter';
            counterElement.className = 'winner-counter';
            // Append to container instead of thankYouPage to position at top
            document.querySelector('.container').appendChild(counterElement);
        }
        
        // Set counter text
        counterElement.textContent = counterNumber;
        
        resultMessage.textContent = `Congratulations, ${currentUser.name}!\nYou got ${correctAnswers} out of ${TOTAL_QUESTIONS} correct and won!`;
        
        // Show pastry image instead of QR code
        const pastryContainer = document.getElementById("pastryImage");
        pastryContainer.innerHTML = '<img src="pastry-image.png" alt="Pret Pastry" class="pastry-img">';
    } else {
        // Remove counter if it exists
        const counterElement = document.getElementById('winnerCounter');
        if (counterElement) {
            counterElement.remove();
        }
        
        resultMessage.textContent = `Better luck next time, ${currentUser.name}! You got ${correctAnswers} out of ${TOTAL_QUESTIONS} correct.`;
        
        // Show pastry image for non-winners too
        // const pastryContainer = document.getElementById("pastryImage");
        // pastryContainer.innerHTML = '<img src="pastry-image.png" alt="Pret Pastry" class="pastry-img">';
    }
    
    // Save user data with result
    saveUserData(currentUser.name, currentUser.mobile, isWinner);
    
    // Show home button
    document.querySelector('#thankYouPage .home-button').classList.remove('hidden');
    
    // Make sure the terms and conditions are visible
    document.querySelector('.terms-conditions').classList.remove('hidden');
    
    // Set auto-return timer
    // autoReturnTimer = setTimeout(() => {
     //   returnHome();
    //}, 20000);
}

function returnHome() {
    clearAllTimers();
    isQuizInProgress = false;
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    showPage('homePage');
    document.getElementById("pastryImage").innerHTML = '';
    document.getElementById('resultMessage').textContent = '';
    
    // Reset form
    document.getElementById('userName').value = '';
    document.getElementById('userMobile').value = '';
    
    // Hide terms and conditions when returning to home
    const termsElement = document.querySelector('.terms-conditions');
    if (termsElement) {
        termsElement.classList.add('hidden');
    }
}

// Admin functions
function showAdminPage() {
    clearAllTimers();
    isQuizInProgress = false;
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    showPage('adminPage');
    populateUserData();
}

function populateUserData() {
    const userDataBody = document.getElementById('userDataBody');
    userDataBody.innerHTML = '';
    
    const userData = JSON.parse(localStorage.getItem('pretQuizUsers')) || [];
    
    userData.forEach(user => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name;
        row.appendChild(nameCell);
        
        const mobileCell = document.createElement('td');
        mobileCell.textContent = user.mobile;
        row.appendChild(mobileCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(user.date).toLocaleString();
        row.appendChild(dateCell);
        
        const wonCell = document.createElement('td');
        wonCell.textContent = user.won ? 'Yes' : 'No';
        row.appendChild(wonCell);
        
        userDataBody.appendChild(row);
    });
}

function exportData() {
    const userData = JSON.parse(localStorage.getItem('pretQuizUsers')) || [];
    
    // Convert to CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Mobile,Date,Won\n";
    
    userData.forEach(user => {
        csvContent += `${user.name},${user.mobile},${new Date(user.date).toLocaleString()},${user.won ? 'Yes' : 'No'}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pret_quiz_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Secret admin access
// Add a hidden trick to access admin page: triple click on the logo
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.logo');
    let clickCount = 0;
    let clickTimer;
    
    logo.addEventListener('click', function() {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 800);
        }
        
        if (clickCount === 3) {
            clearTimeout(clickTimer);
            clickCount = 0;
            showAdminPage();
        }
    });
    
    // Initially hide the terms and conditions
    const termsElement = document.querySelector('.terms-conditions');
    if (termsElement) {
        termsElement.classList.add('hidden');
    }
});

// Initial setup
window.onload = function() {
    clearAllTimers();
    isQuizInProgress = false;
    showPage('homePage');
    
    // Initially hide the terms and conditions
    const termsElement = document.querySelector('.terms-conditions');
    if (termsElement) {
        termsElement.classList.add('hidden');
    }
};

// Add event listener for visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isQuizInProgress) {
        // If page is hidden during quiz, handle it gracefully
        clearInterval(timer);
    } else if (!document.hidden && isQuizInProgress) {
        // If page becomes visible again and quiz was in progress, restart timer
        startTimer();
    }
});