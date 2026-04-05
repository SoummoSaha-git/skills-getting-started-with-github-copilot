def test_root_redirect(client):
    """Arrange: request the root endpoint; Act: GET /; Assert: redirect is returned."""
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client):
    """Arrange: default activity state; Act: GET /activities; Assert: correct structure."""
    response = client.get("/activities")
    data = response.json()

    assert response.status_code == 200
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert "Gym Class" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_activity_success(client):
    """Arrange: prepare a signup request; Act: POST signup; Assert: participant is added."""
    email = "teststudent@mergington.edu"
    activity_name = "Chess Club"

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert email in client.get("/activities").json()[activity_name]["participants"]


def test_signup_duplicate_email_returns_400(client):
    """Arrange: signup once; Act: signup again; Assert: duplicate yields 400."""
    email = "duplicate@mergington.edu"
    activity_name = "Chess Club"

    client.post(f"/activities/{activity_name}/signup", params={"email": email})
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up"


def test_signup_nonexistent_activity_returns_404(client):
    """Arrange: choose invalid activity; Act: signup; Assert: 404 returned."""
    response = client.post(
        "/activities/Nonexistent/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_from_activity_success(client):
    """Arrange: signup a student; Act: delete signup; Assert: student is removed."""
    email = "remove@mergington.edu"
    activity_name = "Chess Club"

    client.post(f"/activities/{activity_name}/signup", params={"email": email})
    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert email not in client.get("/activities").json()[activity_name]["participants"]


def test_unregister_missing_participant_returns_400(client):
    """Arrange: no signup exists; Act: delete; Assert: 400 returned."""
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": "missing@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student not signed up for this activity"


def test_unregister_nonexistent_activity_returns_404(client):
    """Arrange: choose invalid activity; Act: delete; Assert: 404 returned."""
    response = client.delete(
        "/activities/NoSuch/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
