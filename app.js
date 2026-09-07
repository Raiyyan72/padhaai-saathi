// Elements

// if(localStorage.getItem("isLoggedIn") !== "true"){

//     window.location.href = "login.html";

// }


// Check Login

// const isLoggedIn = localStorage.getItem("isLoggedIn");

// if (isLoggedIn !== "true") {

//     window.location.href = "login.html";

// }





const input = document.getElementById("serchbar");
const sendBtn = document.querySelector(".send-btn");
const chatBox = document.querySelector(".chat-box");
const chatContainer = document.querySelector(".chat-container");
let currentMode = "home";

// ===============================
// Gemini API Key
// ===============================


// Available models try karne ke liye sirf ye line change karni hogi
const MODEL = "gemini-flash-latest";



// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const message = input.value.trim();
    const file = getSelectedFile();

    // Text aur file dono nahi hain
    if (message === "" && !file) return;

    console.log("🚀 Sending message...");

    // User message show karo
    if (message) {
        addUserMessage(message);
    }

    // File attached hai to filename show karo
    if (file) {
        addUserMessage(`📎 ${file.name}`);
    }

    input.value = "";

    showTyping();


    // Custom answer sirf normal text ke liye
    if (!file && message) {

        const customReply = getCustomAnswer(message);

        if (customReply) {

            hideTyping();

            addAiMessage(customReply);

            return;
        }
    }


    // AI response
    const reply = await getAIResponse(
        message,
        currentMode
    );

    hideTyping();


    // Response show karo
    if (currentMode === "quiz") {

        renderQuiz(reply);

    } else {

        addAiMessage(reply);
    }


    // 📎 File clear + Attach button wapas
    clearSelectedFile();

    console.log("🧹 File cleared after sending");
}



// ==========================================
// CLEAR SELECTED FILE
// ==========================================

function clearSelectedFile() {

    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    if (filePreview) {
        filePreview.innerHTML = "";
        filePreview.classList.remove("show");
    }

    // ✅ Attach button dubara show hoga
    if (attachBtn) {
        attachBtn.style.display = "";
    }

    console.log("🧹 File cleared");
}






