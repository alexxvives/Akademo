# Custom Zoom SDK Integration Planning

## Overview
Build a custom web-based video streaming solution integrated with Zoom SDK that allows teachers to start live classes with watermarking, whiteboard, and screen sharing capabilities directly on akademo-edu.com.

## Current State
- Using Zoom API with Server-to-Server OAuth
- Teachers start meetings via Zoom API, students join via Zoom client/web
- Recordings handled via webhooks and stored in Bunny Stream
- No custom UI - completely reliant on Zoom's interface

## Proposed Solution Architecture

### Technology Stack
- **Zoom Video SDK** (not Meeting SDK) - Browser-based SDK for custom UI
- **Canvas API** - For watermark overlays
- **WebRTC** - Native browser video/audio
- **React Components** - Custom UI controls

### Difficulty Level: **Medium to High** (7/10)

#### Why Medium-High?
1. **WebRTC Complexity** - Managing peer connections, audio/video streams
2. **Real-time Watermarking** - Canvas overlays on video streams every X minutes
3. **Whiteboard Implementation** - Collaborative drawing canvas synchronized across peers
4. **Screen Sharing** - Managing multiple video sources (camera + screen)
5. **Session Management** - Keeping Zoom session + our custom UI in sync
6. **Recording Pipeline** - Capturing custom UI + watermarks + video streams

---

## Implementation Plan

### Phase 1: Zoom Video SDK Integration (2-3 weeks)
**Difficulty**: Medium

1. **Setup Zoom Video SDK**
   - Create Video SDK app in Zoom Marketplace
   - Get SDK credentials (SDK Key & Secret)
   - Install `@zoom/videosdk` npm package

2. **Basic Video Component**
   ```tsx
   // components/ZoomVideoPlayer.tsx
   import ZoomVideo from '@zoom/videosdk';
   
   const client = ZoomVideo.createClient();
   await client.init('en-US', 'CDN');
   await client.join(sessionName, token, userName);
   
   // Render video streams
   client.getAllUser().forEach(user => {
     const stream = client.getMediaStream();
     stream.attachVideo(user.userId, videoElement);
   });
   ```

3. **Authentication Flow**
   - Generate JWT tokens server-side (API route)
   - Token includes: topic, role, session_key
   - Students receive viewer tokens, teachers receive host tokens

**Estimated Time**: 1 week  
**Cost**: Free tier (100 participants, 40min limit) or $1,499/month (unlimited)

---

### Phase 2: Custom Watermarking (1-2 weeks)
**Difficulty**: Medium-High

1. **Canvas Overlay System**
   ```tsx
   const overlayWatermark = (videoElement: HTMLVideoElement) => {
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d')!;
     
     const renderFrame = () => {
       // Draw current video frame
       ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
       
       // Add watermark
       ctx.font = '20px Arial';
       ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
       ctx.fillText(
         `${studentName} - ${new Date().toLocaleString()}`,
         50, 
         50
       );
       
       requestAnimationFrame(renderFrame);
     };
     
     renderFrame();
     return canvas.captureStream();
   };
   ```

2. **Periodic Watermark Rotation**
   - Set interval to update watermark position/content every X minutes
   - Store watermark schedule in session metadata
   - Prevents screenshot/recording removal

3. **Anti-Piracy Measures**
   - Random watermark positions
   - Student name + timestamp + session ID
   - Semi-transparent to avoid blocking content
   - Log watermark display events (for tracking)

**Estimated Time**: 1-2 weeks  
**Challenges**: 
- Performance impact of canvas rendering
- Ensuring watermarks survive screen recording
- Balancing visibility vs. intrusiveness

---

### Phase 3: Whiteboard Implementation (2-3 weeks)
**Difficulty**: High

1. **Collaborative Canvas**
   ```tsx
   // Use Excalidraw or build custom
   import { Excalidraw } from '@excalidraw/excalidraw';
   
   const WhiteboardComponent = () => {
     return (
       <Excalidraw
         onChange={(elements, appState) => {
           // Broadcast changes via WebSocket
           socket.emit('whiteboard:update', { elements, appState });
         }}
       />
     );
   };
   ```

2. **Real-time Synchronization**
   - Use Socket.IO or Pusher for real-time updates
   - Broadcast drawing events to all participants
   - Handle conflict resolution (last-write-wins)

