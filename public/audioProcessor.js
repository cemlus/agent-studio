class PcmPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // A single, large buffer to hold all audio samples for an utterance.
    this.audioBuffer = new Float32Array(0);
    // An index to keep track of which sample we should play next.
    this.readIndex = 0;
    
    this.port.onmessage = (event) => {

         // Check if the message is a command object or raw audio data
      if (event.data.type === 'clear') {
        // If it's a 'clear' command, empty the buffer and reset the index.
        //  In the next process cycle, it has no audio to play, so it outputs silence. The agent's voice stops immediately.
        this.audioBuffer = new Float32Array(0);
        this.readIndex = 0;
        console.log("AudioWorklet queue cleared due to interruption.");
        return;
      }

      // When a new audio chunk arrives, we append it to our main buffer.
      const newChunk = this.convertBuffer(event.data);
      
      // Create a new, larger buffer to hold old and new samples.
      const newBuffer = new Float32Array(this.audioBuffer.length - this.readIndex + newChunk.length);
      newBuffer.set(this.audioBuffer.slice(this.readIndex));
      newBuffer.set(newChunk, this.audioBuffer.length - this.readIndex);
      
      this.audioBuffer = newBuffer;
      this.readIndex = 0;
    };
  }

  // Helper function to convert the raw 16-bit PCM data to 32-bit floats.
  convertBuffer(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const float32Array = new Float32Array(arrayBuffer.byteLength / 2);
    
    for (let i = 0; i < float32Array.length; i++) {
      const int16 = view.getInt16(i * 2, true);
      float32Array[i] = int16 / 32768;
    }
    return float32Array;
  }

  // The browser calls this repeatedly to get audio data.
  process(inputs, outputs, parameters) {
    const outputChannel = outputs[0][0];
    
    // Fill the browser's output buffer from our main audio buffer.
    for (let i = 0; i < outputChannel.length; i++) {
      // Check if there are unread samples in our buffer.
      if (this.readIndex < this.audioBuffer.length) {
        outputChannel[i] = this.audioBuffer[this.readIndex];
        this.readIndex++;
      } else {
        // If we've played all the samples, output silence.
        outputChannel[i] = 0;
      }
    }
    
    // Keep the processor alive.
    return true;
  }
}

registerProcessor('pcm-player-processor', PcmPlayerProcessor);