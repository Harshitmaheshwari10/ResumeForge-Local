"""Download spaCy English model if not present."""

import subprocess
import sys


def main():
  try:
    import spacy
    spacy.load("en_core_web_sm")
    print("spaCy model en_core_web_sm is already installed.")
  except OSError:
    print("Downloading spaCy model en_core_web_sm...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    print("Done.")


if __name__ == "__main__":
  main()
