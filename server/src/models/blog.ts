import { Schema } from "mongoose";

interface IBlog {
  thumbnailImg: string | null;
  slug: string;
  title: string;
  description: string;
  content: string;
  isPinned: number;
  isDraft: number;
  seoKeyword: string | null;
  seoDesc: string | null;
  allowComment: number;
  loveCount: number;
  commentCount: number;
  clickCount: number;
  postOnDate: string | null;
  legacyId: number;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
}

const blogSchema = new Schema<IBlog>({});
