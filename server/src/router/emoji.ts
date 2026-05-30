import { Router } from "express";
import axios from "axios";

const router = Router();

let cache: { updated: number; list: any[] } | null = null;
const TTL = 1000 * 60 * 60 * 6; // 6 hours

function filenameToChar(name: string) {
  const base = name.replace(/^emoji_u/, "").replace(/\.svg$/, "");
  const parts = base.split("_");
  const cps = parts.map((p) => parseInt(p, 16));
  return String.fromCodePoint(...cps);
}

router.get("/list", async (req, res) => {
  try {
    if (cache && Date.now() - cache.updated < TTL)
      return res.json({ emojis: cache.list });

    const gh = await axios.get(
      "https://api.github.com/repos/googlefonts/noto-emoji/git/trees/main?recursive=1",
      { headers: { "User-Agent": "sonicx" } },
    );
    const tree = gh.data.tree || [];
    const svgs = tree
      .map((t: any) => t.path)
      .filter((p: string) => p.startsWith("svg/emoji_u") && p.endsWith(".svg"));

    const list = svgs.map((p: string) => {
      const filename = p.split("/").pop();
      const char = filename ? filenameToChar(filename.replace(".svg", "")) : "";
      const url = `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/${filename}`;
      return { char, filename, url };
    });

    cache = { updated: Date.now(), list };
    res.json({ emojis: list });
  } catch (err: any) {
    console.error("emoji list err", err.message || err);
    if (cache) return res.json({ emojis: cache.list });
    res.status(500).json({ error: "failed" });
  }
});

export default router;
