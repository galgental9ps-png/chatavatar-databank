"""Analyze the existing artwork into motion vectors; the source images stay unchanged.

Optional build dependencies: Pillow, numpy, opencv-python-headless.
The shipped browser runtime needs no Python or image-processing service.
"""
import base64
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SIZE, GRID, UNITS = 256, 32, 2048
HEAD_X = [.6115,.6102,.6102,.6115,.6115,.6102,.6102,.6115,.6115,.6102,.6102,.6115,.6115,.6102,.6134,.6115]
FLOOR_Y = [.9650,.9618,.9650,.9682,.9712,.9681,.9712,.9617,.9681,.9681,.9744,.9712,.9682,.9682,.9682,.9682]
SCALE = .98


def analyze():
    sheet = np.array(Image.open(ROOT / 'assets/tva-walk-v3.webp').convert('RGBA'))
    frames = []
    for i in range(16):
        x, y = i % 4, i // 4
        h, w = sheet.shape[:2]
        cell = sheet[round(y*h/4):round((y+1)*h/4), round(x*w/4):round((x+1)*w/4)]
        alpha = np.clip((cell[:, :, 3].astype(np.float32)/255 - .03)/.84, 0, 1)
        gray = cv2.cvtColor(cell[:, :, :3], cv2.COLOR_RGB2GRAY)
        gray = np.uint8(gray*alpha + 218*(1-alpha))
        matrix = np.array([[SIZE*SCALE/cell.shape[1],0,(.62-HEAD_X[i]*SCALE)*SIZE],
                           [0,SIZE*SCALE/cell.shape[0],(.958-FLOOR_Y[i]*SCALE)*SIZE]])
        frames.append(cv2.warpAffine(gray, matrix, (SIZE,SIZE), borderValue=218))
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(0)
    dis.setVariationalRefinementIterations(15)
    samples = np.linspace(0, SIZE-1, GRID+1).astype(np.float32)
    xx, yy = np.meshgrid(samples, samples)
    vectors = []
    stats = []
    for i in range(16):
        for a,b in [(i,(i+1)%16),((i+1)%16,i)]:
            flow = dis.calc(frames[a], frames[b], None)
            # Smooth local estimates without turning arm motion into whole-body wobble.
            flow = cv2.GaussianBlur(flow, (3,3), .65)
            grid = cv2.remap(flow, xx, yy, cv2.INTER_LINEAR)
            grid = np.clip(grid, -40, 40)
            grid[0,:,:] = grid[-1,:,:] = 0
            grid[:,0,:] = grid[:,-1,:] = 0
            vectors.append(np.rint(grid/SIZE*UNITS).astype('<i2'))
            stats.append(float(np.percentile(np.linalg.norm(grid,axis=2),95)))
    data = np.stack(vectors)
    payload = base64.b64encode(data.tobytes()).decode()
    info = {'grid':GRID,'units':UNITS,'frames':16,'vectors':payload}
    (ROOT/'walk-flow.js').write_text('/* Motion vectors analyzed from the existing Tavi walk atlas. */\nwindow.ChatAvatarWalkFlow='+json.dumps(info,separators=(',',':'))+';\n')
    print(json.dumps({'vectors':list(data.shape),'bytes':data.nbytes,'max95MotionPixels':round(max(stats),2)}))


if __name__ == '__main__':
    analyze()
