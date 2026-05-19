const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// Đăng ký free tại: https://freesound.org/apiv2/apply
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY || "icgdUFO7EPvuOcTWokkRLhScWc3G1PuSNiZzOuRC";

const SAVE_DIR = process.env.SAVE_DIR || "C:\\Music";

const DYNAMIC_PRESETS = {
    whoosh:       ["whoosh", "swoosh", "cinematic whoosh", "fly by"],
    rain:         ["rain", "rainfall", "heavy rain", "rain ambience"],
    driving:      ["car engine", "traffic", "highway", "driving"],
    night:        ["night ambience", "crickets", "night forest", "owl"],
    studying:     ["cafe ambience", "library", "white noise", "lo-fi"],
    working_out:  ["gym", "crowd cheering", "energetic", "bass drop"],
    morning:      ["birds chirping", "morning birds", "dawn", "rooster"],
    evening:      ["sunset", "evening ambience", "dusk", "fireplace"],
    thunder:      ["thunder", "storm", "lightning", "thunderstorm"],
    ocean:        ["ocean waves", "sea", "beach waves", "water"],
    lofi:         ["lofi beat", "chillhop", "lo-fi hip hop", "chill vibes"],
    gaming:       ["8-bit", "retro game", "pixel sound", "coin collect"],
    tiktok:       ["tiktok sound", "viral sound", "trending audio", "meme sound"],
    asmr:         ["asmr whisper", "tapping", "crinkle", "rain asmr"],
    party:        ["club music", "edm drop", "festival crowd", "bass boost"],
    horror:       ["scary ambience", "horror movie", "creepy sound", "dark atmosphere"],
    anime:        ["anime effect", "japanese sound", "manga sound", "kawaii"],
    urban:        ["city ambience", "subway", "street noise", "car passing"],
    nature:       ["forest ambience", "wind blowing", "fire crackling", "water stream"],
    meme:         ["funny sound", "vine boom", "airhorn", "notification sound"],
    cyberpunk:    ["sci-fi", "futuristic", "neon", "digital glitch"],
    aesthetic:    ["vintage", "retro", "nostalgic", "vhs tape"],
};

if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
}

function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim().substring(0, 180);
}

async function convertToMp3(inputPath, outputPath) {
    try {
        await execPromise(`ffmpeg -i "${inputPath}" -codec:a libmp3lame -qscale:a 2 "${outputPath}" -y`);
        fs.unlinkSync(inputPath);
        return true;
    } catch (err) {
        console.error(`❌ FFmpeg conversion failed: ${err.message}`);
        return false;
    }
}

function downloadFile(url, destPath, apiKey) {
    return new Promise((resolve, reject) => {
        const fullUrl = apiKey ? `${url}?token=${apiKey}` : url;
        const protocol = fullUrl.startsWith("https") ? https : http;
        const file = fs.createWriteStream(destPath);

        const request = protocol.get(fullUrl, { headers: { Authorization: `Token ${apiKey}` } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) {}
                const redirectUrl = response.headers.location;
                return downloadFile(redirectUrl, destPath, null).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) {}
                return reject(new Error(`HTTP ${response.statusCode}`));
            }
            response.pipe(file);
            file.on("finish", () => file.close(resolve));
            file.on("error", reject);
        });

        request.on("error", (err) => {
            try { fs.unlinkSync(destPath); } catch (_) {}
            reject(err);
        });

        request.setTimeout(60000, () => {
            request.destroy();
            try { fs.unlinkSync(destPath); } catch (_) {}
            reject(new Error("Timeout"));
        });
    });
}

function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve(null);
        const protocol = url.startsWith("https") ? https : http;
        const file = fs.createWriteStream(destPath);
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) {}
                return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) {}
                return resolve(null);
            }
            response.pipe(file);
            file.on("finish", () => file.close(resolve));
            file.on("error", () => resolve(null));
        }).on("error", () => resolve(null));
    });
}

async function searchFreesound(query, limit = 10, page = 1) {
    const response = await axios.get("https://freesound.org/apiv2/search/text/", {
        params: {
            query,
            token: FREESOUND_API_KEY,
            page_size: limit,
            page,
            fields: "id,name,username,duration,previews,images,tags,description,license",
            filter: "duration:[1 TO 120]",
            sort: "downloads_desc",
        },
        timeout: 15000,
    });
    return response.data;
}

async function getSoundDetail(soundId) {
    const response = await axios.get(`https://freesound.org/apiv2/sounds/${soundId}/`, {
        params: { token: FREESOUND_API_KEY },
        timeout: 10000,
    });
    return response.data;
}