// render Quize function 
function renderQuiz(reply) {

  try {

    let cleanReply = reply
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const quizData = JSON.parse(cleanReply);

    if (
      !quizData.questions ||
      quizData.questions.length !== 10
    ) {
      throw new Error("Invalid quiz format");
    }

    chatContainer.innerHTML = "";

    let score = 0;
    let answered = 0;


    // ==========================================
    // QUIZ HEADER
    // ==========================================

    const quizHeader = document.createElement("div");

    quizHeader.classList.add("ai-message");

    quizHeader.innerHTML = `

      <div class="quiz-header">

        <div>
          <h3>🧠 AI Generated Quiz</h3>

          <p>
            Answer all 10 questions and check your score.
          </p>
        </div>

        <button
          id="saveQuizBtn"
          class="save-library-btn"
        >
          💾 Save Quiz
        </button>

      </div>

    `;

    chatContainer.appendChild(quizHeader);


    // ==========================================
    // SAVE QUIZ
    // ==========================================

    const saveQuizBtn =
      quizHeader.querySelector("#saveQuizBtn");


    saveQuizBtn.addEventListener(
      "click",
      async () => {

        const token =
          localStorage.getItem("token");


        if (!token) {

          alert("❌ Please login first.");

          return;

        }


        // Already saved

        if (
          saveQuizBtn.dataset.saved === "true"
        ) {

          return;

        }


        try {

          saveQuizBtn.disabled = true;

          saveQuizBtn.innerHTML =
            "⏳ Saving...";


          const response =
            await fetch(
              "https://padhaai-saathi.onrender.com/api/library",
              {

                method: "POST",

                headers: {

                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${token}`

                },

                body: JSON.stringify({

                  title:
                    "🧠 Quiz - " +
                    new Date().toLocaleDateString(),

                  content:
                    JSON.stringify(
                      quizData
                    ),

                  type: "quiz"

                })

              }
            );


          const data =
            await response.json();


          console.log(
            "📚 Quiz Save:",
            data
          );


          if (!response.ok) {

            saveQuizBtn.disabled =
              false;

            saveQuizBtn.innerHTML =
              "💾 Save Quiz";


            alert(
              "❌ " +
              (
                data.message ||
                "Unable to save quiz"
              )
            );

            return;

          }


          saveQuizBtn.dataset.saved =
            "true";


          saveQuizBtn.innerHTML =
            "✅ Quiz Saved";


          alert(
            "✅ Quiz saved to My Library!"
          );


        } catch (error) {

          console.error(
            "❌ Quiz Save Error:",
            error
          );


          saveQuizBtn.disabled =
            false;

          saveQuizBtn.innerHTML =
            "💾 Save Quiz";


          alert(
            "❌ Unable to connect with server."
          );

        }

      }
    );


    // ==========================================
    // QUESTIONS
    // ==========================================

    quizData.questions.forEach(
      (q, index) => {

        const quizDiv =
          document.createElement("div");

        quizDiv.classList.add(
          "ai-message"
        );


        quizDiv.innerHTML = `

          <b>🧠 Question ${index + 1}</b>

          <p>${q.question}</p>

          <div class="quiz-options">

            ${q.options.map(
              (option, optionIndex) => `

              <button
                class="quiz-option"
                data-correct="${
                  optionIndex === q.answer
                }"
              >
                ${option}
              </button>

            `
            ).join("")}

          </div>

        `;


        chatContainer.appendChild(
          quizDiv
        );


        // ==========================================
        // OPTIONS
        // ==========================================

        const options =
          quizDiv.querySelectorAll(
            ".quiz-option"
          );


        options.forEach(
          (button) => {

            button.addEventListener(
              "click",
              () => {

                // Already answered

                if (
                  quizDiv.classList.contains(
                    "answered"
                  )
                ) {

                  return;

                }


                quizDiv.classList.add(
                  "answered"
                );


                answered++;


                const isCorrect =
                  button.dataset.correct ===
                  "true";


                if (isCorrect) {

                  score++;

                  button.classList.add(
                    "correct"
                  );

                } else {

                  button.classList.add(
                    "wrong"
                  );


                  // Correct answer highlight

                  options.forEach(
                    (option) => {

                      if (
                        option.dataset
                          .correct === "true"
                      ) {

                        option.classList.add(
                          "correct"
                        );

                      }

                    }
                  );

                }


                // Disable all options

                options.forEach(
                  (option) => {

                    option.disabled =
                      true;

                  }
                );


                // All questions answered

                if (
                  answered ===
                  quizData.questions.length
                ) {

                  showQuizResult(
                    score
                  );

                }

              }
            );

          }
        );

      }
    );


    scrollBottom();


  } catch (error) {

    console.error(
      "❌ Quiz Render Error:",
      error
    );

    console.log(
      "AI Reply:",
      reply
    );


    addAiMessage(
      "❌ Quiz generate nahi ho paya. Please dobara try karo."
    );

  }

}


//  render score

function showQuizResult(score) {

  const result = document.createElement("div");

  result.classList.add("quiz-result");

  result.innerHTML = `

    <h2>🎉 Quiz Completed!</h2>

    <p>Your Score</p>

    <strong>${score} / 10</strong>

    <button id="retryQuiz">
      🔄 Try Again
    </button>

  `;

  chatContainer.appendChild(result);

  scrollBottom();

}


// ===============================
// User Message
// ===============================

function addUserMessage(message) {
  const userDiv = document.createElement("div");

  userDiv.classList.add("user-message");

  userDiv.innerHTML = `
        👤 <b>You</b>
        <p>${message}</p>
    `;

  chatContainer.appendChild(userDiv);

  scrollBottom();
  hideHero();
}

// ===============================
// AI Message
// ===============================
function addAiMessage(message, showSaveButton = true) {

  const aiDiv = document.createElement("div");

  aiDiv.classList.add("ai-message");

  aiDiv.innerHTML = `
    
    <div class="ai-message-header">
      🤖 <b>Padhaai Saathi</b>
    </div>

    <p>${message}</p>

    ${
      showSaveButton
        ? `
          <button class="save-library-btn">
            ⭐ Save to Library
          </button>
        `
        : ""
    }

  `;

  chatContainer.appendChild(aiDiv);


  // Save button exist karta hai tabhi event lagao
  const saveBtn = aiDiv.querySelector(".save-library-btn");

  if (saveBtn) {

    saveBtn.addEventListener("click", async () => {

      const token = localStorage.getItem("token");

      if (!token) {
        alert("❌ Please login first.");
        return;
      }

      let type = "note";

      if (currentMode === "quiz") {
        type = "quiz";
      }

      if (currentMode === "planner") {
        type = "note";
      }

      try {

        saveBtn.disabled = true;
        saveBtn.innerText = "⏳ Saving...";

        const response = await fetch(
          "https://padhaai-saathi.onrender.com/api/library",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({

              title:
                currentMode === "quiz"
                  ? "AI Generated Quiz"
                  : "AI Study Material",

              content: message,

              type: type

            })
          }
        );

        const data = await response.json();

        console.log("📚 Library Save:", data);

        if (!response.ok) {

          alert(
            "❌ " +
            (data.message || "Unable to save")
          );

          saveBtn.disabled = false;
          saveBtn.innerText = "⭐ Save to Library";

          return;
        }

        saveBtn.innerText = "✅ Saved";
        saveBtn.classList.add("saved");

      } catch (error) {

        console.error(
          "❌ Library Save Error:",
          error
        );

        alert("❌ Unable to save to library.");

        saveBtn.disabled = false;
        saveBtn.innerText = "⭐ Save to Library";
      }

    });

  }

  scrollBottom();
}

// Typing Show
// ===============================

function showTyping() {
  hideTyping();

  const typing = document.createElement("div");

  typing.classList.add("ai-message");

  typing.id = "typing";

  typing.innerHTML = `
        🤖 <b>Padhaai Saathi</b>
        <p>Typing...</p>
    `;

  chatContainer.appendChild(typing);

  scrollBottom();
}

// ===============================
// Typing Hide
// ===============================

function hideTyping() {
  const typing = document.getElementById("typing");

  if (typing) {
    typing.remove();
  }
}

// ===============================
// Scroll
// ===============================

function scrollBottom() {
  setTimeout(() => {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,

      behavior: "smooth",
    });
  }, 50);
}


// Gemini API


// AI Response - Backend




async function getAIResponse(message, mode) {
  try {
    console.log("🔥 MODE SENT:", mode);

    const token = localStorage.getItem("token");

    if (!token) {
      return "❌ Please login first.";
    }

    // 📎 Selected file
    const file = getSelectedFile();

    if (file) {
      console.log("📤 Sending file:", file.name);
      console.log("📦 File type:", file.type);
      console.log("📏 File size:", file.size);
    }

    // FormData
    const formData = new FormData();

    formData.append("message", message);
    formData.append("mode", mode);

    // 📎 File attach karo
    if (file) {
      formData.append("file", file);
    }

    const response = await fetch(
      "https://padhaai-saathi.onrender.com/api/chat",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      }
    );

    const data = await response.json();

    console.log("Chat Status:", response.status);
    console.log("Chat Response:", data);

    if (!response.ok) {
      return "❌ " + (
        data.message ||
        data.error ||
        "Chat API Error"
      );
    }

    if (data.chat && data.chat.response) {
      return data.chat.response;
    }

    if (data.message) {
      return data.message;
    }

    return "❌ No response from AI.";

  } catch (error) {
    console.error("❌ Chat Error:", error);

    return "❌ Unable to connect with server.";
  }
}
function buildPrompt(message, mode) {

    // ⚙️ User Settings
    const preferencePrompt = getAIPreferencePrompt();


    // 🧠 QUIZ MODE
    if (mode === "quiz") {

        return `
You are an AI Quiz Generator.

USER PREFERENCES:
${preferencePrompt}

Create exactly 10 multiple-choice questions about:

${message}

Return ONLY valid JSON.

Use this exact format:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0
    }
  ]
}

Rules:

- Exactly 10 questions
- Exactly 4 options per question
- answer must be 0, 1, 2, or 3
- Only one correct answer
- No explanations
- No markdown
- No code block
- No extra text
`;
    }


    // 📝 NOTES MODE
    if (mode === "notes") {

        return `
You are an AI Study Assistant.

USER PREFERENCES:
${preferencePrompt}

Prepare clear and useful study notes.

Topic:

${message}

Use:

- Clear headings
- Bullet points
- Important concepts
- Examples where useful
- Easy-to-understand explanations

Follow the user's response style, study level and explanation preference.
`;
    }


    // 📅 PLANNER MODE
    if (mode === "planner") {

        return `
You are an AI Study Planner.

USER PREFERENCES:
${preferencePrompt}

Create a practical study plan.

Goal:

${message}

Include:

- Topics
- Daily tasks
- Revision
- Practice
- Recommended study order

Make the plan realistic for the student's level.
`;
    }


    // 💬 NORMAL CHAT
    return `
You are Padhaai Saathi, an AI study assistant.

USER PREFERENCES:
${preferencePrompt}

User's question:

${message}

Answer the user's question according to their selected preferences.
`;
}

// ===============================
// Events
// ===============================

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function getCustomAnswer(message) {
  const msg = message.toLowerCase().trim();

  // Creator / Developer Questions
  if (
    msg.includes("who made you") ||
    msg.includes("who created you") ||
    msg.includes("who developed you") ||
    msg.includes("who built you") ||
    msg.includes("who is your developer") ||
    msg.includes("who is your creator") ||
    msg.includes("your developer") ||
    msg.includes("your creator") ||
    msg.includes("developer") ||
    msg.includes("creator") ||
    msg.includes("owner") ||
    msg.includes("founder") ||
    msg.includes("kisne banaya") ||
    msg.includes("kisne bnaya") ||
    msg.includes("tumhe kisne banaya") ||
    msg.includes("tumhe kisne bnaya") ||
    msg.includes("aapko kisne banaya") ||
    msg.includes("kisne develop kiya") ||
    msg.includes("kisne create kiya") ||
    msg.includes("kisne banaya hai") ||
    msg.includes("kon banaya") ||
    msg.includes("kaun banaya") ||
    msg.includes("kaun hai tumhara developer") ||
    msg.includes("tumhara developer") ||
    msg.includes("tumhara creator") ||
    msg.includes("tumhara owner") ||
    msg.includes("who owns you") ||
    msg.includes("who designed you") ||
    msg.includes("who coded you") ||
    msg.includes("who programmed you") ||
    msg.includes("made by") ||
    msg.includes("created by") ||
    msg.includes("developed by") ||
    msg.includes("who have develope you")
  ) {
    return `👨‍💻 I am developed by <b>Raiyyan Khan</b> using Google's Gemini API. ❤️`;
  }

  // Name
  if (
    msg.includes("your name") ||
    msg.includes("what is your name") ||
    msg.includes("tumhara naam") ||
    msg.includes("aapka naam") ||
    msg.includes("name")
  ) {
    return "🤖 My name is <b>Padhaai Saathi</b>.";
  }

  return null;
}
// ==========================================
// THEME TOGGLE
// ==========================================

const themeBtn = document.querySelector(".theme-btn");


// Load saved theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {

    document.body.classList.add("light-mode");

    if (themeBtn) {
        themeBtn.innerHTML = "☀️";
    }

} else {

    document.body.classList.remove("light-mode");

    if (themeBtn) {
        themeBtn.innerHTML = "🌙";
    }
}


// Theme button
if (themeBtn) {

    themeBtn.addEventListener("click", toggleTheme);

}


// Toggle theme
function toggleTheme() {

    document.body.classList.toggle("light-mode");


    const isLight =
        document.body.classList.contains("light-mode");


    if (isLight) {

        themeBtn.innerHTML = "☀️";

        localStorage.setItem(
            "theme",
            "light"
        );

    } else {

        themeBtn.innerHTML = "🌙";

        localStorage.setItem(
            "theme",
            "dark"
        );

    }

}


// VOICE INPUT / MICROPHONE


// const micBtn = document.querySelector(".mic-btn");

// let recognition = null;
// let isListening = false;


// // ======================================================
// // BROWSER SUPPORT CHECK
// // ======================================================

// if (
//     "SpeechRecognition" in window ||
//     "webkitSpeechRecognition" in window
// ) {

//     const SpeechRecognition =
//         window.SpeechRecognition ||
//         window.webkitSpeechRecognition;

//     recognition = new SpeechRecognition();


//     // ==================================================
//     // SPEECH SETTINGS
//     // ==================================================

//     recognition.lang = "en-IN";

//     recognition.interimResults = false;

//     recognition.continuous = false;


// 🎤 VOICE INPUT / SPEECH RECOGNITION
// ======================================================

const micBtn = document.querySelector(".mic-btn");

let recognition = null;
let isListening = false;


// ======================================================
// 🌐 BROWSER SUPPORT CHECK
// ======================================================

if (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    recognition = new SpeechRecognition();


    // ==================================================
    // 🎙️ SPEECH SETTINGS
    // ==================================================

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;


    // ==================================================
    // 🎤 MIC BUTTON CLICK
    // ==================================================

    if (micBtn) {

        micBtn.addEventListener("click", () => {

            console.log("🎤 Mic clicked");


            // Already listening → STOP
            if (isListening) {

                console.log("🛑 Stopping mic...");

                recognition.stop();

                return;
            }


            // START LISTENING
            try {

                recognition.start();

            } catch (error) {

                console.error(
                    "❌ Mic start error:",
                    error
                );

            }

        });

    } else {

        console.error(
            "❌ .mic-btn nahi mila! HTML me class='mic-btn' check karo."
        );

    }


    // ==================================================
    // 🎙️ SPEECH START
    // ==================================================

    recognition.onstart = () => {

        isListening = true;

        console.log("🎙️ Listening...");


        // Wave animation start
        if (micBtn) {

            micBtn.classList.add("recording");

        }

    };


    // ==================================================
    // 🗣️ SPEECH RESULT
    // ==================================================
recognition.onresult = (event) => {

    const text = event.results[0][0].transcript;

    console.log("🗣️ Voice text:", text);

    if (typeof input !== "undefined" && input) {

        input.value = text;

        // Placeholder automatically hide ho jayega
        console.log("✍️ Voice text input me aa gaya");

    }
};

    // ==================================================
    // ❌ SPEECH ERROR
    // ==================================================

    recognition.onerror = (event) => {

        console.error(
            "🎤 Speech error:",
            event.error
        );

        isListening = false;


        // Wave animation remove
        if (micBtn) {

            micBtn.classList.remove("recording");

        }


        // Permission error
        if (event.error === "not-allowed") {

            console.log(
                "⚠️ Microphone permission denied."
            );

        }


        // No speech
        else if (event.error === "no-speech") {

            console.log(
                "⚠️ Koi voice detect nahi hui."
            );

        }


        // Microphone problem
        else if (event.error === "audio-capture") {

            console.log(
                "⚠️ Microphone detect nahi ho raha."
            );

        }


        // Network problem
        else if (event.error === "network") {

            console.log(
                "⚠️ Speech recognition network error."
            );

        }

    };


    // ==================================================
    // 🛑 SPEECH END
    // ==================================================

    recognition.onend = () => {

        isListening = false;

        console.log(
            "🛑 Mic stopped"
        );


        // Wave animation remove
        if (micBtn) {

            micBtn.classList.remove("recording");

        }

    };


} else {


    // ==================================================
    // ❌ BROWSER NOT SUPPORTED
    // ==================================================

    console.error(
        "❌ Speech Recognition is not supported in this browser."
    );


    if (micBtn) {

        micBtn.style.display = "none";

    }

}





const p1 = document.querySelector(".p1");

function showHero() {

    document.querySelector(".hero-cards")?.classList.remove("hide");

    document.querySelector(".p1")?.classList.remove("hide1");

    document.querySelector(".welcome")?.classList.remove("hide");

}
function hideHero() {

    document.querySelector(".hero-cards")?.classList.add("hide");

    document.querySelector(".p1")?.classList.add("hide1");

    document.querySelector(".welcome")?.classList.add("hide");

}

//home
let sidehome = document.querySelector("#home");

function Home() {

 
    currentMode = "home";

    // chatContainer.innerHTML = "";

    document.querySelector(".study-tools")?.remove();


    showHero();



  //   addAiMessage(
  //       "👋 Welcome to Padhaai Saathi! Ask me anything."
  //   );


  // document.querySelector(".hero-cards").classList.remove("hide");
  // document.querySelector(".welcome").classList.remove("hide");
}

sidehome.addEventListener("click", Home);

let aiTutor = document.querySelector("#Ai-tutor");
aiTutor.addEventListener("click", () => {

  currentMode = "tutor";
  hideHero();
  // document.querySelector(".ai-message").classList.add("hide1");

  const greetings = [
    "👋 Welcome! I'm your AI Tutor. How can I help you today?",

    "📚 Hello! Ask me anything. I'm here to make learning easy.",

    "🚀 Ready to learn? Let's start your study journey together!",

    "🤖 Hi! What topic would you like to study today?",

    "✨ Welcome back! Let's turn your doubts into knowledge.",
  ];

  const randomGreeting =
    greetings[Math.floor(Math.random() * greetings.length)];
  chatContainer.innerHTML = "";

  addAiMessage(randomGreeting , false);
});

let quiz = document.querySelector("#quize-Generator");

function quizGenerator() {

  currentMode = "quiz";
  hideHero();
  chatContainer.innerHTML = "";
  const greetings = [
    "🧠 Welcome to Quiz Generator! Enter any topic, and I'll generate a quiz for you.",
    "📚 Ready to test your knowledge? Type any topic and let's begin!",
    "🎯 Challenge yourself! Enter a subject and I'll create a smart quiz.",
    "🚀 Let's make learning fun! Tell me a topic to generate your quiz.",
    "🤖 I'm ready to prepare a personalized quiz just for you. What's your topic?",
    "📖 Want to revise quickly? Enter any topic and I'll generate MCQs instantly.",
    "💡 Practice makes perfect! Type a topic and start solving AI-generated questions.",
    "🏆 Time to check your knowledge! Enter your favorite subject and let's begin.",
    "🎓 Learning is more effective with quizzes. What topic would you like to practice?",
    "✨ Welcome! I'll generate interactive MCQs with answers and explanations. Just enter a topic.",
  ];
  const randomGreeting =
    greetings[Math.floor(Math.random() * greetings.length)];
    
  addAiMessage(randomGreeting , false);
}

quiz.addEventListener("click", quizGenerator);

let notes = document.querySelector("#notes");

notes.addEventListener("click", () => {

  currentMode = "notes";
  hideHero();
  const greetings = [
    "👋 Welcome! I'm your AI Tutor.",
    "📚 Hello! Ask me anything.",
    "🚀 Ready to learn? Let's start!",
    "🤖 Hi! What topic would you like to study today?",
  ];

  const randomGreeting =
    greetings[Math.floor(Math.random() * greetings.length)];
  chatContainer.innerHTML = "";

  addAiMessage(randomGreeting , false);
});



const studyPlaner = document.querySelector("#study-Planer");

const pomodoroURL = "https://ukhan-pomodoro.netlify.app/";


function planer() {

  currentMode = "planner";

    hideHero();

    chatContainer.innerHTML = "";

    const greetings = [
        "👋 Welcome! I'm your Study Planner Generator.",
        "📚 Hello! Let's create your study plan.",
        "🚀 Ready to achieve your goals?",
        "🤖 Tell me what you want to learn."
    ];

    const randomGreeting =
        greetings[Math.floor(Math.random() * greetings.length)];

    addAiMessage(randomGreeting , false);

    // Greeting ke baad ye button add hoga
   chatContainer.innerHTML += `
<div class="study-tools">

    <h3>🎯 Ready to Focus?</h3>

    <p>${randomGreeting}</p>

    <button id="startPomodoro">
    
        ⏱️ Click to Start Focus Session
    </button>

</div>
`;
}

studyPlaner.addEventListener("click", planer);


document.addEventListener("click", (e) => {

    if (e.target.id === "startPomodoro") {

       window.location.href = "https://ukhan-pomodoro.netlify.app/";

    }

});






// file liked
const profileBtn = document.querySelector(".profile-btn");

profileBtn.addEventListener("click", () => {

    window.location.href = "login.html";

});






const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", () => {

    const confirmLogout = confirm("Do you want to logout?");

    if (confirmLogout) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");

        window.location.href = "login.html";
    }

});




