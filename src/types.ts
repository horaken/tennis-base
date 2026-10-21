export interface VideoLink {
  title: string;
  url: string;
  participant?: string;
}

export interface AiConsultationLink {
  title: string;
  url: string;
  participant?: string;
}

export interface PhotoItem {
  url: string;
  alt?: string;
}

export interface EventItem {
  id: string;
  date: string;
  title: string;
  location?: string;
  participants?: string;
  practiceContents?: string[] | string;
  comment?: string;
  videos?: VideoLink[];
  aiConsultations?: AiConsultationLink[];
  photos?: PhotoItem[];
}

export interface ScheduleItem {
  date: string;
  time?: string;
  title: string;
  location?: string;
  description?: string;
}

export interface VideoSearchResult {
  handleName?: string;
  date: string;
  eventName?: string;
  videoUrl?: string;
  startSeconds?: number | string;
  aiUrl?: string;
  memo?: string;
}

export interface VideoSearchApiResponse {
  ok: boolean;
  results?: VideoSearchResult[];
  message?: string;
}
