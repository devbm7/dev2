import random
import string
from typing import Optional
import spacy
from spacy.matcher import Matcher
import uuid
import time
import copy
from typing import Dict

STAR_NAMES = [
    "sirius", "vega", "betelgeuse", "rigel", "aldebaran", "procyon",
    "polaris", "antares", "altair", "deneb", "spica", "arcturus",
    "canopus", "capella", "achernar", "fomalhaut", "castor", "pollux",
    "mirfak", "dubhe", "merak", "mizar", "alcor", "alnilam", "bellatrix"
]

PREFIXES = ["stellar", "nova", "galactic", "cosmic", "supernova"]

def generate_job_id_from_star(
    include_prefix: bool = False,
    digit_count: int = 4,
    separator: str = "-"
) -> str:
    """
    Generate a fun, unique, and readable job ID based on the name of a star.

    The ID is composed of:
        - An optional cosmic prefix (e.g., 'nova', 'stellar') [optional]
        - A random star name (e.g., 'vega', 'polaris')
        - A numeric suffix (e.g., '7312') to ensure uniqueness

    Args:
        include_prefix (bool): Whether to prepend a random cosmic prefix to the ID.
        digit_count (int): Number of digits to append as a suffix. Default is 4.
        separator (str): Character used to separate parts of the ID. Default is '-'.

    Returns:
        str: A unique job identifier string, e.g., 'vega-1234' or 'nova-vega-5678'.
    """
    parts = []
    if include_prefix:
        parts.append(random.choice(PREFIXES))

    parts.append(random.choice(STAR_NAMES))
    parts.append(''.join(random.choices(string.digits, k=digit_count)))

    return separator.join(parts)

nlp = spacy.load("en_core_web_sm")
matcher = Matcher(nlp.vocab)

def extract_entities(text: str) -> Dict:
    """
    Use spaCy to extract entities like title, organization, location, etc.
    """
    doc = nlp(text)
    entities = {ent.label_: ent.text for ent in doc.ents}
    return entities

