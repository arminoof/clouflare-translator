# ۱. انتخاب ایمیج پایه پایتون نسخه 3.10 و نوع slim (سبک)
FROM python:3.10-slim

# ۲. نصب ffmpeg در داخل سیستم عامل کانتینر
# apt-get update لیست بسته‌ها را به‌روز می‌کند
# apt-get install -y ffmpeg خود ffmpeg را نصب می‌کند
# --no-install-recommends از نصب بسته‌های غیرضروری جلوگیری می‌کند
# در نهایت، کش apt پاک می‌شود تا حجم ایمیج نهایی کمتر شود
RUN apt-get update && \
    apt-get install -y ffmpeg --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# ۳. تنظیم پوشه کاری داخل کانتینر
WORKDIR /code

# ۴. کپی کردن فایل نیازمندی‌ها به داخل کانتینر
COPY ./requirements.txt /code/requirements.txt

# ۵. نصب کتابخانه‌های پایتون
# --no-cache-dir از ذخیره کش pip جلوگیری می‌کند تا حجم ایمیج کمتر شود
# --upgrade pip خود ابزار pip را به‌روز می‌کند
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r /code/requirements.txt

# ۶. کپی کردن کد اصلی برنامه به داخل کانتینر
COPY ./main.py /code/main.py

# ۷. دستوری که هنگام اجرای کانتینر باید اجرا شود
# این دستور سرور uvicorn را راه‌اندازی می‌کند تا اپلیکیشن FastAPI شما را سرویس‌دهی کند
# --host 0.0.0.0 باعث می‌شود سرور از خارج کانتینر قابل دسترس باشد
# --port 8080 پورتی است که Cloud Run به طور پیش‌فرض از آن استفاده می‌کند
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
