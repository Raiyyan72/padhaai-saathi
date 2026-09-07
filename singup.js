console.log("🔥 SIGNUP JS LOADED");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const signupBtn = document.getElementById("signupBtn");
const togglePassword = document.getElementById("togglePassword");

console.log("Signup Button:", signupBtn);
console.log("Name Input:", nameInput);


// ===============================
// Password Toggle
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
// Signup
// ===============================

signupBtn.addEventListener("click", async () => {

    console.log("🔥 SIGNUP BUTTON CLICKED");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirm = confirmPassword.value.trim();

    console.log("Form Data:", {
        name,
        email
    });


    // Validation
    if (!name || !email || !password || !confirm) {

        alert("⚠ Please fill all fields.");

        return;
    }


    if (password !== confirm) {

        alert("❌ Passwords do not match.");

        return;
    }


    try {

        console.log("🚀 Sending request to backend...");

        signupBtn.innerHTML = "Creating...";
        signupBtn.disabled = true;


        const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );


        console.log("Backend Status:", response.status);


        const data = await response.json();

        console.log("Backend Response:", data);


        if (!response.ok) {

            alert(data.message || "Signup failed");

            signupBtn.innerHTML = "Create Account";
            signupBtn.disabled = false;

            return;
        }


        alert("✅ Account Created Successfully!");


        window.location.href = "login.html";


    } catch (error) {

        console.error("❌ Signup Error:", error);

        alert("❌ Unable to connect with server.");

        signupBtn.innerHTML = "Create Account";
        signupBtn.disabled = false;

    }

});



signupBtn.addEventListener("click", async () => {

    console.log("🔥 SIGNUP BUTTON CLICKED");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirm = confirmPassword.value.trim();

    // ...
});



let passwordAlertShown = false;

passwordInput.addEventListener("focus", () => {
    if (!passwordAlertShown) {
        alert(
            "🔐 Please create a new password for Padhaai Saathi. Do not use your Original Gmail account password."
        );

        passwordAlertShown = true;
    }
});