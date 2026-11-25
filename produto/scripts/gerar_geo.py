# gera o src/data/geo.json (rios, estados e rotas) a partir do Natural Earth
# arquivos em github.com/nvkelso/natural-earth-vector (pasta geojson)
# uso: python3 scripts/gerar_geo.py ne_10m_rivers_lake_centerlines.geojson ne_50m_admin_1_states_provinces.geojson src/data/geo.json
import json, math, sys, heapq

RIVERS = sys.argv[1]; STATES = sys.argv[2]; OUT = sys.argv[3]
BBOX = (-74.3, -10.3, -55.8, 2.7)

TIPO = {
    'Negro': 'preta', 'Uaupés': 'preta', 'Unini': 'preta',
    'Amazonas': 'branca', 'Madeira': 'branca', 'Purús': 'branca', 'Juruá': 'branca',
    'Japurá': 'branca', 'Putumayo': 'branca', 'Javari': 'branca',
    'Branco': 'outro', 'Jutaí': 'outro', 'Coari': 'outro', 'Ituxi': 'outro',
    'Aripuanã': 'outro', 'Nhamundá': 'outro',
}
NOME = {'Purús': 'Purus', 'Putumayo': 'Içá', 'Uaupés': 'Uaupés'}
TOL = {'preta': 0.004, 'branca': 0.004, 'outro': 0.012}

def dp(pts, tol):
    if len(pts) < 3: return pts
    keep = [False]*len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts)-1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx-ax, by-ay; L = math.hypot(dx, dy) or 1e-12
        best, idx = -1, None
        for i in range(a+1, b):
            px, py = pts[i]
            d = abs(dy*px - dx*py + bx*ay - by*ax)/L
            if d > best: best, idx = d, i
        if best > tol:
            keep[idx] = True; stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]

def dp_ring(pts, tol):
    if len(pts) < 5: return pts
    k = max(range(len(pts)), key=lambda i: (pts[i][0]-pts[0][0])**2 + (pts[i][1]-pts[0][1])**2)
    a = dp(pts[:k+1], tol); b = dp(pts[k:], tol)
    return a[:-1] + b

def inbox(p): return BBOX[0] <= p[0] <= BBOX[2] and BBOX[1] <= p[1] <= BBOX[3]

def clip(line):
    out, cur = [], []
    for p in line:
        if inbox(p): cur.append(p)
        else:
            if len(cur) > 1: out.append(cur)
            cur = []
    if len(cur) > 1: out.append(cur)
    return out

