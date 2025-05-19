It sounds like your audio player is missing proper metadata handling and full media control integration. Here’s how you can fix these issues:
1. Displaying Artist and Album Art

Linux Mint relies on the Media Session API to retrieve metadata for the audio controls. Ensure your JavaScript player sets this correctly:

```js
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Your Song Title',
    artist: 'Your Artist Name',
    album: 'Your Album Name',
    artwork: [
      { src: 'album-art-url.jpg', sizes: '512x512', type: 'image/jpeg' }
    ]
  });
}
```



Make sure the album-art-url.jpg is a valid image path.
2. Improving Media Controls (Play, Pause, Stop)

By default, Linux Mint integrates system-wide media controls through the Media Session API. You can add better handlers like this:


```js

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => {
    audioElement.play();
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    audioElement.pause();
  });

  navigator.mediaSession.setActionHandler('stop', () => {
    audioElement.pause();
    audioElement.currentTime = 0; // Reset playback
  });

  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    audioElement.currentTime -= details.seekOffset || 10;
  });

  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    audioElement.currentTime += details.seekOffset || 10;
  });
}


```




3. Fixing Stop Functionality

Your stop function likely prevents restart because the audio is fully reset. If you want to allow playback again, ensure audioElement.src isn't reset when stopping.

If you are still having issues, you might need to check if your audio player correctly initializes the audioElement every time it is interacted with.

This should get your player fully functional with system controls. Let me know if anything else is acting up!