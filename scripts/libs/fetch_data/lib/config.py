import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
SCRIPTS_DIR = ROOT / "scripts"
CONFIG_FILE = ROOT / "config.json"
OUTPUT_FILE = ROOT / "src" / "data" / "repos.json"

def load_config(config_path: str) -> dict:
    """Load and validate configuration file."""
    path = Path(config_path)
    if not path.exists():
        print(f"Error: Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
