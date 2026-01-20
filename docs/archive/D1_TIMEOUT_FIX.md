# D1 Timeout Error Fix

## Problem

**Error**: `D1_ERROR: D1 DB storage operation exceeded timeout which caused object to be reset`

**Cause**: When creating a lesson with video uploads using `/api/lessons` POST endpoint, the API attempts to:
1. Upload video files to storage (R2 or Bunny Stream) - takes 10-300+ seconds for large files
2. Create database records for lesson, videos, documents

Cloudflare D1 has a **30-second timeout** per request. Large video uploads cause the entire operation to exceed this limit, resulting in the timeout error.

## Solution

**Use the two-step workflow that already exists:**

### Step 1: Pre-upload videos FIRST
Use `/api/bunny/video/upload` to upload videos BEFORE creating the lesson:

```javascript
// Frontend code
const uploadedVideos = [];
for (const videoFile of videoFiles) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', videoFile.name);
  
  const response = await fetch('/api/bunny/video/upload', {
    method: 'POST',
    body: formData,
  });
  
  const { data } = await response.json();
  uploadedVideos.push({
    bunnyGuid: data.guid,
    bunnyLibraryId: data.libraryId,
    title: videoFile.name,
    durationSeconds: 0, // Can extract from file metadata
  });
}
```

### Step 2: Create lesson with uploaded video IDs
Use `/api/lessons/create-with-uploaded` with the pre-uploaded video metadata:

```javascript
const lessonData = {
  title: "My Lesson",
  description: "Lesson description",
  classId: "class-id",
  releaseDate: new Date().toISOString(),
  videos: uploadedVideos, // Array of {bunnyGuid, title, etc}
  documents: [], // Same pattern for documents
};

const response = await fetch('/api/lessons/create-with-uploaded', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(lessonData),
});
```

## Why This Works

1. **Video uploads happen independently** - No D1 timeout risk since video upload is separate
2. **Lesson creation is fast** - Only creates database records (< 1 second)
3. **Better UX** - Shows upload progress for each video individually
4. **More reliable** - If one video fails, others can still succeed

## Current Implementation Status

✅ **API endpoints exist**:
- `/api/bunny/video/upload` - Handles video upload to Bunny Stream
- `/api/lessons/create-with-uploaded` - Creates lesson with pre-uploaded content

❌ **Frontend needs update**:
- Currently uses `/api/lessons` POST which uploads inline (causes timeout)
- Should use two-step workflow described above

## Recommended Fix

Update the lesson creation form in:
`/src/app/dashboard/teacher/class/[id]/page.tsx`

Change the `handleSubmitLesson` function to:
1. Upload videos first using `/api/bunny/video/upload`
2. Show progress bar for each upload
3. Create lesson with video GUIDs using `/api/lessons/create-with-uploaded`

This matches the pattern used by the Zoom recording upload webhook.
