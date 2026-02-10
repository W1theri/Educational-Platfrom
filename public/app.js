const buttons = document.querySelectorAll("button");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.97)" },
        { transform: "scale(1)" },
      ],
      { duration: 180, easing: "ease-out" }
    );
  });
});

const sections = document.querySelectorAll("section, footer");
if (sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  sections.forEach((section) => {
    section.classList.add("reveal-hidden");
    observer.observe(section);
  });
}

function setStatus(form, message, isError) {
  let node = form.querySelector(".form-status");
  if (!node) {
    node = document.createElement("p");
    node.className = "form-status";
    form.appendChild(node);
  }
  node.textContent = message;
  node.dataset.state = isError ? "error" : "success";
}

async function handleAuthSubmit(form, endpoint, payload) {
  try {
    const res = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setStatus(form, "Success! Token saved to localStorage.", false);
    if (endpoint === "login" || endpoint === "register") {
      setTimeout(() => {
        window.location.href = "/profile.html";
      }, 600);
    }
  } catch (err) {
    setStatus(form, err.message, true);
  }
}

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    handleAuthSubmit(loginForm, "login", payload);
  });
}

const registerForm = document.querySelector("#register-form");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };
    handleAuthSubmit(registerForm, "register", payload);
  });
}

const profileForm = document.querySelector("#profile-form");
const passwordForm = document.querySelector("#password-form");
const token = localStorage.getItem("token");

if ((profileForm || passwordForm) && !token) {
  if (profileForm) {
    setStatus(profileForm, "No token found. Please sign in.", true);
  }
  if (passwordForm) {
    setStatus(passwordForm, "No token found. Please sign in.", true);
  }
}

if (profileForm && token) {
  fetch("/api/users/profile", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        throw new Error(data.error || "Failed to load profile");
      }
      profileForm.elements.username.value = data.username || "";
      profileForm.elements.phoneNumber.value = data.phoneNumber || "";
      profileForm.elements.email.value = data.email || "";
      if (data.dateOfBirth) {
        const dob = new Date(data.dateOfBirth);
        if (!isNaN(dob)) {
          profileForm.elements.dateOfBirth.value = dob
            .toISOString()
            .slice(0, 10);
        }
      }
    })
    .catch((err) => {
      setStatus(profileForm, err.message, true);
    });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(profileForm);
    const payload = {
      username: formData.get("username") || "",
      phoneNumber: formData.get("phoneNumber") || "",
      dateOfBirth: formData.get("dateOfBirth") || null,
    };

    fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          throw new Error(data.error || "Failed to update profile");
        }
        setStatus(profileForm, "Profile updated.", false);
      })
      .catch((err) => {
        setStatus(profileForm, err.message, true);
      });
  });
}

if (passwordForm && token) {
  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(passwordForm);
    const payload = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
    };

    fetch("/api/users/profile/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          throw new Error(data.error || "Failed to update password");
        }
        setStatus(passwordForm, data.message || "Password updated.", false);
        passwordForm.reset();
      })
      .catch((err) => {
        setStatus(passwordForm, err.message, true);
      });
  });
}

const logoutBtn = document.querySelector("#logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });
}
