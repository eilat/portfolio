"""Doctor-patient platform screen tour (projects/care-platform.html). See flow_tour.py.
Two tracks: the doctor's side, then the patient's side.
Screens are flat 2x exports from the Figma section
'Portfolio tour · healthcare source (edit here, then re-export)'.
Usage: python3 tools/gen_care.py <portfolio_root>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from flow_tour import build
W, H = 1440, 1024
SHOTS = [
 ('f-d-dashboard', 'Doctor view, dashboard: key numbers and the open questions, with how long each has waited', []),
 ('f-d-requests', 'Doctor view, patient requests: every question, with tabs for awaiting a response, premium and closed', []),
 ('f-d-chat', 'Doctor view: a conversation with a patient, with earlier conversations listed beside it', []),
 ('f-d-payments', 'Doctor view, My Account: payment tracking with summary charts and an invoice list', []),
 ('f-p-doctors', 'Patient view, My Doctors: a card for each doctor with the open question and the package in use', []),
 ('f-p-chat', 'Patient view: a conversation with the doctor, with earlier questions beside it', []),
 ('f-p-buy', 'Patient view, My Account: question packages side by side, with the most popular one marked', []),
]
STEPS = [
 ('See who is waiting', 'The dashboard opens with the open questions and how long each has waited, under a few key numbers.', 'Doctor'),
 ('Open a request', 'Patient requests gathers every question, with tabs for those awaiting a response, premium patients and closed questions.', 'Doctor'),
 ('Answer', 'The conversation opens with the patient’s details on top and earlier conversations beside it, so the history stays in view while writing.', 'Doctor'),
 ('Track payments', 'In My Account, summary charts and the invoice list share one screen, with the details of the selected invoice beside it.', 'Doctor'),
 ('My doctors', 'Each doctor has a card showing whether a question is open and which package is in use, with the package history below.', 'Patient'),
 ('Ask and follow up', 'The patient’s conversation mirrors the doctor’s, with earlier questions beside it.', 'Patient'),
 ('Buy a package', 'Packages sit side by side, with the most popular one marked. The patient picks the doctor first, then the package.', 'Patient'),
]
TIMELINE = [
 ('hold', .5), ('move', 1297, 231, .55), ('click', 1), ('step', 1), ('hold', .8),
 ('move', 800, 420, .5), ('click', 2), ('step', 2), ('hold', .9),
 ('move', 1300, 853, .6), ('click', 3), ('step', 3), ('hold', .9),
 ('move', 1300, 177, .55), ('click', 4), ('step', 4), ('hold', .9),
 ('move', 748, 160, .5), ('click', 5), ('step', 5), ('hold', .9),
 ('move', 1300, 853, .6), ('click', 6), ('step', 6), ('hold', 1),
]
build(sys.argv[1], dict(page='projects/care-platform.html', w=W, h=H, folder='work/care/tour', ext='webp',
    label='Screen tour: the doctor’s side and the patient’s side', shots=SHOTS, steps=STEPS, start=(700, 600), unit=70, timeline=TIMELINE))
