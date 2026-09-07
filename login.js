// ===============================
// Elements
// ===============================

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const togglePassword = document.getElementById("togglePassword");


// ===============================
// Show / Hide Password
// ===============================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "🙈";

    } else {

        passwordInput.type = "password";
        togglePassword.textContent = "👁";

    }

});


// ===============================
// Login
// ===============================

loginBtn.addEventListener("click", async () => {

    console.log("🔥 LOGIN BUTTON CLICKED");


    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();


    // ===============================
    // Validation
    // ===============================

    if (!email || !password) {

        alert("⚠ Please enter Email & Password.");

        return;
    }


    try {

        // Button loading
        loginBtn.innerHTML = "Logging in...";
        loginBtn.disabled = true;


        // ===============================
        // Backend API
        // ===============================

        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );


        console.log("Login Status:", response.status);


        const data = await response.json();

        console.log("Login Response:", data);


        // ===============================
        // Login Failed
        // ===============================

        if (!response.ok) {

            alert("❌ " + (data.message || "Login failed"));

            loginBtn.innerHTML = "Login";
            loginBtn.disabled = false;

            return;
        }


        // ===============================
        // Login Successful
        // ===============================

        alert("✅ Login Successful!");


        // JWT Token save
        localStorage.setItem("token", data.token);


        // User information save
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );


        // Login status
        localStorage.setItem("isLoggedIn", "true");


        loginBtn.innerHTML = "✅ Login Successful";


        // ===============================
        // Go to AI Chat
        // ===============================

        setTimeout(() => {

            window.location.href = "index.html";

        }, 800);


    } catch (error) {

        console.error("❌ Login Error:", error);

        alert("❌ Unable to connect with server.");

        loginBtn.innerHTML = "Login";
        loginBtn.disabled = false;

    }

});