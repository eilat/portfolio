"""Doctor-patient platform screen tour (projects/care-platform.html). See flow_tour.py.
Usage: python3 tools/gen_care.py <portfolio_root> [--images]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from flow_tour import build
W, H = 1440, 1024
SHOTS = [
 ('f-patients', 'Doctor view, My Patients: a table of patients with question status tags',
  [('s1-base', 0, 0), ('s1-title', 20, 80), ('s1-banner', 20, 167), ('s1-table', 20, 239)]),
 ('f-chat', 'Doctor view: a conversation with a patient, with earlier conversations listed beside it',
  [('s3-base', 0, 0), ('s3-date', 44, 249), ('s3-msg1', 44, 282), ('s3-date', 44, 408), ('s3-msg2', 44, 441), ('s3-date', 44, 693), ('s3-msg3', 44, 726)]),
 ('f-payments', 'Doctor view, My Account: payment tracking with summary charts and an invoice list',
  [('s2-base', 0, 0), ('s2-box1', 39, 190), ('s2-box2', 418, 190), ('s2-box3', 797, 190), ('s2-field', 956, 312), ('s2-donutcard', 39, 372),
   ('s2-donut', 199.5, 434.5), ('s2-revcard', 431, 372), ('s2-bars', 431, 413), ('s2-table', 39, 606)]),
]
STEPS = [
 ('See who is waiting', 'My Patients puts open questions first. Status tags show who needs a response, and who needs it now.'),
 ('Answer', 'The conversation opens with the patient’s details on top and earlier conversations beside it, so the history stays in view while writing.'),
 ('Track payments', 'In My Account, summary charts and the invoice list share one screen, with the details of the selected invoice beside it.'),
]
TIMELINE = [
 ('hold', .5), ('move', 1085, 532, .55), ('click', 1), ('step', 1), ('hold', .8),
 ('move', 1300, 853, .6), ('click', 2), ('step', 2), ('hold', .9),
]
build(sys.argv[1], dict(page='projects/care-platform.html', w=W, h=H, folder='work/care/tour', ext='png',
    label='Screen tour: a doctor’s path through the platform', shots=SHOTS, steps=STEPS, start=(620, 700), unit=78, timeline=TIMELINE))
