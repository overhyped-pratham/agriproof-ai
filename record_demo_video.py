"""
AgriProof AI — Automated Demo Video Recorder
Records a smooth, high-definition (1440x900) walkthrough of the full application:
1. Landing Page & Value Proposition
2. Farm Boundary Polygon Drawing & Zero-PII Registration
3. Live Multi-Spectral Analytics & AI Risk Dashboard (Drought Demo)
4. Planet Insights Platform & Sentinel-2 Spectral Views
5. Zero-Knowledge Proof (zk-SNARK Groth16) 4-Step Verification
6. Immutable SHA-256 Claim Ledger & Integrity Validation
"""

import asyncio
import shutil
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image
import cv2

OUTPUT_DIR = Path(r"E:\sage\agriproof-ai\demo_media")
ARTIFACT_DIR = Path(r"C:\Users\Pratham\.gemini\antigravity\brain\c3b24724-428a-4447-b288-ee935b1bf2cb")
RAW_VIDEO_DIR = OUTPUT_DIR / "raw_recordings"
DEMO_FARM_ID = "demo-farm-001"

async def record_walkthrough():
    print("="*60)
    print(" [VIDEO] AgriProof AI Automated Demo Recording")
    print("="*60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    # Clean old recordings
    for f in RAW_VIDEO_DIR.glob("*.webm"):
        try:
            f.unlink()
        except Exception:
            pass

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-web-security", "--allow-running-insecure-content"]
        )

        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=str(RAW_VIDEO_DIR),
            record_video_size={"width": 1440, "height": 900}
        )

        page = await context.new_page()
        page.set_default_timeout(20000)

        # ==========================================
        # SCENE 1: Landing Page
        # ==========================================
        print("--> Scene 1: Landing Page")
        await page.goto("http://localhost:5173/", wait_until="networkidle")
        await asyncio.sleep(2.0)
        await page.evaluate("window.scrollBy({ top: 400, behavior: 'smooth' })")
        await asyncio.sleep(1.8)
        await page.evaluate("window.scrollBy({ top: 500, behavior: 'smooth' })")
        await asyncio.sleep(2.0)
        await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        await asyncio.sleep(1.5)

        # ==========================================
        # SCENE 2: Farm Registration & Polygon Map
        # ==========================================
        print("--> Scene 2: Farm Registration")
        await page.click("text=Register Your Farm")
        await page.wait_for_url("**/register")
        await asyncio.sleep(1.5)

        # Click Punjab Preset
        await page.click("text=Punjab Preset")
        await asyncio.sleep(1.5)

        # Fill sowing date
        try:
            await page.fill("input[type='date']", "2024-11-01")
        except Exception:
            pass

        await asyncio.sleep(1.0)

        # ==========================================
        # SCENE 3: Farmer Dashboard (Drought Demo)
        # ==========================================
        print("--> Scene 3: Farmer Dashboard")
        await page.goto(f"http://localhost:5173/dashboard/{DEMO_FARM_ID}", wait_until="networkidle")
        await asyncio.sleep(3.0)

        # Scroll through dashboard to show risk gauge, NDVI chart, weather panel
        await page.evaluate("window.scrollBy({ top: 350, behavior: 'smooth' })")
        await asyncio.sleep(2.2)
        await page.evaluate("window.scrollBy({ top: 400, behavior: 'smooth' })")
        await asyncio.sleep(2.2)
        await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        await asyncio.sleep(1.5)

        # ==========================================
        # SCENE 4: Satellite View (direct URL navigation)
        # ==========================================
        print("--> Scene 4: Satellite View")
        await page.goto(f"http://localhost:5173/dashboard/{DEMO_FARM_ID}/satellite", wait_until="networkidle")
        await asyncio.sleep(3.0)

        # Click "Back" button (navigate(-1) based)
        try:
            await page.click("button:has-text('Back')", timeout=5000)
        except Exception:
            pass
        await asyncio.sleep(1.5)

        # ==========================================
        # SCENE 5: ZK Proof Claim Verification
        # ==========================================
        print("--> Scene 5: ZK Proof Verification")
        await page.goto("http://localhost:5173/claim/CLM-4821", wait_until="networkidle")
        await asyncio.sleep(4.0)  # Let verification animation complete

        # Scroll down to see all 4 proof steps
        await page.evaluate("window.scrollBy({ top: 300, behavior: 'smooth' })")
        await asyncio.sleep(2.0)

        # Re-run verification animation
        try:
            await page.click("button:has-text('Verify Again')", timeout=8000)
            await asyncio.sleep(5.0)
        except Exception:
            pass

        await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        await asyncio.sleep(1.5)

        # ==========================================
        # SCENE 6: Blockchain Claim Ledger
        # ==========================================
        print("--> Scene 6: Blockchain Claim Ledger")
        await page.goto("http://localhost:5173/ledger", wait_until="networkidle")
        await asyncio.sleep(2.5)

        # Click Verify Chain Integrity
        try:
            await page.click("button:has-text('Verify Chain Integrity')", timeout=8000)
        except Exception:
            pass
        await asyncio.sleep(3.0)

        # Scroll to show blocks
        await page.evaluate("window.scrollBy({ top: 400, behavior: 'smooth' })")
        await asyncio.sleep(2.0)

        # Final shot — back to landing
        await page.goto("http://localhost:5173/", wait_until="networkidle")
        await asyncio.sleep(2.5)

        # Finalize
        await context.close()
        await browser.close()

    print("--> Processing recorded video...")
    video_files = list(RAW_VIDEO_DIR.glob("*.webm"))
    if not video_files:
        print("[!] No recorded video found in:", RAW_VIDEO_DIR)
        return

    raw_video = video_files[0]
    final_mp4 = OUTPUT_DIR / "agriproof_demo_walkthrough.mp4"
    final_gif = OUTPUT_DIR / "agriproof_demo_walkthrough.gif"

    print(f"--> Converting {raw_video.name} ({raw_video.stat().st_size // 1024} KB) to MP4 and GIF...")
    cap = cv2.VideoCapture(str(raw_video))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(final_mp4), fourcc, fps, (width, height))

    frames_for_gif = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
        if frame_idx % 5 == 0 and len(frames_for_gif) < 150:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            pil_img.thumbnail((720, 450), Image.Resampling.LANCZOS)
            frames_for_gif.append(pil_img)
        frame_idx += 1

    cap.release()
    out.release()

    print(f"[OK] MP4 generated: {final_mp4} ({final_mp4.stat().st_size // 1024} KB, {frame_idx} frames)")

    if frames_for_gif:
        frames_for_gif[0].save(
            str(final_gif),
            save_all=True,
            append_images=frames_for_gif[1:],
            duration=120,
            loop=0,
            optimize=True
        )
        print(f"[OK] GIF generated: {final_gif} ({final_gif.stat().st_size // 1024} KB, {len(frames_for_gif)} frames)")

    # Copy to artifact folder
    try:
        shutil.copy2(str(final_mp4), str(ARTIFACT_DIR / "agriproof_demo_walkthrough.mp4"))
        if final_gif.exists():
            shutil.copy2(str(final_gif), str(ARTIFACT_DIR / "agriproof_demo_walkthrough.gif"))
        print(f"[OK] Media copied to artifacts directory.")
    except Exception as e:
        print(f"[!] Copy notice: {e}")

    print("="*60)
    print(" DEMO VIDEO GENERATION COMPLETE")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(record_walkthrough())
