class TestCAPage(unittest.TestCase):
    """
     - number of CAs online shows up, updates, and is accurate
     - number of questions shows up, updates, is accurate 
     - queue shows, updates, does not show frozen questions 
     - minute rule shows and is updatable
     - can open and close queue
     - can answer question:
        - freeze
        - kick 
        - finish 
    """