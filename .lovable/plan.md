

## Deploy ElevenLabs Conversational AI Agent "Meera"

Since this is a public agent (no auth required), I'll use the **embeddable widget approach** via CDN script -- the simplest method that was previously used in the app.

### Changes

**`src/pages/Index.tsx`**:
1. Add a `useEffect` to load the ElevenLabs convai widget script (`https://elevenlabs.io/convai-widget/index.js`) after a 1-second delay for performance
2. Add `<elevenlabs-convai agent-id="agent_9901ka0em19jerm9qr2t8aj0w1vr"></elevenlabs-convai>` before the closing `</div>` of the component

This restores the same pattern previously used, but with the new agent ID for "Meera". Single file change, no new dependencies needed.

