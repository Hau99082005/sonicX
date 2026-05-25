import { RequestWithFiles } from "#/middleware/fileParser";

interface Banner {
  title: string;
}

interface BannerRequest extends RequestWithFiles {
  body: Banner;
}

export { Banner, BannerRequest };
