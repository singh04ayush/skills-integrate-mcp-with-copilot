document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add filter, sort, and search controls
  const controlsDiv = document.createElement("div");
  controlsDiv.style.marginBottom = "20px";
  controlsDiv.innerHTML = `
    <label>Category:
      <select id="filter-category">
        <option value="">All</option>
        <option value="Games">Games</option>
        <option value="STEM">STEM</option>
        <option value="Sports">Sports</option>
      </select>
    </label>
    <label style="margin-left:10px;">Sort:
      <select id="sort-by">
        <option value="">None</option>
        <option value="name">Name</option>
        <option value="date">Date</option>
      </select>
    </label>
    <label style="margin-left:10px;">Search:
      <input type="text" id="search-text" placeholder="Search activities..." />
    </label>
    <button id="apply-filters" style="margin-left:10px;">Apply</button>
  `;
  activitiesList.parentElement.insertBefore(controlsDiv, activitiesList);

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Get filter/sort/search values
      const category = document.getElementById("filter-category").value;
      const sort = document.getElementById("sort-by").value;
      const search = document.getElementById("search-text").value;
      let url = "/activities";
      const params = [];
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (sort) params.push(`sort=${encodeURIComponent(sort)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length) url += `?${params.join("&")}`;

      const response = await fetch(url);
      const activities = await response.json();

      // Clear loading message and dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
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
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
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

  // Apply filters button
  document.getElementById("apply-filters").addEventListener("click", fetchActivities);
  // Also allow pressing Enter in search box to trigger
  document.getElementById("search-text").addEventListener("keydown", (e) => {
    if (e.key === "Enter") fetchActivities();
  });

  // Initialize app
  fetchActivities();
});
