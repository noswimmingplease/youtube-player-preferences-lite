# YouTube Player Preferences Lite

Tampermonkey userscript that applies a small set of YouTube player preferences without using Enhancer for YouTube's miniplayer, queue, autoplay, or background playback controls.

## Features

- Converts Shorts URLs to normal watch URLs.
- Hides Shorts shelves, Shorts cards, and Shorts guide entries.
- Hides the watch-page related recommendations renderer without touching playlist or queue panels.
- Hides live chat and chat replay panels.
- Hides info cards, paid-content overlays, and end-screen overlays.
- Automatically enables YouTube theatre mode on watch/live pages.
- Adds mouse-wheel volume control over the player, only while holding the right mouse button.

## Deliberately Not Included

- Custom miniplayer behaviour.
- Queue or playlist panel changes.
- Autoplay/background-tab playback control.
- Volume boosting beyond YouTube's normal 0-100% range.
- Watch-page full-width layout, which belongs in `YouTube Watch: Fill Width (Keep Right Sidebar)`.

## Install Tampermonkey

Install Tampermonkey first, then install this userscript. Tampermonkey officially supports Chrome, Microsoft Edge, Firefox, Safari, and Opera Next. Zen Browser can use Firefox extensions, so use the Firefox Tampermonkey extension for Zen.

- Chrome: <https://www.tampermonkey.net/?browser=chrome>
- Microsoft Edge: <https://www.tampermonkey.net/?browser=edge>
- Firefox: <https://www.tampermonkey.net/?browser=firefox>
- Zen Browser: install the Firefox Tampermonkey extension; Zen extension documentation is at <https://docs.zen-browser.app/user-manual/extensions>
- Safari: <https://www.tampermonkey.net/?browser=safari>
- Opera: <https://www.tampermonkey.net/?browser=opera>

## Install This Script

### Copy and paste fallback

1. Open the Tampermonkey Dashboard.
2. Select **Create a new script**.
3. Replace the template with the contents of `youtube-player-preferences-lite.user.js`.
4. Save the script.

### Future direct install URL

If this is published as a private GitHub release, use:

~~~text
https://github.com/Ci303/youtube-player-preferences-lite/releases/latest/download/youtube-player-preferences-lite.user.js
~~~

## Scope

This script avoids `ytd-miniplayer`, playlist panels, queue panels, and engagement panels. If YouTube changes its markup, selector updates may be needed.
