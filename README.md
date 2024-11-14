# Chrome AI Audio Transcription Extension

This project is a Chrome browser extension that uses AI to transcribe audio from any active tab in real-time. The project consists of two main parts:

- **Chrome Extension (Client):** A Chrome extension built with React that captures audio from the active browser tab.
- **Backend Server:** A server built with Node.js that integrates with Deepgram’s API to process and transcribe the captured audio in real-time.

![Screenshot](https://github.com/milad-zai/chrome-ai-audio-transcription/blob/main/client/public/screenshot.PNG)

## Features

- **Transcription in Real-Time**: Transcribe audio from any active tab in your browser using AI.
- **AI-Powered Transcription**: Utilizes Deepgram's live transcription API to provide accurate transcriptions.
- **React Client**: Built using React for a smooth user interface and seamless integration with the browser.
- **WebSocket Communication**: Real-time communication between the browser extension and server using WebSockets.
- **Cross-Tab Support**: Transcribes audio from any tab that plays audio, with the ability to switch between tabs.

## Installation

### Client-Side (React)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the extension:**

   ```bash
   npm run build
   ```

3. **Load the extension in Chrome:**

- Open chrome://extensions/ in your browser.
- Enable "Developer mode".
- Click "Load unpacked" and select the build folder inside the project.

### Server-Side

1. **Install server-side dependencies:**

```bash
npm install
```

2. **Configure the server:**
   Create a .env file in the root directory and add the following values:

```bash
DEEPGRAM_API_KEY=YOUR API KEY
```

3. **Update the config/config.js, constants.js with your Deepgram API key and other necessary configurations.**

4. **Run the server:**

```bash
npm start
```

## How It Works

1. **Client (Chrome Extension):** The Chrome extension listens for audio from the active tab and sends the audio data to the server via WebSockets.
2. **Server (Node.js):** The server receives the audio data, sends it to Deepgram for transcription, and sends the transcription back to the extension.
3. **Real-Time Transcription:** The server continuously streams audio to Deepgram and receives real-time transcription data, which is displayed in the Chrome extension.

## Usage

Once the extension is installed, you can start it by clicking the extension icon in the browser toolbar. It will start transcribing audio from the active tab. The transcriptions will be displayed in the extension's popup.

## Future Plans

In the future, this extension aims to transition from using the traditional popup-based interface to leveraging Chrome's new **SidePanel API** for a more integrated and seamless user experience. The SidePanel provides a more modern and persistent way to display content within the browser without blocking the view, offering additional flexibility compared to the popup UI. Unfortunately i run into some problems capturing audio in sidePanel.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to fork the repository, submit issues, or open pull requests.
