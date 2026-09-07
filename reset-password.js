console.log("🔥 RESET PASSWORD JS LOADED");

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

console.log("🌐 Current URL:", window.location.href);
console.log("🔎 Query String:", window.location.search);
console.log("🔑 Reset Token:", token);

const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetBtn = document.getElementById("resetBtn");

console.log("🔘 Reset Button:", resetBtn);

if (!resetBtn) {
    console.error("❌ resetBtn nahi mila!");
} else {

    resetBtn.addEventListener("click", async () => {

        console.log("🖱️ Reset button clicked");

        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!token) {
            alert("❌ Invalid or missing reset link.");
            return;
        }

        if (!password || !confirmPassword) {
            alert("⚠️ Please fill all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("❌ Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            alert("⚠️ Password must be at least 6 characters.");
            return;
        }

        try {

            resetBtn.innerText = "Resetting...";
            resetBtn.disabled = true;

            console.log("🚀 Sending request to backend...");

            const response = await fetch(
                "https://padhaai-saathi.onrender.com/api/auth/reset-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        token: token,
                        password: password
                    })
                }
            );

            console.log("📡 Reset Status:", response.status);

            const data = await response.json();

            console.log("📦 Reset Response:", data);

            if (!response.ok) {

                alert(
                    "❌ " +
                    (data.message || "Unable to reset password")
                );

                resetBtn.innerText = "Reset Password";
                resetBtn.disabled = false;

                return;
            }

            alert("✅ Password reset successful!");

            window.location.href = "login.html";

        } catch (error) {

            console.error("❌ Reset Password Error:", error);

            alert("❌ Unable to connect with server.");

            resetBtn.innerText = "Reset Password";
            resetBtn.disabled = false;
        }

    });

}