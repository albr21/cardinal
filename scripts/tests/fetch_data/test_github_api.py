import json
import pytest
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError

from lib.github_api import (
    check_github_pages,
    fetch_languages,
    github_paginate,
    github_request,
)

def _mock_response(data, status=200):
    """Create a mock urlopen response."""
    body = json.dumps(data).encode("utf-8")
    response = MagicMock()
    response.read.return_value = body
    response.__enter__ = MagicMock(return_value=response)
    response.__exit__ = MagicMock(return_value=False)
    return response

class TestGithubRequest:
    @patch("lib.github_api.urlopen")
    def test_successful_request(self, mock_urlopen):
        """Should return parsed JSON on success."""
        mock_urlopen.return_value = _mock_response({"id": 1, "name": "test-repo"})

        result = github_request("https://api.github.com/repos/user/repo", "fake-token")

        assert result == {"id": 1, "name": "test-repo"}

    @patch("lib.github_api.urlopen")
    def test_sends_auth_header(self, mock_urlopen):
        """Should include Bearer token in Authorization header."""
        mock_urlopen.return_value = _mock_response({})

        github_request("https://api.github.com/test", "my-token-123")

        call_args = mock_urlopen.call_args[0][0]
        assert call_args.get_header("Authorization") == "Bearer my-token-123"
        assert call_args.get_header("Accept") == "application/vnd.github.v3+json"
        assert call_args.get_header("User-agent") == "data-fetcher"

    @patch("lib.github_api.urlopen")
    def test_http_404_raises(self, mock_urlopen):
        """Should raise HTTPError on 404."""
        mock_urlopen.side_effect = HTTPError(
            url="https://api.github.com/test",
            code=404,
            msg="Not Found",
            hdrs=MagicMock(),
            fp=BytesIO(b""),
        )

        with pytest.raises(HTTPError):
            github_request("https://api.github.com/test", "token")

    @patch("lib.github_api.urlopen")
    def test_http_403_rate_limit(self, mock_urlopen):
        """Should raise HTTPError on 403 rate limit."""
        headers = MagicMock()
        headers.get.return_value = None
        mock_urlopen.side_effect = HTTPError(
            url="https://api.github.com/test",
            code=403,
            msg="Forbidden",
            hdrs=headers,
            fp=BytesIO(b""),
        )

        with pytest.raises(HTTPError):
            github_request("https://api.github.com/test", "token")

    @patch("lib.github_api.urlopen")
    def test_url_error_raises(self, mock_urlopen):
        """Should raise URLError on network failure."""
        mock_urlopen.side_effect = URLError("Connection refused")

        with pytest.raises(URLError):
            github_request("https://api.github.com/test", "token")

class TestGithubPaginate:
    @patch("lib.github_api.github_request")
    def test_single_page(self, mock_request):
        """Should return all items when response fits in one page."""
        mock_request.return_value = [{"id": 1}, {"id": 2}]

        result = github_paginate("https://api.github.com/users/test/repos", "token")

        assert result == [{"id": 1}, {"id": 2}]
        mock_request.assert_called_once()

    @patch("lib.github_api.github_request")
    def test_multiple_pages(self, mock_request):
        """Should paginate until a page returns fewer items than per_page."""
        page1 = [{"id": i} for i in range(100)]
        page2 = [{"id": i} for i in range(100, 130)]
        mock_request.side_effect = [page1, page2]

        result = github_paginate("https://api.github.com/users/test/repos", "token")

        assert len(result) == 130
        assert mock_request.call_count == 2

    @patch("lib.github_api.github_request")
    def test_empty_response(self, mock_request):
        """Should return empty list if first page is empty."""
        mock_request.return_value = []

        result = github_paginate("https://api.github.com/users/test/repos", "token")

        assert result == []

    @patch("lib.github_api.github_request")
    def test_url_with_existing_query_params(self, mock_request):
        """Should use & separator when URL already has query params."""
        mock_request.return_value = [{"id": 1}]

        github_paginate("https://api.github.com/users/test/repos?type=owner", "token")

        url_called = mock_request.call_args[0][0]
        assert "?type=owner&per_page=100&page=1" in url_called

class TestCheckGithubPages:
    @patch("lib.github_api.github_request")
    def test_pages_enabled(self, mock_request):
        """Should return URL when pages are built."""
        mock_request.return_value = {
            "status": "built",
            "html_url": "https://user.github.io/repo",
        }

        result = check_github_pages("user", "repo", "token")

        assert result == "https://user.github.io/repo"

    @patch("lib.github_api.github_request")
    def test_pages_with_html_url_only(self, mock_request):
        """Should return URL even if status is not 'built' but html_url exists."""
        mock_request.return_value = {
            "status": "building",
            "html_url": "https://user.github.io/repo",
        }

        result = check_github_pages("user", "repo", "token")

        assert result == "https://user.github.io/repo"

    @patch("lib.github_api.github_request")
    def test_pages_not_enabled(self, mock_request):
        """Should return None when pages endpoint returns 404."""
        mock_request.side_effect = HTTPError(
            url="", code=404, msg="Not Found", hdrs=MagicMock(), fp=BytesIO(b"")
        )

        result = check_github_pages("user", "repo", "token")

        assert result is None

class TestFetchLanguages:
    @patch("lib.github_api.github_request")
    def test_returns_languages(self, mock_request):
        """Should return language breakdown dict."""
        mock_request.return_value = {"Python": 15000, "JavaScript": 8000}

        result = fetch_languages("user", "repo", "token")

        assert result == {"Python": 15000, "JavaScript": 8000}

    @patch("lib.github_api.github_request")
    def test_returns_empty_on_error(self, mock_request):
        """Should return empty dict on HTTP error."""
        mock_request.side_effect = HTTPError(
            url="", code=404, msg="Not Found", hdrs=MagicMock(), fp=BytesIO(b"")
        )

        result = fetch_languages("user", "repo", "token")

        assert result == {}
