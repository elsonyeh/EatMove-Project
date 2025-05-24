const https = require('https');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const modelsDir = path.join(__dirname, 'public', 'models');

const models = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

// 確保目錄存在
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// 下載文件
const downloadFile = (filename) => {
    const file = fs.createWriteStream(path.join(modelsDir, filename));
    https.get(`${baseUrl}/${filename}`, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded: ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(path.join(modelsDir, filename), () => { });
        console.error(`Error downloading ${filename}:`, err.message);
    });
};

// 下載所有模型
models.forEach(model => downloadFile(model)); 