const user = JSON.parse(localStorage.getItem("user"));

if(user){

    document.getElementById("userName").textContent =
        "👋 " + user.name;

}




//chat History

// ==========================================
// CHAT HISTORY - MONGODB
// ==========================================

const chatHistoryBtn = document.getElementById("chatHistory");

// Load chat history from MongoDB
async function loadChatHistory() {

    const token = localStorage.getItem("token");

    if (!token) {
        console.log("❌ User not logged in");
        return;
    }

    try {

        const response = await fetch(
            "https://padhaai-saathi.onrender.com/api/chat/history",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("History Status:", response.status);
        console.log("History Response:", data);

        if (!response.ok) {
            console.error("❌ History Error:", data);
            return;
        }

        if (!data.chats || data.chats.length === 0) {
            alert("📭 No chat history found.");
            return;
        }

        showChatHistory(data.chats);

    } catch (error) {

        console.error("❌ History Fetch Error:", error);

    }
}
// ==========================================
// SHOW CHAT HISTORY
// ==========================================

function showChatHistory(chats) {

    // Remove old history list
    const oldHistory = document.getElementById("historyList");

    if (oldHistory) {
        oldHistory.remove();
    }

    const historyList = document.createElement("div");

    historyList.id = "historyList";

    historyList.style.marginTop = "10px";
    historyList.style.padding = "5px";


    // ==========================================
    // DELETE ALL BUTTON
    // ==========================================

    const deleteAllBtn = document.createElement("button");

    deleteAllBtn.innerHTML = "🗑️ Delete All History";

    deleteAllBtn.style.width = "100%";
    deleteAllBtn.style.padding = "8px";
    deleteAllBtn.style.marginBottom = "10px";
    deleteAllBtn.style.border = "none";
    deleteAllBtn.style.borderRadius = "8px";
    deleteAllBtn.style.cursor = "pointer";

    deleteAllBtn.addEventListener("click", () => {

        deleteChatHistory();

    });

    historyList.appendChild(deleteAllBtn);


    // ==========================================
    // CHAT ITEMS
    // ==========================================

    chats.forEach((chat) => {

        const historyItem = document.createElement("div");

        historyItem.classList.add("history-item");

        historyItem.style.padding = "10px";
        historyItem.style.marginBottom = "5px";
        historyItem.style.borderRadius = "8px";

        historyItem.style.display = "flex";
        historyItem.style.alignItems = "center";
        historyItem.style.justifyContent = "space-between";


        // ==========================================
        // CHAT TITLE
        // ==========================================

        let title = chat.message || "New Chat";

        if (title.length > 30) {

            title =
                title.substring(0, 30) + "...";

        }


        const titleDiv = document.createElement("div");

        titleDiv.innerHTML = `💬 ${title}`;

        titleDiv.style.cursor = "pointer";

        titleDiv.style.flex = "1";


        // ==========================================
        // OPEN OLD CHAT
        // ==========================================

        titleDiv.addEventListener("click", () => {

            openOldChat(chat);

        });


        // ==========================================
        // DELETE SINGLE CHAT
        // ==========================================

        const deleteBtn = document.createElement("button");

        deleteBtn.innerHTML = "🗑️";

        deleteBtn.title = "Delete chat";

        deleteBtn.style.border = "none";
        deleteBtn.style.background = "transparent";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.fontSize = "16px";


        deleteBtn.addEventListener("click", async (e) => {

            // Chat open na ho
            e.stopPropagation();

            await deleteSingleChat(chat._id);

        });


        // Add elements
        historyItem.appendChild(titleDiv);
        historyItem.appendChild(deleteBtn);

        historyList.appendChild(historyItem);

    });


    // ==========================================
    // ADD TO SIDEBAR
    // ==========================================

    chatHistoryBtn.parentElement.appendChild(historyList);

}


// ==========================================
// DELETE SINGLE CHAT
// ==========================================

async function deleteSingleChat(chatId) {

    const token = localStorage.getItem("token");

    if (!token) {

        alert("❌ Please login first.");

        return;

    }


    const confirmDelete = confirm(
        "⚠️ Do you really want to delete this chat?"
    );


    if (!confirmDelete) {

        return;

    }


    try {

        const response = await fetch(

            `https://padhaai-saathi.onrender.com/api/chat/${chatId}`,

            {

                method: "DELETE",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }

            }

        );


        const data = await response.json();


        console.log(
            "Delete Single Chat:",
            data
        );


        if (!response.ok) {

            alert(
                "❌ " +
                (data.message ||
                    "Unable to delete chat")
            );

            return;

        }


        // Remove deleted chat from sidebar
        await loadChatHistory();


    } catch (error) {

        console.error(
            "❌ Delete Single Chat Error:",
            error
        );

        alert("❌ Server error.");

    }

}

// ==========================================
// OPEN OLD CHAT
// ==========================================

function openOldChat(chat) {

    // Chat screen clear
    chatContainer.innerHTML = "";

    // Hero hide
    hideHero();

    // User message
    addUserMessage(chat.message);

    // AI response
    addAiMessage(chat.response);

}


// ==========================================
// DELETE CHAT HISTORY
// ==========================================

async function deleteChatHistory() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("❌ Please login first.");
        return;
    }

    const confirmDelete = confirm(
        "⚠️ Do you really want to delete all chat history?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
           "https://padhaai-saathi.onrender.com/api/chat/history",
            {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("Delete History:", data);

        if (!response.ok) {

            alert(
                "❌ " +
                (data.message || "Unable to delete history")
            );

            return;
        }

        alert("✅ Chat history deleted successfully.");

        // Sidebar history remove
        const historyList =
            document.getElementById("historyList");

        if (historyList) {
            historyList.remove();
        }

    } catch (error) {

        console.error(
            "❌ Delete History Error:",
            error
        );

        alert("❌ Server error.");

    }
}


// ==========================================
// CHAT HISTORY CLICK
// ==========================================

if (chatHistoryBtn) {

    chatHistoryBtn.addEventListener(
        "click",
        loadChatHistory
    );

}


// ==========================================
// OPTIONAL DELETE BUTTON
// ==========================================

// Agar future me HTML me button add karo:
//
// <button id="deleteHistory">
//     🗑 Delete History
// </button>

const deleteHistoryBtn =
    document.getElementById("deleteHistory");

if (deleteHistoryBtn) {

    deleteHistoryBtn.addEventListener(
        "click",
        deleteChatHistory
    );

}






