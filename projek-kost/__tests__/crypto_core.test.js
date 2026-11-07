const {
    // Komponen Sesi, Password, dan HMAC sebelumnya
    generateSessionToken,
    validateTokenFormat,
    hashPassword,
    verifyPassword,
    generateBookingMac,
    verifyBookingMac,
    hashReservationData,
    hashPasswordBcrypt,
    verifyPasswordBcrypt,

    // Komponen Tugas 2: Enkripsi Terautentikasi (AEAD AES-256-GCM)
    generateAeadKey,
    encryptProductAead,
    decryptProductAead,
    encryptProductData,
    decryptProductData,
    decryptProductDataJson,
    serializeAeadPayload,
    deserializeAeadPayload
} = require('../lib/crypto_core');

describe('Kriptografi Kos-Kosan (Dasar)', () => {

    test('Token sesi memiliki format hex yang sesuai dan unik', () => {
        const token1 = generateSessionToken();
        const token2 = generateSessionToken();

        expect(validateTokenFormat(token1)).toBe(true);
        expect(validateTokenFormat(token2)).toBe(true);
        expect(token1).not.toBe(token2);
    });

    test('Verifikasi password yang benar harus berhasil', () => {
        const password = "KamarKos123!_Aman";
        const result = hashPassword(password);

        expect(result).toHaveProperty('hash');
        expect(result).toHaveProperty('salt');

        const isValid = verifyPassword(password, result.hash, result.salt);
        expect(isValid).toBe(true);
    });

    test('Verifikasi password yang salah harus ditolak', () => {
        const result = hashPassword("RahasiaPenyewa");
        const isValid = verifyPassword("PasswordSalah", result.hash, result.salt);
        expect(isValid).toBe(false);
    });

    test('Verifikasi HMAC valid dari data reservasi', () => {
        const bookingData = "kamar:A01|harga:1500000|penyewa:Budi";
        const secretKey = "dummy_secret_key_app";

        const mac = generateBookingMac(bookingData, secretKey);
        const isValid = verifyBookingMac(bookingData, secretKey, mac);

        expect(isValid).toBe(true);
    });

    test('Verifikasi HMAC gagal jika data dimodifikasi (Tampering)', () => {
        const bookingDataAsli = "kamar:A01|harga:1500000";
        const bookingDataPalsu = "kamar:A01|harga:15000";
        const secretKey = "kunci_rahasia";

        const macAsli = generateBookingMac(bookingDataAsli, secretKey);
        const isValid = verifyBookingMac(bookingDataPalsu, secretKey, macAsli);
        expect(isValid).toBe(false);
    });

    test('Urutan isi data (JSON) terbalik tetap menghasilkan hash yang sama', () => {
        const data1 = { kamar: "A01", harga: 1500000 };
        const data2 = { harga: 1500000, kamar: "A01" };

        const hash1 = hashReservationData(data1);
        const hash2 = hashReservationData(data2);

        expect(hash1).toBe(hash2);
    });
});

