document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML = details.participants.length > 0
          ? `
            <div class="participants">
              <h5>Participants</h5>
              <ul class="participant-list">
                ${details.participants.map((participant) => `
                  <li class="participant-item">
                    <span class="participant-name">${participant}</span>
                    <button class="remove-btn" data-activity="${name}" data-email="${participant}">Remove</button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `
          : `
            <div class="participants empty">
              <h5>Participants</h5>
              <p>No participants have signed up yet.</p>
            </div>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  const emailInput = document.getElementById("email");
  let suggestionSpan = null;
  const measureSpan = document.createElement("span");
  measureSpan.style.visibility = "hidden";
  measureSpan.style.position = "absolute";
  measureSpan.style.whiteSpace = "pre";
  document.body.appendChild(measureSpan);

  const getTextWidth = (text) => {
    const style = window.getComputedStyle(emailInput);
    measureSpan.style.font = style.font;
    measureSpan.textContent = text;
    return measureSpan.getBoundingClientRect().width;
  };

  const updateSuggestionPosition = (value) => {
    const textWidth = getTextWidth(value);
    const left = emailInput.offsetLeft + 10 + textWidth;
    const top = emailInput.offsetTop + emailInput.clientHeight / 2;
    suggestionSpan.style.left = `${left}px`;
    suggestionSpan.style.top = `${top}px`;
    suggestionSpan.style.transform = "translateY(-50%)";
  };

  emailInput.addEventListener("input", () => {
    const value = emailInput.value;
    if (value.endsWith('@') && !value.includes('@mergington.edu')) {
      if (!suggestionSpan) {
        suggestionSpan = document.createElement("span");
        suggestionSpan.textContent = "mergington.edu";
        suggestionSpan.className = "email-suggestion";
        emailInput.parentNode.appendChild(suggestionSpan);
      }
      updateSuggestionPosition(value);
    } else {
      if (suggestionSpan) {
        suggestionSpan.remove();
        suggestionSpan = null;
      }
    }
  });

  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && suggestionSpan) {
      e.preventDefault();
      emailInput.value += "mergington.edu";
      suggestionSpan.remove();
      suggestionSpan = null;
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle remove participant
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("remove-btn")) {
      const activityName = event.target.dataset.activity;
      const email = event.target.dataset.email;

      if (confirm(`Are you sure you want to remove ${email} from ${activityName}?`)) {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();

          if (response.ok) {
            // Refresh the activities list
            fetchActivities();
          } else {
            alert(result.detail || "An error occurred");
          }
        } catch (error) {
          alert("Failed to unregister. Please try again.");
          console.error("Error unregistering:", error);
        }
      }
    }
  });

  // Initialize app
  fetchActivities();
});
