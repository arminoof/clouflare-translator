# مرحله ۱: انتخاب سیستم‌عامل پایه (یک لینوکس سبک با Node.js نصب شده)
FROM node:18-slim

# مرحله ۲: نصب FFmpeg روی این سیستم‌عامل
RUN apt-get update && apt-get install -y ffmpeg

# مرحله ۳: ساخت یک پوشه برای برنامه ما
WORKDIR /usr/src/app

# مرحله ۴: کپی کردن فایل package.json و نصب قطعات مورد نیاز
COPY package*.json ./
RUN npm install --omit=dev

# مرحله ۵: کپی کردن بقیه فایل‌های پروژه (فقط ffmpeg-api.js باقی مانده)
COPY . .

# مرحله ۶: اعلام اینکه برنامه ما روی چه پورتی کار می‌کند
EXPOSE 3001

# مرحله ۷: دستور نهایی برای روشن کردن سرور
CMD [ "npm", "start" ]