async function downloadPreset(preset, limit = 5, page = 1) {
    const queries = DYNAMIC_PRESETS[String(preset)];
    if (!queries) {
        console.log(`❌ Preset không hợp lệ! Dùng: ${Object.keys(DYNAMIC_PRESETS).join(", ")}`);
        return;
    }

    const subDir = path.join(SAVE_DIR, String(preset));
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

    console.log(`\n🎵 Đang tải preset: ${preset}`);
    console.log(`📁 Thư mục: ${subDir}`);
    console.log(`🔍 Tìm kiếm: ${queries.join(", ")}\n`);

    const allResults = [];

    for (const query of queries) {
        if (allResults.length >= Number(limit)) break;

        let data;
        try {
            data = await searchFreesound(query, Math.min(Number(limit), 5), Number(page));
        } catch (err) {
            console.error(`❌ Search failed for "${query}":`, err.message);
            continue;
        }

        for (const sound of data.results) {
            if (allResults.length >= Number(limit)) break;

            const previewUrl = sound.previews?.["preview-hq-mp3"] || sound.previews?.["preview-lq-mp3"];
            const imageUrl = sound.images?.waveform_bw_m || sound.images?.spectral_m;

            if (!previewUrl) continue;

            const baseName = sanitizeFilename(`${sound.id}_${sound.name}`);
            const audioPath = path.join(subDir, baseName + ".mp3");
            const imagePath = path.join(subDir, baseName + ".png");

            const result = {
                id: sound.id,
                name: sound.name,
                username: sound.username,
                duration: sound.duration,
                query,
                preset: String(preset),
                audioPath,
                imagePath: imageUrl ? imagePath : null,
                license: sound.license,
                status: "pending",
            };

            try {
                if (fs.existsSync(audioPath)) {
                    result.status = "skipped";
                    result.sizeKB = Math.round(fs.statSync(audioPath).size / 1024);
                    console.log(`⏭️  Đã tồn tại: ${sound.name}`);
                } else {
                    const tempPath = audioPath + ".temp";
                    await downloadFile(previewUrl, tempPath, FREESOUND_API_KEY);
                    
                    const converted = await convertToMp3(tempPath, audioPath);
                    if (!converted) {
                        fs.renameSync(tempPath, audioPath);
                    }
                    
                    result.sizeKB = Math.round(fs.statSync(audioPath).size / 1024);
                    result.status = "downloaded";
                    console.log(`✅ Đã tải: ${sound.name} (${result.sizeKB} KB)`);
                }

                if (imageUrl && !fs.existsSync(imagePath)) {
                    await downloadImage(imageUrl, imagePath);
                    console.log(`🖼️  Đã tải ảnh: ${sound.name}`);
                }

                if (fs.existsSync(imagePath)) {
                    result.imageDownloaded = true;
                }
            } catch (err) {
                result.status = "failed";
                result.error = err.message;
                console.log(`❌ Lỗi: ${sound.name} - ${err.message}`);
            }

            allResults.push(result);
        }
    }

    console.log(`\n📊 Tổng kết:`);
    console.log(`   Tổng: ${allResults.length} file`);
    console.log(`   Thành công: ${allResults.filter(r => r.status === "downloaded").length}`);
    console.log(`   Bỏ qua: ${allResults.filter(r => r.status === "skipped").length}`);
    console.log(`   Thất bại: ${allResults.filter(r => r.status === "failed").length}`);
    console.log(`📁 Lưu tại: ${subDir}\n`);

    return allResults;
}

async function main() {
    const args = process.argv.slice(2);
    const preset = args[0];
    const limit = args[1] ? parseInt(args[1]) : 5;

    console.log("=".repeat(55));
    console.log("  Sound Downloader CLI");
    console.log("  Nguồn            : Freesound.org (CC License)");
    console.log("  Thư mục lưu      : " + SAVE_DIR);
    console.log("=".repeat(55));

    if (FREESOUND_API_KEY === "YOUR_FREESOUND_KEY") {
        console.log("\n❌ Chưa có API Key!");
        console.log("1. Vào https://freesound.org/apiv2/apply");
        console.log("2. Đăng ký free → lấy API key");
        console.log("3. Chạy lại: set FREESOUND_API_KEY=your_key && node download-music.js\n");
        return;
    }

    console.log(`\n🔑 API Key: ${FREESOUND_API_KEY.substring(0, 8)}...`);

    if (!preset) {
        console.log("\n📋 Danh sách preset:");
        Object.keys(DYNAMIC_PRESETS).forEach((key, i) => {
            console.log(`   ${i + 1}. ${key}`);
        });
        console.log("\n💡 Cách dùng:");
        console.log("   node download-music.js <preset> [limit]");
        console.log("\n📝 Ví dụ:");
        console.log("   node download-music.js lofi 10");
        console.log("   node download-music.js gaming 5");
        console.log("   node download-music.js tiktok 8\n");
        return;
    }

    await downloadPreset(preset, limit);
}

main().catch(console.error);
