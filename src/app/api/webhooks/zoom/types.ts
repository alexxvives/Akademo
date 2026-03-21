export interface WebhookEnv {
  DB: {
    prepare(sql: string): {
      bind(...params: unknown[]): {
        run(): Promise<unknown>;
      };
    };
  };
  ZOOM_WEBHOOK_SECRET: string;
  ZOOM_ACCOUNT_ID: string;
  ZOOM_CLIENT_ID: string;
  ZOOM_CLIENT_SECRET: string;
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_STREAM_LIVE_API_KEY: string;
}

export interface ZoomRecordingFile {
  file_type: string;
  recording_type?: string;
  download_url?: string;
}

export interface ZoomMeetingData {
  object: {
    id: string | number;
    topic?: string;
    participant_count?: number;
    participants_count?: number;
    total_participants?: number;
    participants?: unknown[];
    recording_files?: ZoomRecordingFile[];
    participant?: { count?: number };
  };
  download_token?: string;
}
