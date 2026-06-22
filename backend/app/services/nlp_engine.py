"""Local NLP engine using spaCy, NLTK, and scikit-learn — no external APIs."""

import logging
import re
from functools import lru_cache

import nltk
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.utils.text_utils import dedupe_preserve_order, tokenize_words, contains_term

logger = logging.getLogger(__name__)

# Ensure NLTK data is available locally
for resource in ("punkt", "punkt_tab", "stopwords", "wordnet"):
  try:
    nltk.data.find(f"tokenizers/{resource}" if "punkt" in resource else f"corpora/{resource}")
  except LookupError:
    try:
      nltk.download(resource, quiet=True)
    except Exception:
      pass

try:
  from nltk.corpus import stopwords

  STOP_WORDS = set(stopwords.words("english"))
except Exception:
  STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "shall", "can",
    "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
    "they", "what", "which", "who", "when", "where", "why", "how", "all",
    "each", "every", "both", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  }

# Known skill/tech vocabulary for extraction
TECH_SKILLS = {
  "python", "java", "javascript", "typescript", "react", "angular", "vue",
  "node", "nodejs", "express", "fastapi", "django", "flask", "spring",
  "sql", "mysql", "postgresql", "mongodb", "redis", "aws", "azure", "gcp",
  "docker", "kubernetes", "terraform", "ansible", "jenkins", "git", "github",
  "gitlab", "ci/cd", "linux", "bash", "powershell", "html", "css", "tailwind",
  "sass", "webpack", "vite", "graphql", "rest", "api", "microservices",
  "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
  "pandas", "numpy", "nlp", "computer vision", "data analysis", "tableau",
  "power bi", "excel", "spark", "hadoop", "kafka", "elasticsearch", "splunk",
  "cybersecurity", "siem", "penetration testing", "network security", "firewall",
  "owasp", "encryption", "ssl", "tls", "vpn", "iam", "oauth", "jwt",
  "agile", "scrum", "jira", "confluence", "figma", "selenium", "pytest",
  "junit", "maven", "gradle", "npm", "yarn", "pip", "conda", "r", "matlab",
  "c++", "c#", ".net", "go", "golang", "rust", "scala", "kotlin", "swift",
  "object-oriented", "functional programming", "design patterns", "solid",
  "tdd", "bdd", "devops", "mlops", "etl", "data warehousing", "snowflake",
  "databricks", "airflow", "dbt", "looker", "snowflake", "bigquery",
}

SOFT_SKILLS = {
  "communication", "leadership", "teamwork", "collaboration", "problem solving",
  "critical thinking", "time management", "adaptability", "creativity",
  "attention to detail", "analytical", "interpersonal", "presentation",
  "negotiation", "conflict resolution", "mentoring", "stakeholder management",
  "project management", "strategic planning", "decision making", "initiative",
  "self-motivated", "organized", "multitasking", "cross-functional",
}


@lru_cache(maxsize=1)
def get_nlp():
  """Load spaCy model once; fall back to blank English pipeline."""
  try:
    return spacy.load("en_core_web_sm")
  except OSError:
    logger.warning("en_core_web_sm not found; using blank English model")
    return spacy.blank("en")


def extract_keywords_tfidf(texts: list[str], top_n: int = 30) -> list[str]:
  """Extract top keywords using TF-IDF across documents."""
  if not texts or not any(t.strip() for t in texts):
    return []
  try:
    vectorizer = TfidfVectorizer(
      max_features=500,
      stop_words="english",
      ngram_range=(1, 2),
      min_df=1,
    )
    matrix = vectorizer.fit_transform(texts)
    scores = matrix.sum(axis=0).A1
    features = vectorizer.get_feature_names_out()
    ranked = sorted(zip(features, scores), key=lambda x: -x[1])
    return [kw for kw, _ in ranked[:top_n]]
  except Exception:
    tokens = tokenize_words(" ".join(texts))
    filtered = [t for t in tokens if t not in STOP_WORDS and len(t) > 2]
    from collections import Counter
    return [w for w, _ in Counter(filtered).most_common(top_n)]


def compute_similarity(text_a: str, text_b: str) -> float:
  """Cosine similarity between two texts (0-1)."""
  if not text_a.strip() or not text_b.strip():
    return 0.0
  try:
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    matrix = vectorizer.fit_transform([text_a, text_b])
    sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    return float(max(0.0, min(1.0, sim)))
  except Exception:
    return 0.0


def extract_skills_from_text(text: str) -> tuple[list[str], list[str]]:
  """Extract technical and soft skills from text."""
  text_lower = text.lower()
  technical: list[str] = []
  soft: list[str] = []

  for skill in TECH_SKILLS:
    if contains_term(text, skill):
      technical.append(skill.title() if len(skill) > 3 else skill.upper())

  for skill in SOFT_SKILLS:
    if contains_term(text, skill):
      soft.append(skill.title())

  # Also extract capitalized tech terms and acronyms
  for match in re.findall(r"\b[A-Z][a-zA-Z+#.]{1,20}\b", text):
    if match.lower() not in STOP_WORDS and len(match) > 2:
      if match.lower() in TECH_SKILLS:
        technical.append(match)

  return dedupe_preserve_order(technical), dedupe_preserve_order(soft)


def extract_entities(text: str) -> list[str]:
  """Named entity extraction via spaCy."""
  nlp = get_nlp()
  doc = nlp(text[:100000])  # cap for performance
  return dedupe_preserve_order([ent.text for ent in doc.ents if len(ent.text) > 2])


def match_keywords(resume_text: str, jd_keywords: list[str]) -> tuple[list[str], list[str]]:
  """Find which JD keywords appear in resume."""
  found: list[str] = []
  missing: list[str] = []
  for kw in jd_keywords:
    if contains_term(resume_text, kw):
      found.append(kw)
    else:
      missing.append(kw)
  return found, missing
