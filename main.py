# main.py

from fastapi import FastAPI, UploadFile, File, HTTPException, Response
import subprocess
import tempfile
import os
import shutil

# ایجاد یک نمونه از اپلیکیشن FastAPI
app = FastAPI()

@app.post("/extract-audio/")
async def create_upload_file(video: UploadFile = File(...)):
    """
    این endpoint یک فایل ویدیویی را دریافت کرده، صدای آن را استخراج می‌کند
    و فایل صوتی را به عنوان پاسخ برمی‌گرداند.
    """
    # ایجاد یک فایل موقت برای ذخیره ویدیوی آپلود شده
    # delete=False باعث می‌شود فایل پس از بسته شدن، به صورت خودکار پاک نشود
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        # کپی کردن محتوای فایل آپلود شده به فایل موقت
        shutil.copyfileobj(video.file, temp_video)
        temp_video_path = temp_video.name
    
    # ایجاد یک مسیر برای فایل صوتی خروجی
    temp_audio_path = temp_video_path.replace(".mp4", ".wav")

    # دستور ffmpeg برای استخراج صدا
    command = [
        "ffmpeg",
        "-i", temp_video_path,
        "-vn", # حذف بخش ویدیویی
        "-acodec", "pcm_s16le", # فرمت استاندارد صوتی (WAV)
        "-ar", "16000", # نرخ نمونه‌برداری مناسب برای Whisper
        "-ac", "1", # تک کاناله کردن صدا (Mono)
        temp_audio_path,
        "-y" # بازنویسی فایل خروجی در صورت وجود
    ]

    try:
        # اجرای دستور ffmpeg
        print(f"در حال اجرای ffmpeg روی فایل: {temp_video_path}")
        subprocess.run(command, check=True, capture_output=True, text=True, errors='ignore')
        
        # خواندن بایت‌های فایل صوتی برای ارسال به عنوان پاسخ
        with open(temp_audio_path, "rb") as f_audio:
            audio_bytes = f_audio.read()

        # برگرداندن فایل صوتی به عنوان پاسخ API با هدر مناسب
        return Response(content=audio_bytes, media_type="audio/wav")

    except subprocess.CalledProcessError as e:
        # در صورت بروز خطا در ffmpeg، جزئیات آن را برمی‌گردانیم
        print(f"خطای FFmpeg: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"FFmpeg error: {e.stderr}")
    finally:
        # پاکسازی فایل‌های موقت در هر صورت (چه موفقیت‌آمیز و چه خطا)
        print("در حال پاکسازی فایل‌های موقت...")
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

@app.get("/")
def read_root():
    """یک endpoint ساده برای تست اینکه آیا سرویس در حال اجراست یا خیر."""
    return {"Hello": "FFmpeg Audio Extractor Service is running!"}
