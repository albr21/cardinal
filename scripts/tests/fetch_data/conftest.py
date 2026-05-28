import sys
from pathlib import Path

print(str(Path(__file__).resolve().parent.parent / "libs/fetch_data"))

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "libs/fetch_data"))
