import sys

data = open(sys.argv[1], "rb").read()
W = H = 763
print("bytes", len(data), "expected", W * H * 4)


def px(x, y):
    i = (y * W + x) * 4
    return data[i:i + 4]


def aruns(y):
    out, s = [], None
    for x in range(W):
        v = px(x, y)[3] > 128
        if v and s is None:
            s = x
        if not v and s is not None:
            out.append((s, x - 1))
            s = None
    if s is not None:
        out.append((s, W - 1))
    return out


def cruns(x):
    out, s = [], None
    for y in range(H):
        v = px(x, y)[3] > 128
        if v and s is None:
            s = y
        if not v and s is not None:
            out.append((s, y - 1))
            s = None
    if s is not None:
        out.append((s, H - 1))
    return out


for y in [100, 130, 180, 240, 300, 380, 480, 520, 600, 640, 660]:
    print("row", y, aruns(y))
for x in [100, 140, 200, 260, 330, 378, 500, 560, 620, 660]:
    print("col", x, cruns(x))


def white(p):
    return p[0] > 230 and p[1] > 230 and p[2] > 230 and p[3] > 128


xs, ys = [], []
for y in range(H):
    for x in range(W):
        if white(px(x, y)):
            xs.append(x)
            ys.append(y)
print("white bbox", min(xs), min(ys), max(xs), max(ys))
for y in [230, 260, 300, 340, 370, 400, 430, 470, 500, 520]:
    out, s = [], None
    for x in range(150, 600):
        v = white(px(x, y))
        if v and s is None:
            s = x
        if not v and s is not None:
            out.append((s, x - 1))
            s = None
    if s is not None:
        out.append((s, 599))
    print("white row", y, out)