3. **Whiteboard Features**
   - Drawing tools (pen, shapes, text)
   - Eraser
   - Color picker
   - Undo/redo
   - Save/load whiteboard state
   - Screenshot/export to PDF

**Options**:
- **Excalidraw**: Open-source, ready to use, great UX (RECOMMENDED)
- **Fabric.js**: More control, requires custom UI
- **Custom Canvas**: Full control, most work

**Estimated Time**: 2-3 weeks (with Excalidraw) or 4-6 weeks (custom)  
**Complexity**: High due to real-time sync + conflict resolution

---

### Phase 4: Screen Sharing (1 week)
**Difficulty**: Medium

1. **Screen Capture API**
   ```tsx
   const startScreenShare = async () => {
     const screenStream = await navigator.mediaDevices.getDisplayMedia({
       video: { cursor: 'always' },
       audio: true,
     });
     
     // Add screen track to Zoom session
     await client.getMediaStream().startShareScreen(screenStream);
   };
   ```

2. **UI Controls**
   - "Share Screen" button for teachers
   - Picture-in-picture for camera during screen share
   - Audio routing (screen audio + mic audio)

3. **Layout Management**
   - Switch between camera view and screen view
   - Thumbnail view for participants
   - Gallery view vs. speaker view

**Estimated Time**: 1 week  
**Challenges**: 
- Managing multiple video streams
- Audio mixing from multiple sources

---

### Phase 5: Recording with Custom UI (2-3 weeks)
**Difficulty**: High

1. **MediaRecorder API**
   ```tsx
   const recordSession = (compositeStream: MediaStream) => {
     const recorder = new MediaRecorder(compositeStream, {
       mimeType: 'video/webm;codecs=vp9',
     });
     
     const chunks: Blob[] = [];
     recorder.ondataavailable = (e) => chunks.push(e.data);
     
     recorder.onstop = async () => {
       const blob = new Blob(chunks, { type: 'video/webm' });
       // Upload to Bunny Stream
       await uploadToBunny(blob);
     };
     
     recorder.start();
   };
   ```

2. **Composite Stream**
   - Combine video + watermark canvas
   - Mix audio from all participants
   - Include whiteboard annotations
   - Add teacher's screen share

3. **Cloud Recording**
   - Record server-side to handle all participants
   - Use Cloudflare Stream or Bunny Stream
   - Store metadata in D1 database

**Estimated Time**: 2-3 weeks  
**Major Challenge**: Creating composite stream with all UI elements baked in

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Teacher)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Video Stream │  │  Whiteboard  │  │Screen Share  │ │
│  │  + Watermark │  │   (Canvas)   │  │   (Display)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Zoom Video SDK Client                    │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                 │
└────────────────────────┼─────────────────────────────────┘
                         │
                         │ WebRTC Signaling
                         │
                    ┌────▼─────┐
                    │   Zoom   │
                    │  Servers │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼────────┐ ┌───▼────────┐ ┌───▼────────┐
