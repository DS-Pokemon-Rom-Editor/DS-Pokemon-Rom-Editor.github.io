/**
 * Pokémon HGSS Wallpaper Password Generator
 * 
 * Reverse-engineered from ov02_0224CAB8 and related functions
 * in Pokémon HeartGold/SoulSilver.
 * 
 * WORD_COUNT and PASSWORD_WORDS are defined in words.js (loaded first)
 */

/**
 * Rotate a byte array LEFT by n bits (treating as one large integer, MSB first)
 * This is the inverse of the game's ov02_0224CA58 which rotates RIGHT.
 * 
 * @param {Uint8Array} buffer - The bytes to rotate
 * @param {number} length - Number of bytes to use
 * @param {number} bits - Number of bits to rotate left
 */
function rotateLeft(buffer, length, bits) {
    bits = bits & 0xFF;
    for (let i = 0; i < bits; i++) {
        // Save the MSB of the first byte
        const msb = (buffer[0] >> 7) & 1;
        
        // Shift everything left by 1 bit
        for (let j = 0; j < length - 1; j++) {
            buffer[j] = ((buffer[j] << 1) | ((buffer[j + 1] >> 7) & 1)) & 0xFF;
        }
        buffer[length - 1] = ((buffer[length - 1] << 1) | msb) & 0xFF;
    }
}

/**
 * Rotate a byte array RIGHT by n bits (treating as one large integer, MSB first)
 * This matches the game's ov02_0224CA58 function.
 * 
 * @param {Uint8Array} buffer - The bytes to rotate
 * @param {number} length - Number of bytes to use
 * @param {number} bits - Number of bits to rotate right
 */
function rotateRight(buffer, length, bits) {
    bits = bits & 0xFF;
    for (let i = 0; i < bits; i++) {
        // Save the LSB of the last byte
        const lsb = buffer[length - 1] & 1;
        
        // Shift everything right by 1 bit
        for (let j = length - 1; j > 0; j--) {
            buffer[j] = ((buffer[j] >> 1) | ((buffer[j - 1] & 1) << 7)) & 0xFF;
        }
        buffer[0] = ((buffer[0] >> 1) | (lsb << 7)) & 0xFF;
    }
}

/**
 * Transform function used in XOR step.
 * Takes a byte, and returns (highNibble | highNibble>>4) = duplicates high nibble
 * Example: 0xAB -> 0xAA, 0x37 -> 0x33
 * 
 * @param {number} b - Input byte
 * @returns {number} - Transformed byte
 */
function transformByte(b) {
    return ((b & 0xF0) | ((b >> 4) & 0x0F)) & 0xFF;
}

/**
 * Generate the password for a given Trainer ID and wallpaper index.
 * Returns an array of 4 word indices into the password bank.
 * 
 * @param {number} trainerID - The visible Trainer ID (0-65535)
 * @param {number} wallpaper - Wallpaper index (0-7)
 * @returns {number[]|null} - Array of 4 word indices, or null if impossible
 */