// ==========================================
// NEW CHAT
// ==========================================

const newChatBtn = document.getElementById("newChatBtn");

if (newChatBtn) {

    newChatBtn.addEventListener("click", () => {

        // Home mode
        currentMode = "home";

        // Chat clear
        chatContainer.innerHTML = "";

        // Hero wapas show
        showHero();

        // Sidebar/history ko touch nahi karna
        console.log("🆕 New Chat Started");

    });

}




// ==========================================
// MY LIBRARY
// ==========================================

const library = document.querySelector("#library");

if (library) {

    library.addEventListener("click", async () => {

        currentMode = "library";

        // ==========================================
        // HERO HIDE
        // ==========================================

        hideHero();


        // ==========================================
        // CHAT AREA CLEAR
        // ==========================================

        chatContainer.innerHTML = "";


        // ==========================================
        // LIBRARY UI
        // ==========================================

        chatContainer.innerHTML = `

            <div class="library-container">

                <div class="library-header">

                    <div>

                        <h2>📚 My Library</h2>

                        <p class="library-subtitle">
                            Your saved study material
                        </p>

                    </div>


                </div>


                <!-- SEARCH -->

                <div class="library-search">

                    <input
                        type="text"
                        id="librarySearch"
                        placeholder="🔍 Search your library..."
                    >

                </div>


                <!-- FILTERS -->

                <div class="library-filters">

                    <button
                        class="library-filter active"
                        data-type="all"
                    >
                        All
                    </button>

                    <button
                        class="library-filter"
                        data-type="note"
                    >
                        📄 Notes
                    </button>

                    <button
                        class="library-filter"
                        data-type="quiz"
                    >
                        🧠 Quizzes
                    </button>

                    <button
                        class="library-filter"
                        data-type="study-plan"
                    >
                        📅 Study Plans
                    </button>

                </div>


                <!-- LIBRARY ITEMS -->

                <div id="libraryItems">

                    <div class="empty-library">

                        <div class="empty-icon">
                            📚
                        </div>

                        <h3>
                            Loading Library...
                        </h3>

                        <p>
                            Please wait...
                        </p>

                    </div>

                </div>

            </div>

        `;


        // ==========================================
        // LOAD FROM BACKEND
        // ==========================================

        await loadLibrary();

    });

}


// ==========================================
// LOAD LIBRARY FROM MONGODB
// ==========================================

async function loadLibrary() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        console.log(
            "❌ User not logged in"
        );

        showEmptyLibrary(
            "Please login to view your library."
        );

        return;

    }


    try {

        const response = await fetch(

"https://padhaai-saathi.onrender.com/api/library",

            {

                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }

            }

        );


        const data =
            await response.json();


        console.log(
            "📚 Library Status:",
            response.status
        );


        console.log(
            "📚 Library Response:",
            data
        );


        // ==========================================
        // BACKEND ERROR
        // ==========================================

        if (!response.ok) {

            console.error(
                "❌ Library Error:",
                data
            );


            showEmptyLibrary(
                data.message ||
                "Unable to load library."
            );

            return;

        }


        // ==========================================
        // SHOW DATA
        // ==========================================

        showLibraryItems(
            data.library || []
        );


    } catch (error) {

        console.error(
            "❌ Library Fetch Error:",
            error
        );


        showEmptyLibrary(
            "Unable to connect with server."
        );

    }

}


// ==========================================
// SHOW LIBRARY ITEMS
// ==========================================

function showLibraryItems(libraryData) {

    const libraryItems =
        document.getElementById(
            "libraryItems"
        );


    if (!libraryItems) {
        return;
    }


    // ==========================================
    // EMPTY
    // ==========================================

    if (
        !libraryData ||
        libraryData.length === 0
    ) {

        showEmptyLibrary(
            "Save notes, quizzes and study plans to access them later."
        );

        return;

    }


    // ==========================================
    // CLEAR
    // ==========================================

    libraryItems.innerHTML = "";


    // ==========================================
    // CREATE CARDS
    // ==========================================

    libraryData.forEach((item) => {

        const card =
            document.createElement("div");


        card.className =
            "library-card";


        // Type for filtering

        card.dataset.type =
            item.type || "note";


        // ==========================================
        // ICON
        // ==========================================

        let icon = "📄";


        if (item.type === "quiz") {

            icon = "🧠";

        }


        if (
            item.type === "study-plan"
        ) {

            icon = "📅";

        }


        // ==========================================
        // DATE
        // ==========================================

        let date = "";


        if (item.createdAt) {

            date =
                new Date(
                    item.createdAt
                ).toLocaleDateString();

        }


        // ==========================================
        // CARD HTML
        // ==========================================

        card.innerHTML = `

            <div class="library-card-header">

                <div>

                    <span class="library-type">

                        ${icon}

                        ${
                            item.type ||
                            "note"
                        }

                    </span>


                    <h3>

                        ${
                            escapeLibraryHTML(
                                item.title ||
                                "Untitled"
                            )
                        }

                    </h3>

                </div>


                <button

                    class="delete-library-btn"

                    data-id="${item._id}"

                    title="Delete"

                >

                    🗑️

                </button>

            </div>


            <p class="library-content">

                ${
                    escapeLibraryHTML(
                        item.content || ""
                    )
                }

            </p>


            <small>

                📅 ${date}

            </small>

        `;


        libraryItems.appendChild(card);

    });


    // ==========================================
    // DELETE BUTTONS
    // ==========================================

    document
        .querySelectorAll(
            ".delete-library-btn"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    await deleteLibraryItem(
                        button.dataset.id
                    );

                }

            );

        });


    // ==========================================
    // SEARCH
    // ==========================================

    const searchInput =
        document.getElementById(
            "librarySearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                applyLibraryFilters();

            }

        );

    }


    // ==========================================
    // FILTER BUTTONS
    // ==========================================

    document
        .querySelectorAll(
            ".library-filter"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    // Remove active

                    document
                        .querySelectorAll(
                            ".library-filter"
                        )
                        .forEach((btn) => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    // Add active

                    button.classList.add(
                        "active"
                    );


                    applyLibraryFilters();

                }

            );

        });


    // ==========================================
    // CLEAR ALL BUTTON
    // ==========================================

    const clearBtn =
        document.getElementById(
            "clearLibraryBtn"
        );


    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            clearLibrary
        );

    }

}


// ==========================================
// SEARCH + FILTER
// ==========================================

function applyLibraryFilters() {

    const searchInput =
        document.getElementById(
            "librarySearch"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const activeFilter =
        document.querySelector(
            ".library-filter.active"
        );


    const selectedType =
        activeFilter
            ? activeFilter.dataset.type
            : "all";


    const cards =
        document.querySelectorAll(
            ".library-card"
        );


    cards.forEach((card) => {

        const text =
            card.innerText
                .toLowerCase();


        const cardType =
            card.dataset.type;


        const matchesSearch =
            text.includes(search);


        const matchesType =
            selectedType === "all" ||
            cardType === selectedType;


        if (
            matchesSearch &&
            matchesType
        ) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

}


// ==========================================
// EMPTY LIBRARY
// ==========================================

function showEmptyLibrary(message) {

    const libraryItems =
        document.getElementById(
            "libraryItems"
        );


    if (!libraryItems) {
        return;
    }


    libraryItems.innerHTML = `

        <div class="empty-library">

            <div class="empty-icon">
                📚
            </div>


            <h3>
                Your Library is Empty
            </h3>


            <p>
                ${escapeLibraryHTML(message)}
            </p>

        </div>

    `;

}


// ==========================================
// DELETE SINGLE LIBRARY ITEM
// ==========================================

async function deleteLibraryItem(id) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert(
            "❌ Please login first."
        );

        return;

    }


    const confirmDelete =
        confirm(
            "⚠️ Do you really want to delete this item?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(

                `https://padhaai-saathi.onrender.com/api/library/${id}`,

                {

                    method: "DELETE",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }

            );


        const data =
            await response.json();


        console.log(
            "🗑️ Delete Library:",
            data
        );


        if (!response.ok) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Unable to delete item"
                )
            );

            return;

        }


        // Reload library

        await loadLibrary();


    } catch (error) {

        console.error(
            "❌ Delete Library Error:",
            error
        );


        alert(
            "❌ Unable to connect with server."
        );

    }

}


// ==========================================
// DELETE COMPLETE LIBRARY
// ==========================================
async function clearLibrary() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert("❌ Please login first.");

        return;

    }


    const confirmDelete =
        confirm(
            "⚠️ Do you really want to delete your entire library?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(

                "https://padhaai-saathi.onrender.com/api/library/clear",

                {

                    method: "DELETE",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }

            );


        const data =
            await response.json();


        console.log(
            "🗑️ Clear Library:",
            data
        );


        if (!response.ok) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Unable to clear library"
                )
            );

            return;

        }


        alert("✅ Library cleared successfully.");


        // Reload library

        await loadLibrary();


    } catch (error) {

        console.error(
            "❌ Clear Library Error:",
            error
        );


        alert(
            "❌ Unable to connect with server."
        );

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeLibraryHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text || "";


    return div.innerHTML;

}




