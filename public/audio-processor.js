class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunkSize = options.processorOptions?.chunkSize || 512;  // 32ms chunks at 16kHz
    this.buffer = new Float32Array(this.chunkSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (input.length === 0) {
      return true;
    }

    const inputChannel = input[0];
    
    // Copy input to output (pass-through)
    if (output.length > 0) {
      output[0].set(inputChannel);
    }

    // Log input chunk size for debugging
    if (inputChannel.length !== 128) { // 128 is the typical AudioWorklet input size (may vary)
      console.log(`AudioWorklet received input chunk: ${inputChannel.length} samples`);
    }

    // Accumulate audio data in buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex] = inputChannel[i];
      this.bufferIndex++;
      
      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.chunkSize) {
        this.port.postMessage({
          type: 'audioData',
          audioData: this.buffer.slice()
        });
        
        // Reset buffer
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 