function generatePassword(trainerID, wallpaper) {
    if (trainerID < 0 || trainerID > 65535) {
        throw new Error("Trainer ID must be 0-65535");
    }
    if (wallpaper < 0 || wallpaper > 7) {
        throw new Error("Wallpaper must be 0-7");
    }

    // Step 1: Build the 4-byte payload
    // byte0 = 0x60 | wallpaper (magic nibble 6 + wallpaper in low nibble)
    // byte1 = (trainerID >> 8) XOR byte0
    // byte2 = (trainerID & 0xFF) XOR byte0
    // byte3 = checksum
    
    const byte0 = 0x60 | wallpaper;
    const byte1 = ((trainerID >> 8) & 0xFF) ^ byte0;
    const byte2 = (trainerID & 0xFF) ^ byte0;
    
    // Checksum: byte3 = ((byte2 ^ byte0) * (byte0 + (byte1 ^ byte0))) & 0xFF
    // Which simplifies to: byte3 = (trainerID_lo * (byte0 + trainerID_hi)) & 0xFF
    const trainerID_hi = (trainerID >> 8) & 0xFF;
    const trainerID_lo = trainerID & 0xFF;
    const byte3 = (trainerID_lo * (byte0 + trainerID_hi)) & 0xFF;

    // Create working buffer
    const buffer = new Uint8Array([byte0, byte1, byte2, byte3]);

    // Step 2: Rotate LEFT first 3 bytes by (byte3 & 0x0F) bits
    const rotAmount1 = byte3 & 0x0F;
    rotateLeft(buffer, 3, rotAmount1);

    // Step 3: XOR bytes 0,1,2 with transform(byte3)
    const xorVal = transformByte(byte3);
    buffer[0] ^= xorVal;
    buffer[1] ^= xorVal;
    buffer[2] ^= xorVal;

    // Step 4: Rotate LEFT all 4 bytes by 5 bits
    rotateLeft(buffer, 4, 5);

    // Step 5: Decode from deltas to word indices
    // The game encodes as: delta[0] = index[0], delta[i] = index[i] - index[i-1] (with wraparound)
    // We need to find indices that produce these deltas
    // 
    // We need to find valid delta interpretations.
    // delta[0] must be < WORD_COUNT (direct index)
    // For other deltas, if delta[i] would cause wraparound, we need to detect it
    
    const deltas = Array.from(buffer);
    
    // For generation, we CAN choose any starting index that works
    // The game accepts: index[0] = delta[0] directly
    // Then: index[i] = (index[i-1] + delta[i]) mod WORD_COUNT
    
    // But this is the DECODE side - we need to go from indices back to words
    // Actually wait - the buffer now contains the deltas we need to decode
    
    // delta[0] = index[0] if index[0] <= 255
    // delta[1] = (index[1] - index[0]) mod WORD_COUNT, if result <= 255
    // etc.
    
    // Since we're GENERATING, we pick the simplest valid interpretation:
    const indices = new Array(4);
    indices[0] = deltas[0];
    
    if (indices[0] >= WORD_COUNT) {
        // This shouldn't happen with valid input, but check anyway
        return null;
    }
    
    for (let i = 1; i < 4; i++) {
        // Interpret delta[i] as forward difference
        indices[i] = (indices[i - 1] + deltas[i]) % WORD_COUNT;
    }
    
    return indices;
}

/**
 * Verify a password matches the expected result.
 * Implements the game's ov02_0224CAB8 verification logic.
 * 
 * @param {number[]} indices - Array of 4 word indices
 * @param {number} trainerID - The visible Trainer ID
 * @returns {number} - Wallpaper index (0-7) if valid, -1 if invalid
 */