describe('Tugas 2 — Enkripsi Terautentikasi dan Integritas Data Produk (AEAD AES-256-GCM)', () => {

    // Data produk sintetis untuk pengujian
    const dummyProduct = {
        id: 'kost-001',
        name: 'Kost Ajolie Executive',
        price: 1750000,
        type: 'Campur',
        secretOwnerNotes: 'Diskon khusus akhir pekan 15% jika bayar langsung 6 bulan.',
        internalMargin: 250000
    };

    // ------------------------------------------------------------------------
    // SKENARIO 1 (Uji Positif): Enkripsi dan Dekripsi Data Produk Berhasil
    // Membuktikan kerahasiaan dan integritas (roundtrip) berjalan sempurna
    // ------------------------------------------------------------------------
    test('Skenario 1 (Positif): Enkripsi & dekripsi data produk berhasil dan identik (Roundtrip)', () => {
        const key = generateAeadKey(); // Kunci CSPRNG 256-bit
        const aadContext = 'kamar:kost-001';

        // 1. Enkripsi data produk
        const encrypted = encryptProductData(dummyProduct, key, aadContext);

        // Verifikasi struktur parameter terdokumentasi
        expect(encrypted.algorithm).toBe('aes-256-gcm');
        expect(encrypted.keyLength).toBe(256);
        expect(encrypted.iv).toHaveLength(24);   // 12 bytes = 24 karakter hex
        expect(encrypted.tag).toHaveLength(32);  // 16 bytes = 32 karakter hex
        expect(encrypted.ciphertext.length).toBeGreaterThan(0);
        expect(encrypted.ciphertext).not.toContain('Ajolie'); // Kerahasiaan terbukti: plaintext tidak bocor

        // 2. Dekripsi data produk
        const decryptedJson = decryptProductDataJson(encrypted, key, aadContext);

        // Verifikasi hasil dekripsi identik dengan objek produk awal
        expect(decryptedJson).toEqual(dummyProduct);
        expect(decryptedJson.name).toBe('Kost Ajolie Executive');
        expect(decryptedJson.secretOwnerNotes).toBe(dummyProduct.secretOwnerNotes);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 2 (Uji Negatif Integritas): Modifikasi Data Ciphertext Ditolak
    // Membuktikan proteksi integritas dari bit-flipping / tampering oleh hacker
    // ------------------------------------------------------------------------
    test('Skenario 2 (Negatif): Modifikasi ciphertext (Tampering) ditolak dan gagal tertutup', () => {
        const key = generateAeadKey();
        const aadContext = 'kamar:kost-001';

        const encrypted = encryptProductData(dummyProduct, key, aadContext);

        // Simulasi modifikasi ciphertext oleh penyerang (mengubah 1 karakter hex)
        const originalChar = encrypted.ciphertext[0];
        const tamperedChar = originalChar === 'a' ? 'b' : 'a';
        const tamperedCiphertext = tamperedChar + encrypted.ciphertext.slice(1);

        const tamperedPayload = {
            ...encrypted,
            ciphertext: tamperedCiphertext
        };

        // Verifikasi sistem menolak dan melempar galat tertutup tanpa membocorkan plaintext
        expect(() => {
            decryptProductData(tamperedPayload, key, aadContext);
        }).toThrow(/Autentikasi data gagal/i);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 3 (Uji Negatif Integritas): Modifikasi Tag Otentikasi Ditolak
    // Membuktikan tag otentikasi GMAC tidak dapat dipalsukan
    // ------------------------------------------------------------------------
    test('Skenario 3 (Negatif): Modifikasi authentication tag ditolak dan gagal tertutup', () => {
        const key = generateAeadKey();
        const aadContext = 'kamar:kost-001';

        const encrypted = encryptProductData(dummyProduct, key, aadContext);

        // Modifikasi tag otentikasi 128-bit
        const originalTagChar = encrypted.tag[0];
        const tamperedTagChar = originalTagChar === '0' ? '1' : '0';
        const tamperedTag = tamperedTagChar + encrypted.tag.slice(1);

        const tamperedPayload = {
            ...encrypted,
            tag: tamperedTag
        };

        expect(() => {
            decryptProductData(tamperedPayload, key, aadContext);
        }).toThrow(/Autentikasi data gagal/i);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 4 (Uji Negatif Otorisasi): Penggunaan Kunci yang Salah Ditolak
    // Membuktikan kerahasiaan tidak dapat ditembus tanpa kunci yang benar
    // ------------------------------------------------------------------------
    test('Skenario 4 (Negatif): Penggunaan kunci yang salah ditolak dan gagal tertutup', () => {
        const correctKey = generateAeadKey();
        const wrongKey = generateAeadKey(); // Kunci acak lain yang berbeda
        const aadContext = 'kamar:kost-001';

        const encrypted = encryptProductData(dummyProduct, correctKey, aadContext);

        // Dekripsi dengan kunci yang salah
        expect(() => {
            decryptProductData(encrypted, wrongKey, aadContext);
        }).toThrow(/Autentikasi data gagal/i);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 5 (Uji Negatif Integritas Konteks): Modifikasi AAD Ditolak
    // Membuktikan AAD mengikat konteks produk (pencegahan cut-and-paste attack)
    // ------------------------------------------------------------------------
    test('Skenario 5 (Negatif): Modifikasi AAD (Context Swapping) ditolak', () => {
        const key = generateAeadKey();
        const originalAad = 'kamar:kost-001';
        const swappedAad = 'kamar:kost-999'; // Menukar konteks ke kamar lain

        const encrypted = encryptProductData(dummyProduct, key, originalAad);

        // Dekripsi dengan AAD yang berbeda
        expect(() => {
            decryptProductData(encrypted, key, swappedAad);
        }).toThrow(/Autentikasi data gagal/i);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 6 (Uji Keunikan Nonce): Enkripsi Ganda Menghasilkan IV & Ciphertext Berbeda
    // Membuktikan CSPRNG menjamin keunikan nonce (mencegah nonce reuse attack)
    // ------------------------------------------------------------------------
    test('Skenario 6: Enkripsi teks yang sama menghasilkan Nonce (IV) dan Ciphertext unik', () => {
        const key = generateAeadKey();
        const plaintext = "Harga Promo Kamar: Rp 1.500.000";

        const enc1 = encryptProductAead(plaintext, key);
        const enc2 = encryptProductAead(plaintext, key);

        // Nonce/IV harus berbeda
        expect(enc1.iv).not.toBe(enc2.iv);
        // Ciphertext harus berbeda meskipun plaintext sama
        expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
        // Kedua tag otentikasi juga berbeda
        expect(enc1.tag).not.toBe(enc2.tag);

        // Keduanya tetap dapat didekripsi ke plaintext yang sama
        expect(decryptProductAead(enc1, key)).toBe(plaintext);
        expect(decryptProductAead(enc2, key)).toBe(plaintext);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 7 (Uji Validasi Masukan & Prinsip Fail-Closed): Parameter Cacat Ditolak
    // ------------------------------------------------------------------------
    test('Skenario 7: Validasi masukan menolak kunci, IV, atau tag yang tidak valid', () => {
        const invalidShortKey = 'kunci-kurang-panjang-123'; // Bukan 64 hex
        const validKey = generateAeadKey();

        // 1. Kunci pendek ditolak saat enkripsi
        expect(() => {
            encryptProductAead('data', invalidShortKey);
        }).toThrow(TypeError);

        // 2. Plaintext null ditolak
        expect(() => {
            encryptProductAead(null, validKey);
        }).toThrow(TypeError);

        // 3. IV cacat (bukan 24 hex) ditolak saat dekripsi
        expect(() => {
            decryptProductAead({
                iv: 'iv_pendek',
                tag: '0123456789abcdef0123456789abcdef',
                ciphertext: 'abcdef'
            }, validKey);
        }).toThrow(/IV \/ Nonce tidak sah/i);

        // 4. Tag cacat (bukan 32 hex) ditolak saat dekripsi
        expect(() => {
            decryptProductAead({
                iv: '0123456789abcdef01234567',
                tag: 'tag_cacat',
                ciphertext: 'abcdef'
            }, validKey);
        }).toThrow(/Tag otentikasi tidak sah/i);
    });

    // ------------------------------------------------------------------------
    // SKENARIO 8 (Uji Serialisasi Format Portabel): v1:<iv>:<tag>:<ciphertext>
    // ------------------------------------------------------------------------
    test('Skenario 8: Serialisasi portabel string dapat didekripsi dengan sukses', () => {
        const key = generateAeadKey();
        const payload = encryptProductAead("Data Portabel Kamar", key);

        // Format serial: v1:<iv>:<tag>:<ciphertext>
        const serialized = payload.serialized;
        expect(serialized).toMatch(/^v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);

        // Dekripsi langsung dari string serial
        const decrypted = decryptProductAead(serialized, key);
        expect(decrypted).toBe("Data Portabel Kamar");

        // Format serial palsu / cacat ditolak
        expect(() => {
            decryptProductAead("format_salah:123", key);
        }).toThrow(/Format string terenkripsi tidak sah/i);
    });
});