def lines_of(g):
    return [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']

def rnd(p, n=3): return [round(p[0], n), round(p[1], n)]

def hav(a, b):  # distancia em km, pontos [lon, lat]
    R = 6371.0
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dla = la2-la1; dlo = math.radians(b[0]-a[0])
    h = math.sin(dla/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlo/2)**2
    return 2*R*math.asin(math.sqrt(h))

# rios
rios = {}
src = json.load(open(RIVERS))
for f in src['features']:
    nm = f['properties'].get('name')
    if nm not in TIPO or not f.get('geometry'): continue
    for ln in lines_of(f['geometry']):
        for part in clip(ln):
            rios.setdefault(nm, []).append(part)

# separa Solimoes e Amazonas no encontro com o Negro
foz_negro = min((ln[0] if abs(ln[0][0]+59.9) < abs(ln[-1][0]+59.9) else ln[-1]) for ln in rios['Negro']
                for _ in [0] if min(abs(ln[0][0]+59.9), abs(ln[-1][0]+59.9)) < 0.3)
sol, ama = [], []
best = None
for li, ln in enumerate(rios['Amazonas']):
    for i, q in enumerate(ln):
        d = (q[0]-foz_negro[0])**2 + (q[1]-foz_negro[1])**2
        if best is None or d < best[0]: best = (d, li, i)
_, li_split, i_split = best
for li, ln in enumerate(rios.pop('Amazonas')):
    if li != li_split:
        (sol if ln[len(ln)//2][0] < -59.9 else ama).append(ln); continue
    a, b = ln[:i_split+1], ln[i_split:]
    west_first = ln[0][0] < ln[-1][0]
    if west_first: sol.append(a); ama.append(b)
    else: ama.append(a); sol.append(b)
rios['Solimões'] = sol; rios['Amazonas'] = ama
TIPO['Solimões'] = 'branca'

simpl = {}
for nm, lns in rios.items():
    t = TIPO[nm]
    simpl[nm] = [[rnd(p) for p in dp(ln, TOL[t])] for ln in lns]

feat_rios = []
for nm, lns in simpl.items():
    for ln in lns:
        feat_rios.append({'type': 'Feature', 'properties': {'nome': NOME.get(nm, nm), 'agua': TIPO[nm]},
                          'geometry': {'type': 'LineString', 'coordinates': ln}})

# estados
st = json.load(open(STATES))
feat_est = []
for f in st['features']:
    p = f['properties']
    if p.get('admin') != 'Brazil': continue
    g = f['geometry']
    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
    near = any(inbox(pt) for poly in polys for ring in poly for pt in ring)
    if not near: continue
    out = []
    for poly in polys:
        rings = [[rnd(q) for q in dp_ring(r, 0.015)] for r in poly]
        rings = [r for r in rings if len(r) >= 4]
        if rings: out.append(rings)
    feat_est.append({'type': 'Feature', 'properties': {'nome': p.get('name'), 'uf': (p.get('postal') or '')},
                     'geometry': {'type': 'MultiPolygon', 'coordinates': out}})

# grafo dos rios pra tracar as rotas
MAIN = ['Negro', 'Solimões', 'Amazonas', 'Madeira', 'Purús']
nodes, adj = [], {}
def add_node(p):
    nodes.append(p); adj[len(nodes)-1] = []; return len(nodes)-1
river_nodes = {}
for nm in MAIN:
    for ln in simpl[nm]:
        ids = [add_node(p) for p in ln]
        river_nodes.setdefault(nm, []).extend(ids)
        for a, b in zip(ids, ids[1:]):
            w = hav(nodes[a], nodes[b]); adj[a].append((b, w)); adj[b].append((a, w))
# liga a ponta de cada rio no vertice mais proximo (confluencias)
all_ids = list(range(len(nodes)))
for nm in MAIN:
    k = 0
    for ln in simpl[nm]:
        start = river_nodes[nm][k]; end = river_nodes[nm][k+len(ln)-1]; k += len(ln)
        for e in (start, end):
            best, bj = 1e9, None
            for j in all_ids:
                if j == e: continue
                if j in (start, end): continue
                d = hav(nodes[e], nodes[j])
                if d < best and abs(j-e) > 2: best, bj = d, j
            if bj is not None and best < 25:
                adj[e].append((bj, best)); adj[bj].append((e, best))

def dijkstra(s, t):
    dist = {s: 0.0}; prev = {}; pq = [(0.0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == t: break
        if d > dist.get(u, 1e18): continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
    if t not in dist: return None, None
    path = [t]
    while path[-1] != s: path.append(prev[path[-1]])
    return [nodes[i] for i in reversed(path)], dist[t]

PONTOS = {
    'b1': ('Negro', [-60.02, -3.14]), 'b2': ('Solimões', [-64.71, -3.30]), 'b3': ('Amazonas', [-58.44, -3.14]),
    'c01': ('Amazonas', [-59.80, -3.20]), 'c02': ('Solimões', [-60.25, -3.27]), 'c03': ('Solimões', [-60.75, -3.32]),
    'c04': ('Negro', [-60.90, -2.65]), 'c05': ('Negro', [-60.30, -3.02]), 'c06': ('Solimões', [-61.65, -3.77]),
    'c07': ('Solimões', [-62.10, -3.84]), 'c08': ('Solimões', [-63.20, -4.08]), 'c09': ('Solimões', [-64.05, -3.62]),
    'c10': ('Solimões', [-66.05, -2.50]), 'c11': ('Purús', [-61.40, -3.95]), 'c12': ('Madeira', [-59.60, -4.40]),
    'c13': ('Madeira', [-59.10, -3.90]), 'c14': ('Amazonas', [-58.70, -3.10]), 'c15': ('Negro', [-62.85, -1.00]),
    'c16': ('Solimões', [-60.45, -3.35]), 'c17': ('Solimões', [-67.95, -3.10]), 'c18': ('Amazonas', [-56.75, -2.62]),
}
def project(p, nm):
    # joga o ponto no trecho de rio mais proximo e cria um no no grafo
    best = None
    ids = river_nodes[nm]
    for a in ids:
        for b, _w in adj[a]:
            if b not in ids or b < a: continue
            ax, ay = nodes[a]; bx, by = nodes[b]
            dx, dy = bx-ax, by-ay; L2 = dx*dx+dy*dy or 1e-12
            t = max(0, min(1, ((p[0]-ax)*dx + (p[1]-ay)*dy)/L2))
            q = [ax+t*dx, ay+t*dy]
            d = (q[0]-p[0])**2 + (q[1]-p[1])**2
            if best is None or d < best[0]: best = (d, a, b, q)
    _, a, b, q = best
    j = add_node(q); river_nodes[nm].append(j)
    for e in (a, b):
        w = hav(q, nodes[e]); adj[j].append((e, w)); adj[e].append((j, w))
    return j
snap = {k: project(p, nm) for k, (nm, p) in PONTOS.items()}

BASE = {'c01':'b1','c02':'b1','c03':'b1','c04':'b1','c05':'b1','c06':'b1','c07':'b1','c11':'b1','c15':'b1','c16':'b1',
        'c08':'b2','c09':'b2','c10':'b2','c17':'b2','c12':'b3','c13':'b3','c14':'b3','c18':'b3'}
ALT = {'c01': -1, 'c02': 1, 'c03': 1, 'c04': 1, 'c11': -1, 'c12': -1}

def bulge(path, side):
    # alternativa esquematica: vai pelo rio e no final desvia por um furo/parana
    total = sum(hav(a, b) for a, b in zip(path, path[1:]))
    cut = max(total*0.55, total-45)
    acc, i = 0.0, 0
    while i < len(path)-1 and acc + hav(path[i], path[i+1]) < cut:
        acc += hav(path[i], path[i+1]); i += 1
    head = path[:i+1]; a = path[i]; b = path[-1]
    mx, my = (a[0]+b[0])/2, (a[1]+b[1])/2
    dx, dy = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dy) or 1e-9
    off = min(0.09, max(0.03, L*0.35))
    cx, cy = mx - dy/L*off*side, my + dx/L*off*side
    curve = []
    for k in range(1, 15):
        t = k/14
        x = (1-t)**2*a[0] + 2*(1-t)*t*cx + t**2*b[0]
        y = (1-t)**2*a[1] + 2*(1-t)*t*cy + t**2*b[1]
        curve.append([x, y])
    full = head + curve
    km = sum(hav(p, q) for p, q in zip(full, full[1:]))
    return full, km

pontos_out = {k: [round(nodes[j][1], 4), round(nodes[j][0], 4)] for k, j in snap.items()}
rotas_out = {}
for c, b in BASE.items():
    path, km = dijkstra(snap[b], snap[c])
    if path is None:
        print('SEM CAMINHO', c, b, file=sys.stderr); continue
    rotas_out['p-'+c] = {'km': round(km, 1), 'coords': [[round(p[1], 4), round(p[0], 4)] for p in path]}
    if c in ALT:
        full, km2 = bulge(path, ALT[c])
        rotas_out['a-'+c] = {'km': round(km2, 1), 'coords': [[round(p[1], 4), round(p[0], 4)] for p in full]}

out = {
    'fonte': 'Natural Earth (domínio público), simplificado. Rotas: traçado esquemático.',
    'rios': {'type': 'FeatureCollection', 'features': feat_rios},
    'estados': {'type': 'FeatureCollection', 'features': feat_est},
    'pontos': pontos_out,
    'rotas': rotas_out,
}
json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print('ok:', len(feat_rios), 'trechos de rio,', len(rotas_out), 'rotas')
