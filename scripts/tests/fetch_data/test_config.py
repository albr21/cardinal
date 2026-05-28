import json
import pytest
from lib.config import load_config

class TestLoadConfig:
    def test_loads_valid_config(self, tmp_path):
        """Should load and return parsed JSON config."""
        config_data = {
            "github": {"sources": [], "token_env": "MY_TOKEN"},
            "site": {"title": "Test"},
        }
        config_file = tmp_path / "config.json"
        config_file.write_text(json.dumps(config_data), encoding="utf-8")

        result = load_config(str(config_file))

        assert result == config_data
        assert result["github"]["token_env"] == "MY_TOKEN"
        assert result["site"]["title"] == "Test"

    def test_missing_config_exits(self):
        """Should sys.exit(1) if config file does not exist."""
        with pytest.raises(SystemExit) as exc_info:
            load_config("/nonexistent/path/config.json")
        assert exc_info.value.code == 1

    def test_invalid_json_raises(self, tmp_path):
        """Should raise ValueError/JSONDecodeError on invalid JSON."""
        config_file = tmp_path / "bad.json"
        config_file.write_text("not json {{{", encoding="utf-8")

        with pytest.raises(json.JSONDecodeError):
            load_config(str(config_file))
