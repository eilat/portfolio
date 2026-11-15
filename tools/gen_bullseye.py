"""BullsEye screen tour (projects/cooling.html). See flow_tour.py for the format.
Usage: python3 tools/gen_bullseye.py <portfolio_root> [--images]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from flow_tour import build
W, H = 1280, 832
tiles = [(98, 273), (384.3, 273), (670.5, 273), (956.8, 273), (98, 467), (384.3, 467), (670.5, 467), (956.8, 467), (98, 661), (384.3, 661), (670.5, 661)]
SHOTS = [
 ('f-overview', 'Camera overview: the state of each cooling group and a tile for every camera',
  [('s1-base', 0, 0)] + [(f's1-card{i+1}', x, 124) for i, x in enumerate([110, 497.3, 884.7])] + [(f's1-cam{i+1}', x, y) for i, (x, y) in enumerate(tiles)]),
 ('f-live', 'A single camera: the image of the feed lane with a region for every feeding spot',
  [('s2-base', 0, 0), ('s2-top', 102, 165), ('s2-bottom', 98, 520)]),
 ('f-tip', 'The same camera with a tooltip over one feeding spot: fan speed, cows and time in the region', [('s2-tip', 0, 0)]),
 ('f-fan', 'The same camera with one fan selected and the spots it covers outlined in green', [('s2-fansel', 0, 0)]),
 ('f-basic', 'Group schedule in basic settings', [('s3-basic', 0, 0)]),
 ('f-advanced', 'Group schedule with advanced settings switched on', [('s3-adv', 0, 0)]),
]
STEPS = [
 ('Check', 'Every camera and every cooling group on one screen. A camera that is down stands out at once.'),
 ('Open a camera', 'The live image comes first, and every feeding spot is a region on it. Hover a spot for its details.'),
 ('Check a fan', 'Pick a fan to see exactly which spots it covers.'),
 ('Adjust', 'Basic settings hold the times that change from day to day. Everything else is one toggle away.'),
]
TIMELINE = [
 ('hold', .5), ('move', 229, 358, .5), ('click', 1), ('step', 1), ('hold', .45),
 ('move', 428, 268, .4), ('show', 2), ('hold', .55),          # hover spot 26: tooltip
 ('move', 500, 205, .14), ('show', 1), ('move', 632, 123, .34), ('click', 3), ('step', 2), ('hold', .7),
 ('move', 40, 188, .55), ('click', 4), ('step', 3), ('hold', .5),
 ('move', 940, 90, .5), ('click', 5), ('hold', .8),
]
build(sys.argv[1], dict(page='projects/cooling.html', w=W, h=H, folder='work/cooling/tour', ext='webp',
    label='Screen tour: a farmer’s path through BullsEye', shots=SHOTS, steps=STEPS, start=(760, 610), unit=78, timeline=TIMELINE))
