class TestStudentCAInteraction(unittest.TestCase):
    """
    - student asks a question -> shows up on ca page in table and # questions
    - student deletes question -> removes from ca page
    - student freezes question -> hides on ca page
    - edit question for student shows on ca page
    - ca logout affects other ca's number of cas online
    - minute rules updates shows elsewhere
    - open and close goes to student, other CAs
    - answer, kick, finish , freeze events for student
    """
