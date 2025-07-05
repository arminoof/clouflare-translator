// فایل: ffmpeg-api.js
// توضیحات: این کد، یک API کوچک می‌سازد که فقط مسئولیت اجرای FFmpeg را بر عهده دارد.

const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');

const app = express();
// Railway به صورت خودکار یک پورت به شما می‌دهد، ما باید از آن استفاده کنیم
const PORT = process.env.PORT || 3001;

// اجازه دسترسی از همه دامنه‌ها (برای اینکه ورکر کلادفلر بتواند با آن صحبت کند)
app.use(cors());

// ساخت پوشه‌های لازم در صورت عدم وجود
fs.mkdirSync('./uploads', { recursive: true });
fs.mkdirSync('./processed', { recursive: true });

// تنظیم محل ذخیره فایل‌های ویدیویی آپلود شده
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads'),
    filename: (req, file, cb) => {
        // برای پشتیبانی از نام‌های فارسی، نام فایل را به درستی انکود می‌کنیم
        const safeFilename = `${Date.now()}-${Buffer.from(file.originalname, 'latin1').toString('utf8')}`;
        cb(null, safeFilename);
    }
});
const upload = multer({ storage });

// API Endpoint شماره ۱: برای آپلود اولیه ویدیو
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    // نام فایل ذخیره شده را به عنوان شناسه برمی‌گردانیم
    res.json({ fileId: req.file.filename });
});

// API Endpoint شماره ۲: برای اجرای FFmpeg
app.post('/process/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const videoPath = path.join(__dirname, 'uploads', fileId);
    const audioPath = path.join(__dirname, 'processed', `${fileId}.wav`);

    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ message: 'File not found on server.' });
    }

    // دستور دقیق FFmpeg برای استخراج صدا با فرمت مناسب برای جمنای
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;
    
    exec(ffmpegCommand, (error) => {
        if (error) {
            console.error(`FFmpeg error for ${fileId}: ${error.message}`);
            return res.status(500).json({ message: 'FFmpeg processing failed.' });
        }
        
        // Railway یک آدرس عمومی به ما می‌دهد که باید از آن استفاده کنیم
        const audioFileUrl = `https://${req.get('host')}/processed/${path.basename(audioPath)}`;
        
        res.json({ audioFileUrl });
    });
});

// اجازه دانلود فایل‌های صوتی پردازش شده توسط ورکر صف
app.use('/processed', express.static(path.join(__dirname, 'processed')));

app.listen(PORT, () => {
    console.log(`FFmpeg API server running on port ${PORT}`);
});