document.addEventListener("DOMContentLoaded", () => {

    const progressBtn = document.getElementById("Progress");
    
    const progressPanel = document.getElementById("progressPanel");
    const backToHomeBtn = document.getElementById("backToHomeBtn");

    const chatBox = document.querySelector(".chat-box");
    const inputArea = document.querySelector(".input-area");


    // =========================
    // INITIAL STATE
    // =========================

    if (progressPanel) {
        progressPanel.style.display = "none";
    }

    if (chatBox) {
        chatBox.style.display = "";
    }

    if (inputArea) {
        inputArea.style.display = "";
    }


    // =========================
    // OPEN PROGRESS
    // =========================

    if (progressBtn) {

        progressBtn.addEventListener("click", async () => {

            if (chatBox) {
                chatBox.style.display = "none";
            }

            if (inputArea) {
                inputArea.style.display = "none";
            }

            if (progressPanel) {
                progressPanel.style.display = "block";
            }

            await loadProgress();
        });

    }


    // =========================
    // BACK TO HOME
    // =========================

    if (backToHomeBtn) {

        backToHomeBtn.addEventListener("click", () => {

            if (progressPanel) {
                progressPanel.style.display = "none";
            }

            if (chatBox) {
                chatBox.style.display = "";
            }

            if (inputArea) {
                inputArea.style.display = "";
            }

        });

    }


    // =========================
    // LOAD PROGRESS
    // =========================

    async function loadProgress() {

        const token = localStorage.getItem("token");

        if (!token) {
            console.log("❌ User token not found");
            return;
        }


        try {

            // =========================
            // PROGRESS API
            // =========================

            const progressResponse = await fetch(
                "https://padhaai-saathi.onrender.com/api/progress",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


            const progressData = await progressResponse.json();

            console.log(
                "📊 Progress Response:",
                progressData
            );


            if (!progressResponse.ok) {

                console.error(
                    "❌ Progress Error:",
                    progressData
                );

                return;
            }


            const progress = progressData.progress;

            // ==============================
// 🎯 LEARNING PROGRESS
// ==============================

// 50 questions = 100%
const learningProgress = Math.min(
    Math.round((progress.questionsAsked / 50) * 100),
    100
);

console.log(
    "🎯 LEARNING PROGRESS:",
    learningProgress + "%"
);

// Percentage text
const progressPercentage =
    document.getElementById("progressPercentage");

if (progressPercentage) {
    progressPercentage.textContent =
        learningProgress + "%";
}

// Completed text
const progressBarText =
    document.getElementById("progressBarText");

if (progressBarText) {
    progressBarText.textContent =
        learningProgress + "% Completed";
}

// Progress bar
const progressBar =
    document.getElementById("progressBar");

if (progressBar) {
    progressBar.style.width =
        learningProgress + "%";
}


            // =========================
            // UPDATE PROGRESS
            // =========================

            const totalQuestions =
                document.getElementById("totalQuestions");

            const studySessions =
                document.getElementById("studySessions");

            const currentStreak =
                document.getElementById("currentStreak");

            const studyMinutes =
                document.getElementById("studyMinutes");

            const streakDays =
                document.getElementById("streakDays");

            const summaryQuestions =
                document.getElementById("summaryQuestions");

            const summaryMinutes =
                document.getElementById("summaryMinutes");

            const summaryStreak =
                document.getElementById("summaryStreak");


            if (totalQuestions) {
                totalQuestions.textContent =
                    progress.questionsAsked || 0;
            }

            if (studySessions) {
                studySessions.textContent =
                    progress.studySessions || 0;
            }

            if (currentStreak) {
                currentStreak.textContent =
                    progress.currentStreak || 0;
            }

            if (studyMinutes) {
                studyMinutes.textContent =
                    progress.studyMinutes || 0;
            }

            if (streakDays) {
                streakDays.textContent =
                    progress.currentStreak || 0;
            }

            if (summaryQuestions) {
                summaryQuestions.textContent =
                    progress.questionsAsked || 0;
            }

            if (summaryMinutes) {
                summaryMinutes.textContent =
                    (progress.studyMinutes || 0) + " min";
            }

            if (summaryStreak) {
                summaryStreak.textContent =
                    (progress.currentStreak || 0) + " days";
            }


            // =========================
            // CHAT STATS API
            // =========================

            console.log(
                "🔥 CHAT STATS FETCH START"
            );


            const statsResponse = await fetch(
                "https://padhaai-saathi.onrender.com/api/chat/stats",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


            console.log(
                "🔥 CHAT STATS STATUS:",
                statsResponse.status
            );


            const statsData =
                await statsResponse.json();


            console.log(
                "📊 Chat Stats Response:",
                statsData
            );


            if (!statsResponse.ok) {

                console.error(
                    "❌ Chat Stats Error:",
                    statsData
                );

                return;
            }


            const stats = statsData.stats;

updateWeeklyChart(
    stats.weeklyActivity
);

            // const stats = statsData.stats;

console.log("📊 FINAL STATS:", stats);
console.log("🔥 STUDY DAYS CALCULATED:", studyDays);

// Study Days
const studyDaysElement =
    document.getElementById("studyDays2");

if (studyDaysElement) {
    studyDaysElement.textContent =
        stats.studyDays || 0;
}

// Current Streak
const streakDaysElement =
    document.getElementById("streakDays");

if (streakDaysElement) {
    streakDaysElement.textContent =
        stats.currentStreak || 0;
}

// Study Minutes
const studyMinutesElement =
    document.getElementById("studyMinutes");

if (studyMinutesElement) {
    studyMinutesElement.textContent =
        stats.studyMinutes || 0;
}




            // =========================
            // TOTAL CHATS
            // =========================

            const totalChats =
                stats.totalChats || 0;


            console.log(
                "🔥 TOTAL CHATS FROM BACKEND:",
                totalChats
            );


            const totalChatsElement =
                document.getElementById("totalChats");

            const summaryChatsElement =
                document.getElementById("summaryChats");


            if (totalChatsElement) {

                totalChatsElement.textContent =
                    totalChats;

            } else {

                console.error(
                    "❌ #totalChats element not found"
                );

            }


            if (summaryChatsElement) {

                summaryChatsElement.textContent =
                    totalChats;

            } else {

                console.error(
                    "❌ #summaryChats element not found"
                );

            }

        } catch (error) {

            console.error(
                "❌ Progress Fetch Error:",
                error
            );

        }

    }

});









// weekly chart
function updateWeeklyChart(weeklyActivity) {

    const chart =
        document.getElementById("weeklyChart");

    if (!chart) {
        console.log("❌ Weekly chart not found");
        return;
    }

    const columns =
        chart.querySelectorAll(".chart-column");

    const today = new Date();

    // Current week ka Monday
    const monday = new Date(today);

    const day = monday.getDay();

    const diff =
        day === 0
            ? 6
            : day - 1;

    monday.setDate(
        monday.getDate() - diff
    );

    // Monday → Sunday
    const days = [];

    for (let i = 0; i < 7; i++) {

        const date =
            new Date(monday);

        date.setDate(
            monday.getDate() + i
        );

        const dateString =
            date.toLocaleDateString(
                "en-CA",
                {
                    timeZone: "Asia/Kolkata"
                }
            );

        const dayName =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                    timeZone: "Asia/Kolkata"
                }
            );

        days.push({
            date: dateString,
            day: dayName
        });
    }

    // Maximum chats
    const maxChats =
        Math.max(
            ...days.map(day => {

                const found =
                    weeklyActivity?.find(
                        item =>
                            item._id === day.date
                    );

                return found
                    ? found.count
                    : 0;
            }),
            1
        );

    // Update bars
    columns.forEach(
        (column, index) => {

            const day =
                days[index];

            const activity =
                weeklyActivity?.find(
                    item =>
                        item._id === day.date
                );

            const count =
                activity
                    ? activity.count
                    : 0;

            const bar =
                column.querySelector(
                    ".chart-bar"
                );

            const label =
                column.querySelector(
                    "span"
                );

            if (!bar || !label) return;

            label.textContent =
                day.day;

            let height = 0;

            if (count > 0) {

                height =
                    (count / maxChats) * 100;

                height =
                    Math.max(height, 8);
            }

            bar.style.height =
                height + "%";

            bar.title =
                count +
                (count === 1
                    ? " chat"
                    : " chats");
        }
    );
}



// menu btn
// ==========================================
// SIDEBAR MENU
// ==========================================
const sidebar = document.querySelector(".sidebar");

const menuBtn = document.getElementById("menuBtn");


// ==========================================
// DESKTOP / NAVBAR MENU BUTTON
// ==========================================

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("active");

    });

}


// ==========================================
// MOBILE SIDEBAR
// ==========================================

if (sidebar) {

    // ==============================
    // MENU BUTTON
    // ==============================

    const mobileMenuBtn = document.createElement("button");

    mobileMenuBtn.id = "mobileMenuBtn";
    mobileMenuBtn.innerHTML = "☰";

    document.body.appendChild(mobileMenuBtn);


    // ==============================
    // OVERLAY
    // ==============================

    const overlay = document.createElement("div");

    overlay.id = "sidebarOverlay";

    document.body.appendChild(overlay);


    // ==============================
    // OPEN SIDEBAR
    // ==============================

    mobileMenuBtn.addEventListener("click", () => {

        sidebar.classList.add("active");

        overlay.classList.add("active");

        // Menu button hide
        mobileMenuBtn.style.display = "none";

    });


    // ==============================
    // CLOSE SIDEBAR
    // ==============================

    overlay.addEventListener("click", () => {

        sidebar.classList.remove("active");

        overlay.classList.remove("active");

        // Menu button wapas show
        mobileMenuBtn.style.display = "flex";

    });

}
// attach btn


// ==========================================
// FILE ATTACHMENT SYSTEM
// ==========================================
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");

let selectedFile = null;


/* ============================= */
/*        ATTACH BUTTON           */
/* ============================= */

if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", function () {

        console.log("📎 Attach button clicked");

        fileInput.click();
    });
}


/* ============================= */
/*        FILE SELECTED           */
/* ============================= */

if (fileInput) {

    fileInput.addEventListener("change", function () {

        const file = fileInput.files[0];

        if (!file) return;

        selectedFile = file;

        console.log("📂 File selection changed");
        console.log("✅ File attached:", file.name);


        /* Hide attach button */
        if (attachBtn) {
            attachBtn.style.display = "none";
        }


        /* Show file preview */
        if (filePreview) {

            filePreview.innerHTML = `
                <span class="file-icon">📎</span>

                <span
                    class="file-name"
                    title="${file.name}"
                >
                    ${file.name}
                </span>

                <button
                    class="remove-file"
                    id="removeFile"
                    type="button"
                    title="Remove file"
                >
                    ✕
                </button>
            `;

            filePreview.classList.add("show");


            /* Remove file button */
            const removeFileBtn =
                document.getElementById("removeFile");


            if (removeFileBtn) {

                removeFileBtn.addEventListener(
                    "click",
                    function () {

                        selectedFile = null;

                        fileInput.value = "";

                        filePreview.innerHTML = "";

                        filePreview.classList.remove("show");


                        /* Show attach button again */
                        if (attachBtn) {
                            attachBtn.style.display = "";
                        }


                        console.log("🗑️ File removed");
                    }
                );
            }
        }
    });
}


/* ============================= */
/*       GET SELECTED FILE        */
/* ============================= */

function getSelectedFile() {
    return selectedFile;
}


/* ============================= */
/*        CLEAR FILE              */
/* ============================= */

