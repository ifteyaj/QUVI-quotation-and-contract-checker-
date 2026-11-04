from pathlib import Path
import sys

# Allow tests to import the application as the top-level "app" package.
sys.path.insert(0, str(Path(__file__).resolve().parent))