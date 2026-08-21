"""
Generate High-Definition, Realistic Multi-Spectral Satellite Pipeline Visual Snapshots
For AgriProof AI 7-Stage Earth Observation Vision Flow
"""
import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r"E:\sage\agriproof-ai\frontend\public\assets\snapshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 640, 400

def create_base_satellite_landscape(seed=42):
    random.seed(seed)
    img = Image.new("RGB", (WIDTH, HEIGHT), (20, 35, 15))
    draw = ImageDraw.Draw(img)

    # Draw base terrain gradient
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(22 + ratio * 15 + random.randint(-2, 2))
        g = int(48 + ratio * 20 + random.randint(-3, 3))
        b = int(18 + ratio * 12 + random.randint(-2, 2))
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Draw agricultural field parcels
    cols = 16
    rows = 10
    col_w = WIDTH // cols
    row_h = HEIGHT // rows

    for r in range(rows):
        for c in range(cols):
            x1 = c * col_w + random.randint(-4, 4)
            y1 = r * row_h + random.randint(-4, 4)
            x2 = (c + 1) * col_w + random.randint(-4, 4)
            y2 = (r + 1) * row_h + random.randint(-4, 4)

            # Crop color variations (lush green, dry wheat, fallow soil)
            crop_variant = random.random()
            if crop_variant > 0.65:
                # Lush green
                color = (
                    random.randint(35, 65),
                    random.randint(95, 145),
                    random.randint(30, 60)
                )
            elif crop_variant > 0.3:
                # Moderate green / olive
                color = (
                    random.randint(60, 95),
                    random.randint(110, 150),
                    random.randint(45, 75)
                )
            else:
                # Harvested / dry soil
                color = (
                    random.randint(115, 155),
                    random.randint(100, 135),
                    random.randint(65, 95)
                )

            draw.rectangle([x1, y1, x2, y2], fill=color, outline=(25, 45, 20), width=1)

            # Internal crop furrows
            furrow_dir = random.choice(["h", "v"])
            if furrow_dir == "h":
                for fy in range(y1 + 4, y2 - 2, 6):
                    draw.line([(x1 + 2, fy), (x2 - 2, fy)], fill=(int(color[0]*0.85), int(color[1]*0.85), int(color[2]*0.85)), width=1)
            else:
                for fx in range(x1 + 4, x2 - 2, 6):
                    draw.line([(fx, y1 + 2), (fx, y2 - 2)], fill=(int(color[0]*0.85), int(color[1]*0.85), int(color[2]*0.85)), width=1)

    # Add road network
    draw.line([(0, 180), (WIDTH, 220)], fill=(130, 125, 110), width=3)
    draw.line([(240, 0), (280, HEIGHT)], fill=(130, 125, 110), width=3)

    # Add canal / river
    water_pts = []
    for x in range(0, WIDTH, 20):
        y = int(320 + math.sin(x * 0.02) * 25 + random.randint(-2, 2))
        water_pts.append((x, y))
    for i in range(len(water_pts) - 1):
        draw.line([water_pts[i], water_pts[i+1]], fill=(30, 65, 95), width=5)

    return img

