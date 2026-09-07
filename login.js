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

        alert("⚠️ Please enter Email & Password.");

        return;
    }


    try {

        // ===============================
        // Button Loading
        // ===============================

        loginBtn.innerHTML = "Logging in...";
        loginBtn.disabled = true;


        // ===============================
        // Backend API
        // ===============================

        const response = await fetch(
            "https://padhaai-saathi.onrender.com/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        // ===============================
        // Response Status
        // ===============================

        console.log("🔥 Login Status:", response.status);


        // ===============================
        // Read Response
        // ===============================

        const responseText = await response.text();

        console.log("🔥 Login Raw Response:", responseText);


        let data;

        try {

            data = JSON.parse(responseText);

        } catch (jsonError) {

            console.error("❌ JSON Parse Error:", jsonError);

            alert(
                "❌ Server response invalid.\n\n" +
                "Please try again after a few seconds."
            );

            loginBtn.innerHTML = "Login";
            loginBtn.disabled = false;

            return;
        }


        console.log("🔥 Login Response:", data);


        // ===============================
        // Login Failed
        // ===============================

        if (!response.ok) {

            alert(
                "❌ " +
                (data.message || "Invalid email or password.")
            );

            loginBtn.innerHTML = "Login";
            loginBtn.disabled = false;

            return;
        }


        // ===============================
        // Check Token
        // ===============================

        if (!data.token) {

            console.error("❌ Token missing:", data);

            alert("❌ Login successful, but token was not received.");

            loginBtn.innerHTML = "Login";
            loginBtn.disabled = false;

            return;
        }


        // ===============================
        // Login Successful
        // ===============================

        console.log("✅ LOGIN SUCCESSFUL");


        // JWT Token Save
        localStorage.setItem(
            "token",
            data.token
        );


        // User Information Save
        if (data.user) {

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

        }


        // Login Status
        localStorage.setItem(
            "isLoggedIn",
            "true"
        );


        // ===============================
        // Success Message
        // ===============================

        alert("✅ Login Successful!");


        loginBtn.innerHTML = "✅ Login Successful";


        // ===============================
        // Go To AI Chat
        // ===============================

        setTimeout(() => {

            window.location.href = "index.html";

        }, 800);

    }


    // ===============================
    // Network / Connection Error
    // ===============================

    catch (error) {

        console.error("❌ Login Error:", error);

        alert(
            "❌ Unable to connect with server.\n\n" +
            "Please check your internet connection and try again."
        );

        loginBtn.innerHTML = "Login";
        loginBtn.disabled = false;

    }

});