│  Student 1      │ │ Student 2  │ │ Student N  │
│  (Viewer)       │ │ (Viewer)   │ │ (Viewer)   │
│                 │ │            │ │            │
│  Video Stream   │ │Video Stream│ │Video Stream│
│  + Watermark    │ │+ Watermark │ │+ Watermark │
└─────────────────┘ └────────────┘ └────────────┘
```

---

## Technical Challenges & Solutions

### Challenge 1: Watermark Performance
**Problem**: Canvas rendering on every frame impacts performance  
**Solution**: 
- Use requestAnimationFrame for smooth rendering
- Optimize canvas operations (limit redraws)
- Consider GPU-accelerated rendering (WebGL)
- Cache watermark images instead of drawing text

### Challenge 2: Real-time Whiteboard Sync
**Problem**: Hundreds of drawing events/second overwhelm network  
**Solution**:
- Debounce events (send updates every 100ms, not per pixel)
- Use operational transformation (OT) for conflict resolution
- Implement selective sync (only changed regions)
- Use WebRTC data channels instead of HTTP

### Challenge 3: Recording Quality
**Problem**: Client-side recording consumes resources, affects video quality  
**Solution**:
- Use Zoom Cloud Recording (server-side)
- Offload encoding to Web Worker
- Implement adaptive bitrate based on network
- Record at lower resolution, upscale later

### Challenge 4: Browser Compatibility
**Problem**: Safari has limited WebRTC support  
**Solution**:
- Use Zoom Video SDK (handles cross-browser issues)
- Polyfills for older browsers
- Graceful degradation (disable features if unsupported)
- Test on: Chrome, Firefox, Safari, Edge

---

## Cost Analysis

### Development Costs
- **Developer Time**: 10-15 weeks (1 full-stack dev)
- **Cost**: $15,000 - $25,000 (at $1,500-2,500/week)

### Operational Costs (Monthly)
- **Zoom Video SDK**: $1,499/month (unlimited participants)
- **Bunny Stream**: $10-50/month (depends on storage/bandwidth)
- **Socket.IO/Pusher**: $20-100/month (real-time sync)
- **Cloudflare Workers**: Included in current plan
- **Total**: ~$1,600-1,700/month

### Alternative: Keep Using Zoom API
- **Cost**: $0 (current setup)
- **Limitation**: No custom UI, limited branding

---

## Risk Assessment

### High Risk
❌ **Recording Complexity**: Baking watermarks into recordings is technically challenging  
❌ **Performance**: Real-time canvas rendering may cause lag on low-end devices  
❌ **Browser Support**: Safari has weaker WebRTC support

### Medium Risk
⚠️ **Zoom SDK Limitations**: SDK may not support all features we need  
⚠️ **Maintenance**: Custom UI requires ongoing updates  
⚠️ **User Experience**: Custom UI may be less polished than Zoom's

### Low Risk
✅ **Whiteboard**: Excalidraw provides solid foundation  
✅ **Screen Sharing**: Native browser API, well-supported

---

## Recommendation

### Short-term (Now - 3 months):
**Keep Current Setup**
- Continue using Zoom API + webhooks
- Focus on core features (assignments, payments, student progress)
- Improve current watermarking on recorded videos (post-processing)

### Medium-term (3-6 months):
**Pilot Custom SDK**
- Build MVP with basic video + watermarks
- Test with 1-2 academies
- Gather feedback on UX vs. Zoom client

### Long-term (6-12 months):
**Full Custom Implementation**
- If MVP successful, add whiteboard + advanced features
- Migrate all academies to custom solution
- Deprecate Zoom API integration

---

## Alternative: Hybrid Approach

**Best of Both Worlds**:
1. Use Zoom for actual video/audio (proven, reliable)
2. Build custom web UI around Zoom Meeting SDK
3. Add watermarks as HTML overlay (not baked into video)
4. Use Zoom's native whiteboard + screen sharing
5. Record via Zoom Cloud Recording (includes watermarks)

**Pros**:
- Lower complexity (50% less dev time)
- More reliable video quality
- Faster to market

**Cons**:
- Still dependent on Zoom
- Watermarks easier to remove (overlay vs. baked-in)

---

## Next Steps

1. **Research Phase** (1 week)
   - Test Zoom Video SDK with simple demo
   - Evaluate Excalidraw integration
   - Benchmark canvas watermarking performance

2. **Prototype** (2 weeks)
   - Build basic video room with watermarks
   - Test with 5-10 users
   - Measure performance metrics

3. **Decision Point**
   - If prototype successful → proceed with full build
   - If issues found → adjust plan or stick with Zoom API

---

## Timeline Summary

| Phase | Duration | Difficulty | Priority |
|-------|----------|------------|----------|
| Zoom SDK Integration | 1 week | Medium | High |
| Watermarking | 2 weeks | Medium-High | High |
| Whiteboard | 3 weeks | High | Medium |
| Screen Sharing | 1 week | Medium | High |
| Recording | 3 weeks | High | Medium |
| Testing & Polish | 2 weeks | Medium | High |
| **Total** | **12 weeks** | **Medium-High** | - |

**Budget**: $18,000 - $30,000 development + $1,700/month operational

---

## Conclusion

Building a custom Zoom SDK integration with watermarks is **feasible but complex**. Recommend starting with **Zoom Meeting SDK** (hybrid approach) for faster time-to-market, then migrating to full **Zoom Video SDK** if needed.

**Key Success Factors**:
- Start small (MVP with basic features)
- Prioritize watermarking (anti-piracy is main goal)
- Use existing libraries (Excalidraw for whiteboard)
- Test extensively (performance, compatibility)
- Consider hybrid approach to reduce risk

**Go/No-Go Decision**: Build prototype first, then decide based on:
- Performance benchmarks
- User feedback
- Development velocity
- Cost vs. benefit analysis
