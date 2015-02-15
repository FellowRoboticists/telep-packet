var packet = (function() {
  var START_BYTE = 0x13;
  var PKT_LENGTH_BYTE = 1;
  var MAX_PACKET_LENGTH = 100;
  // The buffer we will read into and write out of
  //var mBuffer = new Uint8Array(MAX_PACKET_LENGTH);
  //var mCurrentIndex = 0;

  // The actual thing that will get exported from this module
  var module = {
    mBuffer: new Uint8Array(MAX_PACKET_LENGTH),
    mCurrentIndex: 0
  }; 

  /**
   * Clear the contents of the buffer and reset the current index;
   */
  module.reset = function() {
    this.mCurrentIndex = 0;
    this.append(START_BYTE);
    // this.mBuffer[this.mCurrentIndex++] = START_BYTE;
  };

  module.resetToStartByte = function() {
    var startByte = 0;
    for (var i=1; i<this.mCurrentIndex && startByte == 0; i++) {
      if (START_BYTE == this.mBuffer[i]) {
        startByte = i;
      }
    }
    if (startByte > 0) {
      var pos = 1;
      for (var i=startByte + 1; i<this.mCurrentIndex; i++) {
        this.mBuffer[pos++] = this.mBuffer[i];
      }
      this.mCurrentIndex = this.mCurrentIndex - startByte;
    } else {
      this.reset();
    }
  };

  module.valueAt = function(index) {
    return this.mBuffer[index];
  };

  /**
   * Returns the length of the current packet
   */
  module.length = function() {
    return this.mCurrentIndex;
  };

  /**
   * Append the specified character and increment the current index
   */
  module.append = function(b) {
    this.mBuffer[this.mCurrentIndex++] = b;
  };

  module.readCompleted = function() {
    if (this.mCurrentIndex <= PKT_LENGTH_BYTE) {
      return false;
    }

    if (this.mBuffer[PKT_LENGTH_BYTE] + 3 > MAX_PACKET_LENGTH) {
      return true;
    }

    return this.mBuffer[PKT_LENGTH_BYTE] + 3 == this.mCurrentIndex;
  };

  module.complete = function() {
    this.append(this.calculateChecksum());
  };

  module.valid = function() {
    var sum = 0;
    for (var i=0; i<(this.mCurrentIndex - 1); i++) {
      sum += this.mBuffer[i];
    }

    sum &= 0x000000ff;

    return this.mBuffer[0] == START_BYTE &&
      this.readCompleted() &&
      sum == this.mBuffer[this.mCurrentIndex - 1];
  };

  module.calculateChecksum = function() {
    var sum = 0;
    for (var i=0; i<this.mCurrentIndex; i++) {
      sum += this.mBuffer[i];
    }
    return sum & 0x000000ff;
  };

  return module; // The exported module
}());

module.exports = packet;