function clearSelectedFile() {

    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    if (filePreview) {
        filePreview.innerHTML = "";
        filePreview.classList.remove("show");
    }


    /* Show attach button again */
    if (attachBtn) {
        attachBtn.style.display = "";
    }

    console.log("🧹 File cleared");
}





/* ================================================= */
/*              PADHAAI SAATHI SETTINGS              */
/* ================================================= */

const settingsBtn = document.getElementById("setting");
const settingsPanel = document.getElementById("settingsPanel");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsClose = document.getElementById("settingsClose");


/* ================================================= */
/*                 OPEN SETTINGS                     */
/* ================================================= */

function openSettings() {

    if (!settingsPanel || !settingsOverlay) return;

    settingsPanel.classList.add("show");
    settingsOverlay.classList.add("show");

    document.body.style.overflow = "hidden";

    console.log("⚙️ Settings opened");
}


/* ================================================= */
/*                 CLOSE SETTINGS                    */
/* ================================================= */

function closeSettings() {

    if (!settingsPanel || !settingsOverlay) return;

    settingsPanel.classList.remove("show");
    settingsOverlay.classList.remove("show");

    document.body.style.overflow = "";

    console.log("⚙️ Settings closed");
}


/* ================================================= */
/*                  SETTINGS BUTTON                  */
/* ================================================= */

if (settingsBtn) {

    settingsBtn.addEventListener("click", openSettings);

}

if (settingsClose) {

    settingsClose.addEventListener(
        "click",
        closeSettings
    );

}

if (settingsOverlay) {

    settingsOverlay.addEventListener(
        "click",
        closeSettings
    );

}


/* ================================================= */
/*                  ESCAPE KEY                       */
/* ================================================= */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeSettings();

    }

});


/* ================================================= */
/*              SETTINGS NAVIGATION                 */
/* ================================================= */

const settingsNavItems =
    document.querySelectorAll(".settings-nav-item");

const settingsPages =
    document.querySelectorAll(".settings-page");


settingsNavItems.forEach(function (button) {

    button.addEventListener("click", function () {

        const target =
            button.dataset.section;


        /* Remove active from all buttons */

        settingsNavItems.forEach(function (item) {

            item.classList.remove("active");

        });


        /* Remove active from all pages */

        settingsPages.forEach(function (page) {

            page.classList.remove("active");

        });


        /* Activate clicked button */

        button.classList.add("active");


        /* Activate corresponding page */

        const targetPage =
            document.getElementById(target);

        if (targetPage) {

            targetPage.classList.add("active");

        }

    });

});


/* ================================================= */
/*              DEFAULT SETTINGS                    */
/* ================================================= */

const defaultSettings = {

    responseStyle: "balanced",

    studyLevel: "intermediate",

    explanationMode: "standard",

    enterToSend: true,

    autoScroll: true,

    voiceInput: true,

    focusMode: false,

    studyReminder: false,

    smartSuggestions: true

};


/* ================================================= */
/*              GET SAVED SETTINGS                  */
/* ================================================= */

function getStudySettings() {

    try {

        const saved =
            localStorage.getItem(
                "padhaaiSaathiSettings"
            );

        if (!saved) {

            return {
                ...defaultSettings
            };

        }

        return {
            ...defaultSettings,
            ...JSON.parse(saved)
        };

    } catch (error) {

        console.error(
            "❌ Settings load error:",
            error
        );

        return {
            ...defaultSettings
        };

    }

}


/* ================================================= */
/*              SAVE SETTINGS                       */
/* ================================================= */

async function saveSettings() {

    const settings = {
        responseStyle:
            document.querySelector(
                'input[name="responseStyle"]:checked'
            )?.value || "balanced",

        studyLevel:
            document.querySelector(
                'input[name="studyLevel"]:checked'
            )?.value || "intermediate",

        explanationMode:
            document.querySelector(
                'input[name="explanationMode"]:checked'
            )?.value || "standard",

        enterToSend:
            document.getElementById("enterToSendToggle")?.checked ?? true,

        autoScroll:
            document.getElementById("autoScrollToggle")?.checked ?? true,

        voiceInput:
            document.getElementById("voiceInputToggle")?.checked ?? true,

        focusMode:
            document.getElementById("focusModeToggle")?.checked ?? false,

        studyReminder:
            document.getElementById("studyReminderToggle")?.checked ?? false,

        smartSuggestions:
            document.getElementById("smartSuggestionToggle")?.checked ?? true
    };


    // ==================================
    // SAVE LOCALLY
    // ==================================

    localStorage.setItem(
        "padhaaiSaathiSettings",
        JSON.stringify(settings)
    );


    // Apply settings immediately
    applySettings(settings);


    // ==================================
    // GET LOGIN TOKEN
    // ==================================

    const token = localStorage.getItem("token");

    if (!token) {
        console.log("⚠️ Login token nahi mila");
        return;
    }


    // ==================================
    // SAVE TO MONGODB
    // ==================================

    try {

        const response = await fetch(
            "https://padhaai-saathi.onrender.com/api/settings",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({

                    responseStyle:
                        settings.responseStyle,

                    studyLevel:
                        settings.studyLevel,

                    explanationMode:
                        settings.explanationMode,

                    autoScroll:
                        settings.autoScroll,

                    enterToSend:
                        settings.enterToSend,

                    voiceInput:
                        settings.voiceInput,

                    focusMode:
                        settings.focusMode,

                    studyReminder:
                        settings.studyReminder,

                    smartSuggestions:
                        settings.smartSuggestions
                })
            }
        );


        const data = await response.json();


        console.log(
            "☁️ MongoDB Settings Response:",
            data
        );


        if (!response.ok) {

            console.error(
                "❌ Settings save failed:",
                data
            );

            return;
        }


        // ==================================
        // SUCCESS
        // ==================================

        console.log(
            "✅ ALL 9 SETTINGS SAVED TO MONGODB"
        );


        const status =
            document.getElementById("saveStatus");

        if (status) {
            status.textContent = "✓ Saved";
        }


    } catch (error) {

        console.error(
            "❌ Settings API Error:",
            error
        );

    }


    console.log(
        "💾 Settings saved:",
        settings
    );
}
// LOAD SETTINGS


function loadSettings() {

    const settings = getStudySettings();


    
    // RESPONSE STYLE
    

    document
        .querySelectorAll('input[name="responseStyle"]')
        .forEach(function (input) {

            input.checked =
                input.value === settings.responseStyle;

        });


   
    // STUDY LEVEL
   

    document
        .querySelectorAll('input[name="studyLevel"]')
        .forEach(function (input) {

            input.checked =
                input.value === settings.studyLevel;

        });


    // EXPLANATION MODE

    document
        .querySelectorAll('input[name="explanationMode"]')
        .forEach(function (input) {

            input.checked =
                input.value === settings.explanationMode;

        });


    // TOGGLES

    const enterToggle =
        document.getElementById("enterToSendToggle");

    const autoScrollToggle =
        document.getElementById("autoScrollToggle");

    const voiceToggle =
        document.getElementById("voiceInputToggle");

    const focusToggle =
        document.getElementById("focusModeToggle");

    const reminderToggle =
        document.getElementById("studyReminderToggle");

    const suggestionToggle =
        document.getElementById("smartSuggestionToggle");


    if (enterToggle) {

        enterToggle.checked =
            settings.enterToSend;

    }


    if (autoScrollToggle) {

        autoScrollToggle.checked =
            settings.autoScroll;

    }


    if (voiceToggle) {

        voiceToggle.checked =
            settings.voiceInput;

    }


    if (focusToggle) {

        focusToggle.checked =
            settings.focusMode;

    }


    if (reminderToggle) {

        reminderToggle.checked =
            settings.studyReminder;

    }


    if (suggestionToggle) {

        suggestionToggle.checked =
            settings.smartSuggestions;

    }


    applySettings(settings);


    console.log(
        "⚙️ Settings loaded:",
        settings
    );
}




// LOAD SETTINGS FROM MONGODB

async function loadSettingsFromBackend() {

    const token = localStorage.getItem("token");

    if (!token) {
        console.log("⚠️ Login token nahi mila");
        return;
    }

    try {

        const response = await fetch(
            "https://padhaai-saathi.onrender.com/api/settings",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "❌ Failed to load settings:",
                data
            );
            return;
        }

        console.log(
            "☁️ Settings loaded from MongoDB:",
            data
        );

        const backendSettings = data.settings;


        // ============================================
        // UPDATE RADIO BUTTONS
        // ============================================

        const responseStyle =
            document.querySelector(
                `input[name="responseStyle"][value="${backendSettings.responseStyle}"]`
            );

        const studyLevel =
            document.querySelector(
                `input[name="studyLevel"][value="${backendSettings.studyLevel}"]`
            );

        const explanationMode =
            document.querySelector(
                `input[name="explanationMode"][value="${backendSettings.explanationMode}"]`
            );


        if (responseStyle) {
            responseStyle.checked = true;
        }

        if (studyLevel) {
            studyLevel.checked = true;
        }

        if (explanationMode) {
            explanationMode.checked = true;
        }


        // ============================================
        // UPDATE TOGGLE BUTTONS
        // ============================================

        const enterToSendToggle =
            document.getElementById("enterToSendToggle");

        const autoScrollToggle =
            document.getElementById("autoScrollToggle");

        const voiceInputToggle =
            document.getElementById("voiceInputToggle");

        const focusModeToggle =
            document.getElementById("focusModeToggle");

        const studyReminderToggle =
            document.getElementById("studyReminderToggle");

        const smartSuggestionToggle =
            document.getElementById("smartSuggestionToggle");


        if (enterToSendToggle) {
            enterToSendToggle.checked =
                backendSettings.enterToSend ?? true;
        }

        if (autoScrollToggle) {
            autoScrollToggle.checked =
                backendSettings.autoScroll ?? true;
        }

        if (voiceInputToggle) {
            voiceInputToggle.checked =
                backendSettings.voiceInput ?? true;
        }

        if (focusModeToggle) {
            focusModeToggle.checked =
                backendSettings.focusMode ?? false;
        }

        if (studyReminderToggle) {
            studyReminderToggle.checked =
                backendSettings.studyReminder ?? false;
        }

        if (smartSuggestionToggle) {
            smartSuggestionToggle.checked =
                backendSettings.smartSuggestions ?? true;
        }


        // ============================================
        // GET LOCAL SETTINGS
        // ============================================

        const localSettings = getStudySettings();


        // ============================================
        // UPDATE ALL 9 SETTINGS
        // ============================================

        localSettings.responseStyle =
            backendSettings.responseStyle ?? "balanced";

        localSettings.studyLevel =
            backendSettings.studyLevel ?? "intermediate";

        localSettings.explanationMode =
            backendSettings.explanationMode ?? "standard";

        localSettings.enterToSend =
            backendSettings.enterToSend ?? true;

        localSettings.autoScroll =
            backendSettings.autoScroll ?? true;

        localSettings.voiceInput =
            backendSettings.voiceInput ?? true;

        localSettings.focusMode =
            backendSettings.focusMode ?? false;

        localSettings.studyReminder =
            backendSettings.studyReminder ?? false;

        localSettings.smartSuggestions =
            backendSettings.smartSuggestions ?? true;


        // ============================================
        // SAVE ALL SETTINGS TO LOCAL STORAGE
        // ============================================

        localStorage.setItem(
            "padhaaiSaathiSettings",
            JSON.stringify(localSettings)
        );


        // ============================================
        // APPLY ALL SETTINGS
        // ============================================

        applySettings(localSettings);


        console.log(
            "✅ ALL 9 MongoDB settings UI me apply ho gayi"
        );

    } catch (error) {

        console.error(
            "❌ Load Settings API Error:",
            error
        );
    }
}


