import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as app_activities

INITIAL_ACTIVITIES = copy.deepcopy(app_activities)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities state before each test."""
    app_activities.clear()
    app_activities.update(copy.deepcopy(INITIAL_ACTIVITIES))
    yield


@pytest.fixture
def client():
    """Provide a TestClient for the FastAPI app."""
    return TestClient(app)
