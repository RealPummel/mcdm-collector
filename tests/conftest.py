import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    app.state.supabase = mock
    return mock

@pytest.fixture
def client():
    return TestClient(app)