// =================================================
// APPLY SETTINGS
// =================================================

function applySettings(settings) {


    // ---------------------------------------------
    // VOICE INPUT
    // ---------------------------------------------

    const micBtn =
        document.getElementById("micBtn");


    if (micBtn) {

        if (settings.voiceInput) {

            micBtn.style.display = "";
            micBtn.disabled = false;
            micBtn.style.opacity = "";
            micBtn.style.pointerEvents = "";

        } else {

            micBtn.style.display = "none";

        }

    }


    // ---------------------------------------------
    // FOCUS MODE
    // ---------------------------------------------

    document.body.classList.toggle(
        "focus-mode",
        settings.focusMode
    );


    // ---------------------------------------------
    // SMART SUGGESTIONS
    // ---------------------------------------------

    document.body.classList.toggle(
        "smart-suggestions-off",
        !settings.smartSuggestions
    );

}



// =================================================
// RADIO CHANGE EVENTS
// =================================================

document
    .querySelectorAll('input[name="responseStyle"]')
    .forEach(function (input) {

        input.addEventListener(
            "change",
            saveSettings
        );

    });


document
    .querySelectorAll('input[name="studyLevel"]')
    .forEach(function (input) {

        input.addEventListener(
            "change",
            saveSettings
        );

    });


document
    .querySelectorAll('input[name="explanationMode"]')
    .forEach(function (input) {

        input.addEventListener(
            "change",
            saveSettings
        );

    });



// =================================================
// TOGGLE CHANGE EVENTS
// =================================================

const settingToggleIds = [

    "enterToSendToggle",
    "autoScrollToggle",
    "voiceInputToggle",
    "focusModeToggle",
    "studyReminderToggle",
    "smartSuggestionToggle"

];


settingToggleIds.forEach(function (id) {

    const toggle =
        document.getElementById(id);


    if (!toggle) return;


    toggle.addEventListener(
        "change",
        function () {

            saveSettings();

        }
    );

});



// =================================================
// ENTER TO SEND
// =================================================

if (
    typeof input !== "undefined" &&
    input
) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                const settings =
                    getStudySettings();


                if (settings.enterToSend) {

                    event.preventDefault();

                    sendMessage();

                }

            }

        }
    );

}



// =================================================
// AUTO SCROLL FUNCTION
// =================================================

function scrollChatToBottom() {

    const settings =
        getStudySettings();


    if (!settings.autoScroll) {

        return;

    }


    if (
        typeof chatBox !== "undefined" &&
        chatBox
    ) {

        chatBox.scrollTo({

            top: chatBox.scrollHeight,

            behavior: "smooth"

        });

    }

}



// =================================================
// AI PREFERENCE PROMPT
// =================================================

function getAIPreferencePrompt() {

    const settings =
        getStudySettings();


    let prompt = "";


    // ---------------------------------------------
    // RESPONSE STYLE
    // ---------------------------------------------

    if (
        settings.responseStyle === "concise"
    ) {

        prompt +=
            "Keep the answer concise and to the point. ";

    }

    else if (
        settings.responseStyle === "detailed"
    ) {

        prompt +=
            "Give a detailed explanation with useful examples. ";

    }

    else {

        prompt +=
            "Give a balanced explanation with enough detail without unnecessary length. ";

    }


    // ---------------------------------------------
    // STUDY LEVEL
    // ---------------------------------------------

    if (
        settings.studyLevel === "beginner"
    ) {

        prompt +=
            "Explain concepts at a beginner-friendly level using simple terms. ";

    }

    else if (
        settings.studyLevel === "advanced"
    ) {

        prompt +=
            "Explain concepts at an advanced level and include deeper technical details when useful. ";

    }

    else {

        prompt +=
            "Explain concepts at an intermediate student level. ";

    }


    // ---------------------------------------------
    // EXPLANATION MODE
    // ---------------------------------------------

    if (
        settings.explanationMode === "simple"
    ) {

        prompt +=
            "Use simple language and easy examples. ";

    }

    else if (
        settings.explanationMode === "step-by-step"
    ) {

        prompt +=
            "Explain the solution step-by-step and include examples where useful. ";

    }

    else {

        prompt +=
            "Use a clear and structured explanation. ";

    }


    return prompt;

}



// =================================================
// INITIALIZE SETTINGS
// =================================================

loadSettings();

loadSettingsFromBackend();


console.log(
    "✅ Padhaai Saathi Settings initialized"
);



// home cards



// ======================================================
// STUDY PLANNER ELEMENTS
// ======================================================

const plannerModal =
    document.getElementById("plannerModal");

const closePlanner =
    document.getElementById("closePlanner");

const addSubject =
    document.getElementById("addSubject");

const subjectList =
    document.getElementById("subjectList");

const generatePlanner =
    document.getElementById("generatePlanner");

const plannerResult =
    document.getElementById("plannerResult");

const plannerOutput =
    document.getElementById("plannerOutput");

const copyPlanner =
    document.getElementById("copyPlanner");


// ======================================================
// STUDY TOOL CARDS
// ======================================================

const toolCards =
    document.querySelectorAll(".tool-card");


toolCards.forEach((card) => {

    card.addEventListener("click", () => {

        const mode =
            card.dataset.mode;

        console.log(
            "🔥 Study Tool Clicked:",
            mode
        );


        // ==================================
        // EXPLAIN TOPIC
        // ==================================

        if (mode === "chat") {

            input.focus();

            input.placeholder =
                "Enter the topic you want me to explain...";

            console.log(
                "📚 Explain Topic selected"
            );

            return;
        }


        // ==================================
        // SUMMARIZE NOTES
        // ==================================

        if (mode === "notes") {

            input.focus();

            input.placeholder =
                "Enter notes you want me to summarize...";

            console.log(
                "📝 Summarize Notes selected"
            );

            return;
        }


        // ==================================
        // GENERATE QUIZ
        // ==================================

        if (mode === "quiz") {

            console.log(
                "🧠 Quiz Generator selected"
            );

            quizGenerator();

            return;
        }


        // ==================================
        // STUDY PLANNER
        // ==================================

        if (mode === "planner") {

            console.log(
                "📅 Study Planner selected"
            );

            if (plannerModal) {

                plannerModal.classList.add(
                    "active"
                );

            }

            return;
        }

    });

});


// ======================================================
// CLOSE PLANNER
// ======================================================

if (closePlanner) {

    closePlanner.addEventListener(
        "click",
        () => {

            plannerModal.classList.remove(
                "active"
            );

        }
    );

}


// ======================================================
// CLOSE WHEN CLICKING OUTSIDE
// ======================================================

if (plannerModal) {

    plannerModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                plannerModal
            ) {

                plannerModal.classList.remove(
                    "active"
                );

            }

        }
    );

}


// ======================================================
// ADD SUBJECT
// ======================================================

if (addSubject) {

    addSubject.addEventListener(
        "click",
        () => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "planner-subject-row";


            row.innerHTML = `

                <input
                    type="text"
                    class="planner-subject-input"
                    placeholder="e.g. Operating Systems"
                >

                <select
                    class="planner-priority"
                >

                    <option value="high">
                        High
                    </option>

                    <option
                        value="medium"
                        selected
                    >
                        Medium
                    </option>

                    <option value="low">
                        Low
                    </option>

                </select>

                <button
                    type="button"
                    class="planner-remove"
                >
                    ×
                </button>

            `;


            subjectList.appendChild(
                row
            );

        }
    );

}


// ======================================================
// REMOVE SUBJECT
// ======================================================

if (subjectList) {

    subjectList.addEventListener(
        "click",
        (event) => {

            if (
                event.target.classList.contains(
                    "planner-remove"
                )
            ) {

                const rows =
                    document.querySelectorAll(
                        ".planner-subject-row"
                    );


                // At least one row remains

                if (rows.length > 1) {

                    event.target
                        .closest(
                            ".planner-subject-row"
                        )
                        .remove();

                }

            }

        }
    );

}


// ======================================================
// GENERATE STUDY PLAN
// ======================================================

