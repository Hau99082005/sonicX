import { Router } from "express";
import axios from "axios";

const router = Router();
const TENOR_KEY = process.env.TENOR_API_KEY || "";

const freeGifs = [
  {
    id: "1",
    url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    preview: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/200w_d.jpg",
  },
  {
    id: "2",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    preview: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w_d.jpg",
  },
  {
    id: "3",
    url: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
    preview: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/200w_d.jpg",
  },
  {
    id: "4",
    url: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
    preview: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/200w_d.jpg",
  },
  {
    id: "5",
    url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
    preview: "https://media.giphy.com/media/5GoVLqeAOo6PK/200w_d.jpg",
  },
  {
    id: "6",
    url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
    preview: "https://media.giphy.com/media/ICOgUNjpvO0PC/200w_d.jpg",
  },
  {
    id: "7",
    url: "https://media.giphy.com/media/3oEjHGrVGrqgFFknfO/giphy.gif",
    preview: "https://media.giphy.com/media/3oEjHGrVGrqgFFknfO/200w_d.jpg",
  },
  {
    id: "8",
    url: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
    preview: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w_d.jpg",
  },
  {
    id: "9",
    url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    preview: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w_d.jpg",
  },
  {
    id: "10",
    url: "https://media.giphy.com/media/3oEjHP8ELRNNlnlLGM/giphy.gif",
    preview: "https://media.giphy.com/media/3oEjHP8ELRNNlnlLGM/200w_d.jpg",
  },
];

router.get("/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const limit = Math.min(Number(req.query.limit) || 24, 48);
  if (!TENOR_KEY) {
    if (!query) return res.json({ gifs: freeGifs.slice(0, limit) });
    const q = query.toLowerCase();
    const filtered = freeGifs.filter(
      (g) => g.url.includes(q) || g.preview.includes(q),
    );
    return res.json({
      gifs: (filtered.length ? filtered : freeGifs).slice(0, limit),
    });
  }
  const url = query
    ? `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&media_filter=gif&content_filter=medium`
    : `https://tenor.googleapis.com/v2/trending?key=${TENOR_KEY}&limit=${limit}&media_filter=gif&content_filter=medium`;
  try {
    const response = await axios.get(url);
    const gifs = (response.data.results || []).map((item: any) => {
      const media =
        item.media_formats?.gif ||
        item.media_formats?.mediumgif ||
        item.media_formats?.nanogif;
      return {
        id: item.id,
        title: item.content_description || item.title || "",
        url: media?.url || "",
        preview: media?.preview?.url || media?.url || "",
      };
    });
    res.json({ gifs: gifs.filter((item: any) => item.url) });
  } catch (err) {
    const e: any = err;
    res
      .status(500)
      .json({ error: e?.response?.data || "Failed to fetch gifs" });
  }
});

export default router;