function verifyPassword(indices, trainerID) {
    // Step 1: Delta-encode the indices
    const deltas = new Uint8Array(4);
    
    // First delta is just the first index
    if (indices[0] > 255) {
        return -1;
    }
    deltas[0] = indices[0];
    
    for (let i = 1; i < 4; i++) {
        let diff;
        if (indices[i] >= indices[i - 1]) {
            diff = indices[i] - indices[i - 1];
        } else {
            diff = WORD_COUNT - (indices[i - 1] - indices[i]);
        }
        if (diff > 255) {
            return -1;
        }
        deltas[i] = diff;
    }
    
    // local_24 = [deltas[0], deltas[1], deltas[2], deltas[3]]
    // but stored as: local_24[0], local_24[1], local_22 (as 2 bytes)
    // local_22 is bytes at offset 2 and 3
    const buffer = deltas;  // Working buffer
    
    // Step 2: Rotate RIGHT 4 bytes by 5 bits
    rotateRight(buffer, 4, 5);
    
    // Now buffer[3] is what the code calls local_22._1_1_ (the upper byte of local_22)
    // Which after our rotation is buffer[3]
    const byte3 = buffer[3];
    
    // Step 3: XOR bytes 0,1,2 with transform(byte3)
    const xorVal = transformByte(byte3);
    buffer[0] ^= xorVal;
    buffer[1] ^= xorVal;
    buffer[2] ^= xorVal;
    
    // Step 4: Rotate RIGHT 3 bytes by (byte3 & 0x0F) bits
    rotateRight(buffer, 3, byte3 & 0x0F);
    
    // Step 5: Validate
    const byte0 = buffer[0];
    const byte1 = buffer[1];
    const byte2 = buffer[2];  // This is local_22 low byte in the original code
    
    // Check wallpaper nibble is valid (0-7)
    if ((byte0 & 0x0F) >= 8) {
        return -1;
    }
    
    // Check magic nibble is 6
    if (((byte0 & 0xF0) >> 4) !== 6) {
        return -1;
    }
    
    // Check Trainer ID matches
    const decodedID = ((byte1 ^ byte0) << 8) | (byte2 ^ byte0);
    if (decodedID !== trainerID) {
        return -1;
    }
    
    // Check checksum
    const expectedChecksum = ((byte2 ^ byte0) * (byte0 + (byte1 ^ byte0))) & 0xFF;
    if (byte3 !== expectedChecksum) {
        return -1;
    }
    
    return byte0 & 0x0F;  // Return wallpaper index
}

/**
 * Convert word indices to word strings.
 * 
 * @param {number[]} indices - Array of 4 word indices
 * @returns {string[]} - Array of 4 word strings
 */
function indicesToWords(indices) {
    return indices.map(idx => {
        if (idx < 0 || idx >= PASSWORD_WORDS.length) {
            return "???";
        }
        return PASSWORD_WORDS[idx];
    });
}

/**
 * Convert word strings to indices.
 * 
 * @param {string[]} words - Array of 4 word strings
 * @returns {number[]} - Array of 4 word indices (-1 if not found)
 */
function wordsToIndices(words) {
    return words.map(word => {
        const upperWord = word.toUpperCase().trim();
        const idx = PASSWORD_WORDS.findIndex(w => w.toUpperCase() === upperWord);
        return idx;
    });
}

// ============ UI Code ============

document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generateBtn');
    const trainerIdInput = document.getElementById('trainerId');
    const wallpaperSelect = document.getElementById('wallpaper');
    const outputSection = document.getElementById('outputSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    generateBtn.addEventListener('click', function() {
        // Reset display
        outputSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        // Parse input
        const trainerID = parseInt(trainerIdInput.value, 10);
        const wallpaper = parseInt(wallpaperSelect.value, 10);
        
        // Validate
        if (isNaN(trainerID) || trainerID < 0 || trainerID > 65535) {
            errorMessage.textContent = "Please enter a valid Trainer ID (0-65535)";
            errorSection.style.display = 'block';
            return;
        }
        
        try {
            // Generate password
            const indices = generatePassword(trainerID, wallpaper);
            
            if (!indices) {
                errorMessage.textContent = "Could not generate a valid password for this combination.";
                errorSection.style.display = 'block';
                return;
            }
            
            // Verify it works (sanity check)
            const verified = verifyPassword(indices, trainerID);
            if (verified !== wallpaper) {
                console.warn("Verification mismatch:", verified, "expected:", wallpaper);
                console.log("Indices:", indices);
            }
            
            // Convert to words
            const words = indicesToWords(indices);
            
            // Display
            document.getElementById('word1').textContent = words[0];
            document.getElementById('word2').textContent = words[1];
            document.getElementById('word3').textContent = words[2];
            document.getElementById('word4').textContent = words[3];
            
            outputSection.style.display = 'block';
            
        } catch (e) {
            errorMessage.textContent = e.message;
            errorSection.style.display = 'block';
        }
    });
    
    // Allow Enter key to trigger generation
    trainerIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });
});
