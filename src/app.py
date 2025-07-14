"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""


from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path
import json

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")


# Load activities from JSON file
def load_activities():
    activities_path = Path(__file__).parent / "activities.json"
    with open(activities_path, "r") as f:
        return json.load(f)

# Save activities to JSON file
def save_activities(activities):
    activities_path = Path(__file__).parent / "activities.json"
    with open(activities_path, "w") as f:
        json.dump(activities, f, indent=2)


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")



@app.get("/activities")
def get_activities(
    category: str = Query(None, description="Filter by category"),
    sort: str = Query(None, description="Sort by 'name' or 'date'"),
    search: str = Query(None, description="Free text search")
):
    activities = load_activities()
    # Filtering
    if category:
        activities = [a for a in activities if a.get("category", "").lower() == category.lower()]
    # Search
    if search:
        search_lower = search.lower()
        activities = [a for a in activities if search_lower in a["name"].lower() or search_lower in a.get("description", "").lower()]
    # Sorting
    if sort == "name":
        activities = sorted(activities, key=lambda a: a["name"].lower())
    elif sort == "date":
        activities = sorted(activities, key=lambda a: a.get("date", ""))
    # Return as dict keyed by name for compatibility
    return {a["name"]: a for a in activities}



@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    activities = load_activities()
    # Find activity by name
    activity = next((a for a in activities if a["name"] == activity_name), None)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is already signed up")
    activity["participants"].append(email)
    save_activities(activities)
    return {"message": f"Signed up {email} for {activity_name}"}



@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    activities = load_activities()
    activity = next((a for a in activities if a["name"] == activity_name), None)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is not signed up for this activity")
    activity["participants"].remove(email)
    save_activities(activities)
    return {"message": f"Unregistered {email} from {activity_name}"}