# 1. Stage 1: ROI Definition
def make_stage1():
    img = create_base_satellite_landscape(101)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Polygon ROI
    poly = [(180, 90), (460, 110), (490, 310), (210, 290)]
    d.polygon(poly, fill=(0, 230, 120, 55), outline=(0, 255, 140, 255))
    
    # Draw glowing outline
    for off in [2, 3]:
        d.polygon(poly, outline=(0, 255, 140, 120))

    # Corner vertex pins
    for pt in poly:
        d.ellipse([pt[0]-6, pt[1]-6, pt[0]+6, pt[1]+6], fill=(0, 255, 180, 255), outline=(255, 255, 255, 255), width=2)

    # Center target reticle
    cx, cy = 335, 200
    d.line([(cx-18, cy), (cx+18, cy)], fill=(0, 255, 180, 220), width=2)
    d.line([(cx, cy-18), (cx, cy+18)], fill=(0, 255, 180, 220), width=2)
    d.ellipse([cx-10, cy-10, cx+10, cy+10], outline=(0, 255, 180, 220), width=2)

    # Badge HUD
    d.rounded_rectangle([20, 20, 220, 55], radius=6, fill=(10, 16, 26, 220), outline=(0, 230, 120, 180))
    d.text((32, 28), "STAGE 01: ROI BOUNDARY", fill=(0, 255, 180, 255))
    d.text((32, 42), "Area: 8.5 ha | 30.3398°N, 76.3869°E", fill=(200, 230, 210, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage1_roi.png"))

# 2. Stage 2: (Down)load Satellite Imagery
def make_stage2():
    img = create_base_satellite_landscape(202)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Sentinel-2 + PlanetScope dual capture split
    d.rectangle([0, 0, WIDTH, HEIGHT], fill=(0, 15, 30, 40))

    # Satellite scan grid overlay
    for y in range(0, HEIGHT, 20):
        d.line([(0, y), (WIDTH, y)], fill=(0, 163, 255, 30), width=1)
    for x in range(0, WIDTH, 20):
        d.line([(x, 0), (x, HEIGHT)], fill=(0, 163, 255, 30), width=1)

    # Sensor swath laser line
    d.line([(0, 160), (WIDTH, 160)], fill=(0, 220, 255, 220), width=2)
    d.rectangle([0, 130, WIDTH, 160], fill=(0, 200, 255, 35))

    # Telemetry HUD
    d.rounded_rectangle([20, 20, 260, 60], radius=6, fill=(10, 16, 26, 230), outline=(0, 163, 255, 180))
    d.text((32, 28), "STAGE 02: SATELLITE INGEST", fill=(0, 200, 255, 255))
    d.text((32, 44), "Sentinel-2 MSI (10m) + PlanetScope (3m)", fill=(180, 220, 255, 255))

    # Right badge
    d.rounded_rectangle([WIDTH-210, 20, WIDTH-20, 60], radius=6, fill=(10, 16, 26, 230), outline=(0, 163, 255, 180))
    d.text((WIDTH-195, 28), "SPECTRAL BANDS: 13", fill=(0, 220, 255, 255))
    d.text((WIDTH-195, 44), "B02, B03, B04, B08, B11, B12", fill=(180, 220, 255, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage2_satellite_raw.png"))

# 3. Stage 3: Cloud Masking
def make_stage3():
    img = create_base_satellite_landscape(303)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Draw semi-transparent cloud masses
    cloud_pts = [
        (120, 80, 100), (200, 110, 130), (160, 150, 110),
        (500, 280, 120), (560, 240, 110), (450, 320, 90)
    ]
    for cx, cy, rad in cloud_pts:
        d.ellipse([cx-rad, cy-rad*0.7, cx+rad, cy+rad*0.7], fill=(240, 250, 255, 180))
        # Mask hatch pattern
        d.ellipse([cx-rad*0.8, cy-rad*0.5, cx+rad*0.8, cy+rad*0.5], fill=(255, 255, 255, 210))

    # Mask probability boundary
    d.polygon([(60, 40), (280, 60), (250, 200), (80, 180)], outline=(255, 200, 0, 200), width=2)
    d.polygon([(400, 200), (620, 180), (600, 380), (380, 360)], outline=(255, 200, 0, 200), width=2)

    # HUD
    d.rounded_rectangle([20, 20, 250, 60], radius=6, fill=(10, 16, 26, 230), outline=(255, 180, 0, 180))
    d.text((32, 28), "STAGE 03: CLOUD MASKING", fill=(255, 200, 0, 255))
    d.text((32, 44), "s2cloudless Filter | 99.4% Usable Pixels", fill=(255, 230, 160, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage3_cloud_mask.png"))

# 4. Stage 4: NDWI / NDVI Feature Extraction
def make_stage4():
    img = Image.new("RGB", (WIDTH, HEIGHT), (10, 20, 15))
    draw = ImageDraw.Draw(img)

    # Generate full heatmap (NDVI spectrum: red=stressed, yellow=moderate, green=vigorous)
    for y in range(HEIGHT):
        for x in range(0, WIDTH, 8):
            n = (math.sin(x * 0.015) + math.cos(y * 0.02) + 2.0) / 4.0
            # Anomaly patch in middle
            dist_to_center = math.hypot(x - 340, y - 200)
            if dist_to_center < 130:
                n = max(0.15, n - (130 - dist_to_center) / 130 * 0.55)

            if n > 0.6:
                r, g, b = int(30 + (n-0.6)*60), int(160 + (n-0.6)*180), int(40)
            elif n > 0.35:
                r, g, b = int(220 + (n-0.35)*100), int(180 + (n-0.35)*120), int(20)
            else:
                r, g, b = int(200 - n*80), int(40 + n*60), int(30)

            draw.rectangle([x, y, x+8, y+8], fill=(r, g, b))

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Color bar legend
    d.rounded_rectangle([WIDTH-170, HEIGHT-70, WIDTH-20, HEIGHT-20], radius=6, fill=(10, 16, 26, 230), outline=(255, 255, 255, 100))
    d.text((WIDTH-155, HEIGHT-62), "NDVI: -0.2 (Low) → 0.85 (Lush)", fill=(255, 255, 255, 240))
    for i in range(120):
        t = i / 120
        c = (int(200*(1-t) + 30*t), int(40*(1-t) + 220*t), int(30))
        d.line([(WIDTH-150+i, HEIGHT-38), (WIDTH-150+i, HEIGHT-28)], fill=c)

    # HUD
    d.rounded_rectangle([20, 20, 250, 60], radius=6, fill=(10, 16, 26, 230), outline=(0, 220, 255, 180))
    d.text((32, 28), "STAGE 04: FEATURE EXTRACTION", fill=(0, 220, 255, 255))
    d.text((32, 44), "NDVI (Canopy) + NDWI (Moisture Index)", fill=(180, 230, 255, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage4_ndwi_feature.png"))

# 5. Stage 5: Thresholding
def make_stage5():
    img = Image.new("RGB", (WIDTH, HEIGHT), (12, 14, 20))
    draw = ImageDraw.Draw(img)

    # Binary mask: black/dark blue for normal, bright amber/red for thresholded damage
    for y in range(0, HEIGHT, 8):
        for x in range(0, WIDTH, 8):
            dist = math.hypot(x - 340, y - 200)
            if dist < 120 and (x > 220 and y > 120 and x < 460 and y < 300):
                draw.rectangle([x, y, x+7, y+7], fill=(220, 50, 40))
            else:
                draw.rectangle([x, y, x+7, y+7], fill=(20, 30, 45))

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Severe damage boundary
    d.rectangle([216, 116, 464, 304], outline=(255, 70, 50, 255), width=3)
    d.text((230, 126), "THRESHOLD ANOMALY (ΔNDVI > 35%)", fill=(255, 220, 200, 255))

    # HUD
    d.rounded_rectangle([20, 20, 260, 60], radius=6, fill=(10, 16, 26, 230), outline=(255, 70, 50, 180))
    d.text((32, 28), "STAGE 05: DAMAGE THRESHOLD", fill=(255, 70, 50, 255))
    d.text((32, 44), "Otsu Spectral Cutoff | XGBoost Loss Model", fill=(255, 180, 170, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage5_ndwi_threshold.png"))

# 6. Stage 6: Vectorize Water / Damage Extent
def make_stage6():
    img = create_base_satellite_landscape(606)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Damage vector contour polygon
    contour = [
        (220, 130), (290, 120), (380, 140), (450, 130),
        (470, 200), (460, 270), (390, 295), (280, 285),
        (215, 230), (210, 170)
    ]
    d.polygon(contour, fill=(255, 100, 0, 70), outline=(255, 150, 0, 255))
    for pt in contour:
        d.ellipse([pt[0]-4, pt[1]-4, pt[0]+4, pt[1]+4], fill=(255, 220, 0, 255), outline=(0, 0, 0, 255), width=1)

    # GeoJSON Vector callout
    d.rounded_rectangle([250, 180, 430, 240], radius=6, fill=(10, 16, 26, 240), outline=(255, 150, 0, 220))
    d.text((262, 192), "GeoJSON Polygon Extent", fill=(255, 200, 0, 255))
    d.text((262, 212), "Damage Area: 4.12 ha (48.5%)", fill=(255, 255, 255, 240))

    # HUD
    d.rounded_rectangle([20, 20, 260, 60], radius=6, fill=(10, 16, 26, 230), outline=(0, 220, 255, 180))
    d.text((32, 28), "STAGE 06: VECTORIZE EXTENT", fill=(0, 220, 255, 255))
    d.text((32, 44), "Marching Squares & GeoJSON Contours", fill=(180, 230, 255, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage6_vectorize_extent.png"))

# 7. Stage 7: Save Results & ZK Ledger
def make_stage7():
    img = Image.new("RGB", (WIDTH, HEIGHT), (6, 10, 18))
    draw = ImageDraw.Draw(img)

    # Grid lines
    for y in range(0, HEIGHT, 30):
        draw.line([(0, y), (WIDTH, y)], fill=(15, 25, 45), width=1)
    for x in range(0, WIDTH, 30):
        draw.line([(x, 0), (x, HEIGHT)], fill=(15, 25, 45), width=1)

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Cryptographic Block Box
    bx, by, bw, bh = 140, 110, 360, 200
    d.rounded_rectangle([bx, by, bx+bw, by+bh], radius=10, fill=(14, 20, 35, 240), outline=(160, 100, 255, 220), width=2)

    # Block Header
    d.text((bx+20, by+18), "BLOCK #09 — SHA-256 IMMUTABLE LEDGER", fill=(200, 160, 255, 255))
    d.line([(bx+20, by+38), (bx+bw-20, by+38)], fill=(160, 100, 255, 120), width=1)

    # Hash info
    d.text((bx+20, by+50), "PREV HASH: 0x7f4a...81bc", fill=(140, 160, 190, 255))
    d.text((bx+20, by+70), "BLOCK HASH: 0x1fcb2727efbd341d6eb692a2dc77db0e...", fill=(0, 220, 255, 255))
    d.text((bx+20, by+95), "ZK PROOF: Groth16 / BN128 Circuit Verified", fill=(100, 240, 160, 255))
    d.text((bx+20, by+115), "CLAIM STATUS: 100% ELIGIBLE & AUDITED", fill=(255, 220, 100, 255))
    d.text((bx+20, by+145), "PAYOUT AUTHORIZATION: INSTANT SETTLEMENT", fill=(255, 255, 255, 255))

    # HUD
    d.rounded_rectangle([20, 20, 260, 60], radius=6, fill=(10, 16, 26, 230), outline=(160, 100, 255, 180))
    d.text((32, 28), "STAGE 07: CRYPTO LEDGER", fill=(180, 140, 255, 255))
    d.text((32, 44), "Groth16 Zero-Knowledge Payout Block", fill=(220, 200, 255, 255))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img.convert("RGB").save(os.path.join(OUTPUT_DIR, "stage7_db_ledger.png"))

if __name__ == "__main__":
    make_stage1()
    make_stage2()
    make_stage3()
    make_stage4()
    make_stage5()
    make_stage6()
    make_stage7()
    print("All 7 HD Multi-Spectral Satellite Pipeline snapshots successfully generated!")