if (generatePlanner) {

    generatePlanner.addEventListener(
        "click",
        async () => {

            console.log(
                "🤖 Generating Study Plan..."
            );


            // ------------------------------------------
            // GET SUBJECTS
            // ------------------------------------------

            const rows =
                document.querySelectorAll(
                    ".planner-subject-row"
                );


            const subjects = [];


            rows.forEach((row) => {

                const subjectInput =
                    row.querySelector(
                        ".planner-subject-input"
                    );


                const prioritySelect =
                    row.querySelector(
                        ".planner-priority"
                    );


                const name =
                    subjectInput.value.trim();


                if (name) {

                    subjects.push({

                        name: name,

                        priority:
                            prioritySelect.value

                    });

                }

            });


            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------

            if (subjects.length === 0) {

                alert(
                    "Please enter at least one subject."
                );

                return;

            }


            // ------------------------------------------
            // GET SETTINGS
            // ------------------------------------------

            const studyHours =
                document.getElementById(
                    "studyHours"
                ).value;


            const studyDays =
                document.getElementById(
                    "studyDays"
                ).value;


            const startTime =
                document.getElementById(
                    "startTime"
                ).value;


            const breakMinutes =
                document.getElementById(
                    "breakMinutes"
                ).value;


            // ------------------------------------------
            // SUBJECT TEXT
            // ------------------------------------------

            const subjectText =
                subjects
                    .map(
                        (subject) => {

                            return `${subject.name} - ${subject.priority} priority`;

                        }
                    )
                    .join("\n");


            // ------------------------------------------
            // AI PROMPT
            // ------------------------------------------

            const plannerPrompt = `

You are an expert academic study planner.

Create a realistic, balanced and achievable study timetable.

SUBJECTS:
${subjectText}

DAILY STUDY TIME:
${studyHours} hours

NUMBER OF DAYS:
${studyDays}

START TIME:
${startTime}

BREAK DURATION:
${breakMinutes} minutes


RULES:

1. Give slightly more study time to high priority subjects.

2. Keep medium and low priority subjects balanced.

3. Do not overload the student.

4. Divide study into realistic sessions.

5. Include proper breaks.

6. Include revision sessions.

7. Include practice/problem-solving sessions where appropriate.

8. Avoid extremely long continuous study sessions.

9. Give every study session a clear duration.

10. Create a separate timetable for every day.

11. Keep the timetable simple and easy to follow.

12. Make sure the total study time is approximately ${studyHours} hours per day.

13. Use the start time ${startTime}.

14. Use ${breakMinutes} minute breaks between study sessions.

15. End the timetable with 3-5 useful study tips.


IMPORTANT OUTPUT FORMAT:

Return ONLY an HTML table.

Do NOT use Markdown.

Do NOT use code fences.

Do NOT write any text before the table.

Do NOT write any text after the table.

Use exactly these columns:

Day
Time
Subject
Priority
Focus

Example structure:

<table class="study-timetable">

    <thead>

        <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Focus</th>
        </tr>

    </thead>

    <tbody>

        <tr>
            <td>Day 1</td>
            <td>6:00 PM - 6:45 PM</td>
            <td>Data Structures</td>
            <td>High</td>
            <td>Arrays Practice</td>
        </tr>

        <tr>
            <td>Day 1</td>
            <td>6:45 PM - 6:55 PM</td>
            <td>Break</td>
            <td>-</td>
            <td>Rest</td>
        </tr>

    </tbody>

</table>

Create timetable rows for ALL ${studyDays} days.

Every study session must be one table row.

Breaks must also be table rows.

Make the timetable balanced and realistic.

`;


            // ------------------------------------------
            // SHOW RESULT AREA
            // ------------------------------------------

            plannerResult.classList.add(
                "active"
            );


            plannerOutput.textContent =
                "🤖 Creating your personalized timetable...";


            // ------------------------------------------
            // BUTTON LOADING
            // ------------------------------------------

            generatePlanner.disabled =
                true;


            generatePlanner.textContent =
                "⏳ Creating Timetable...";


            // ------------------------------------------
            // CALL BACKEND
            // ------------------------------------------

            try {

                const response =
                    await getAIResponse(
                        plannerPrompt,
                        "planner"
                    );


                console.log(
                    "📅 Planner Response:",
                    response
                );


                // --------------------------------------
                // CLEAN AI RESPONSE
                // --------------------------------------

                let cleanResponse =
                    response.trim();


                // Remove ```html if AI still adds it

                cleanResponse =
                    cleanResponse
                        .replace(
                            /^```html\s*/i,
                            ""
                        )
                        .replace(
                            /^```\s*/i,
                            ""
                        )
                        .replace(
                            /\s*```$/i,
                            ""
                        )
                        .trim();


                // --------------------------------------
                // SHOW HTML TABLE
                // --------------------------------------

                plannerOutput.innerHTML =
                    cleanResponse;


                console.log(
                    "✅ Timetable rendered as table"
                );

            } catch (error) {

                console.error(
                    "❌ Planner Error:",
                    error
                );


                plannerOutput.textContent =
                    "❌ Unable to generate timetable. Please try again.";

            }


            // ------------------------------------------
            // RESET BUTTON
            // ------------------------------------------

            generatePlanner.disabled =
                false;


            generatePlanner.textContent =
                "🤖 Generate My Timetable";

        }
    );

}


// ======================================================
// COPY TIMETABLE
// ======================================================

if (copyPlanner) {

    copyPlanner.addEventListener(
        "click",
        async () => {

            const text =
                plannerOutput.innerText;


            if (!text.trim()) {

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    text
                );


                copyPlanner.textContent =
                    "✓ Copied";


                setTimeout(
                    () => {

                        copyPlanner.textContent =
                            "📋 Copy";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "❌ Copy Error:",
                    error
                );

            }

        }
    );

}





// profile img


// ========================================
// PROFILE PANEL
// ========================================

const profilePanel =
    document.getElementById("profilePanel");

const closeProfilePanel =
    document.getElementById("closeProfilePanel");


// ========================================
// OPEN PROFILE PANEL
// ========================================

if (profileBtn && profilePanel) {

    profileBtn.addEventListener("click", () => {

        profilePanel.classList.add("active");

        console.log("👤 Profile panel opened");

    });

}


// ========================================
// CLOSE PROFILE PANEL
// ========================================

if (closeProfilePanel && profilePanel) {

    closeProfilePanel.addEventListener("click", () => {

        profilePanel.classList.remove("active");

        console.log("❌ Profile panel closed");

    });

}


// ========================================
// CLOSE WHEN CLICKING OUTSIDE
// ========================================

document.addEventListener("click", (event) => {

    if (!profilePanel || !profileBtn) return;

    const clickedInsidePanel =
        profilePanel.contains(event.target);

    const clickedProfileButton =
        profileBtn.contains(event.target);

    if (
        !clickedInsidePanel &&
        !clickedProfileButton
    ) {

        profilePanel.classList.remove("active");

    }

});


// ========================================
// PROFILE PHOTO ELEMENTS
// ========================================

const profileImage =
    document.getElementById("profileImage");

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const changePhotoBtn =
    document.getElementById("changePhotoBtn");

const removePhotoBtn =
    document.getElementById("removePhotoBtn");

const navProfileImage =
    document.getElementById("navProfileImage");


// ========================================
// LOAD PROFILE PHOTO
// ========================================

function loadProfilePhoto() {

    const savedPhoto =
        localStorage.getItem(
            "padhaaiSaathiProfilePhoto"
        );


    if (savedPhoto) {

        // Settings profile image
        if (profileImage) {

            profileImage.src =
                savedPhoto;

        }


        // Navbar profile image
        if (navProfileImage) {

            navProfileImage.src =
                savedPhoto;

        }

    } else {

        // No external/default image
        if (profileImage) {

            profileImage.removeAttribute("src");

        }

        if (navProfileImage) {

            navProfileImage.removeAttribute("src");

        }

    }

}


// ========================================
// CHANGE PHOTO
// ========================================

if (
    changePhotoBtn &&
    profilePhotoInput
) {

    changePhotoBtn.addEventListener(
        "click",
        () => {

            profilePhotoInput.click();

        }
    );

}


// ========================================
// SELECT PHOTO
// ========================================

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files[0];

            if (!file) return;


            // IMAGE CHECK
            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select a valid image."
                );

                profilePhotoInput.value = "";

                return;

            }


            // SIZE CHECK - 5MB
            if (
                file.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "Image size should be less than 5MB."
                );

                profilePhotoInput.value = "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload = function (e) {

                const imageData =
                    e.target.result;


                // =================================
                // SHOW IN SETTINGS
                // =================================

                if (profileImage) {

                    profileImage.src =
                        imageData;

                }


                // =================================
                // SHOW IN NAVBAR
                // =================================

                if (navProfileImage) {

                    navProfileImage.src =
                        imageData;

                }


                // =================================
                // SAVE PHOTO
                // =================================

                localStorage.setItem(
                    "padhaaiSaathiProfilePhoto",
                    imageData
                );


                console.log(
                    "✅ Profile photo updated"
                );

            };


            reader.readAsDataURL(file);

        }
    );

}


// ========================================
// REMOVE PHOTO
// ========================================

if (removePhotoBtn) {

    removePhotoBtn.addEventListener(
        "click",
        () => {

            // Remove saved photo
            localStorage.removeItem(
                "padhaaiSaathiProfilePhoto"
            );


            // Remove Settings image
            if (profileImage) {

                profileImage.removeAttribute(
                    "src"
                );

            }


            // Remove Navbar image
            if (navProfileImage) {

                navProfileImage.removeAttribute(
                    "src"
                );

            }


            // Reset file input
            if (profilePhotoInput) {

                profilePhotoInput.value = "";

            }


            console.log(
                "🗑️ Profile photo removed"
            );

        }
    );

}


// ========================================
// LOAD USER NAME + EMAIL
// ========================================

function loadProfileUser() {

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    const profileNameText =
        document.getElementById(
            "profileNameText"
        );

    const profileEmailText =
        document.getElementById(
            "profileEmailText"
        );


    let user = null;


    // ========================================
    // GET USER FROM LOCAL STORAGE
    // ========================================

    try {

        const savedUser =
            localStorage.getItem("user");

        if (savedUser) {

            user =
                JSON.parse(savedUser);

        }

    } catch (error) {

        console.log(
            "⚠️ User data parse nahi hua"
        );

    }


    // ========================================
    // NAME
    // ========================================

    const name =
        user?.name ||
        localStorage.getItem("userName") ||
        "User";


    // ========================================
    // EMAIL
    // ========================================

    const email =
        user?.email ||
        localStorage.getItem("userEmail") ||
        "No email available";


    // ========================================
    // UPDATE PROFILE
    // ========================================

    if (profileName) {

        profileName.textContent =
            name;

    }

    if (profileNameText) {

        profileNameText.textContent =
            name;

    }

    if (profileEmail) {

        profileEmail.textContent =
            email;

    }

    if (profileEmailText) {

        profileEmailText.textContent =
            email;

    }


    console.log(
        "👤 Profile loaded:",
        name,
        email
    );

}


// ========================================
// INITIALIZE PROFILE
// ========================================

loadProfilePhoto();

loadProfileUser();

console.log(
    "✅ Profile system initialized"
);

