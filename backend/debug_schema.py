
from main import LawyerModel, ContentSubmission, LAWYERS_DB, SUBMISSIONS_DB
from pydantic import ValidationError

print(f"Checking {len(LAWYERS_DB)} lawyers...")
for i, lawyer in enumerate(LAWYERS_DB):
    try:
        LawyerModel(**lawyer)
    except ValidationError as e:
        print(f"Lawyer {i} ({lawyer.get('name')}) validation error: {e}")
    except Exception as e:
        print(f"Lawyer {i} Error: {e}")

print(f"Checking {len(SUBMISSIONS_DB)} submissions...")
for i, sub in enumerate(SUBMISSIONS_DB):
    try:
        ContentSubmission(**sub)
    except ValidationError as e:
        print(f"Submission {i} validation error: {e}")
    except Exception as e:
        print(f"Submission {i} Error: {e}")
