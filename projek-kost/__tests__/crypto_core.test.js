const {
    generateSessionToken,
    validateTokenFormat,
    hashPassword,
    verifyPassword,
    generateBookingMac,
    verifyBookingMac,
    hashReservationData
} = require('../lib/crypto_core'); 

describe('Kriptografi Kos-Kosan', () => {
    
    // 1. Skenario Positif (Token)
    test('Token sesi memiliki format hex yang sesuai dan unik', () => {
        const token1 = generateSessionToken();
        const token2 = generateSessionToken();
        
        expect(validateTokenFormat(token1)).toBe(true);
        expect(validateTokenFormat(token2)).toBe(true);
        expect(token1).not.toBe(token2); // Harus unik/berbeda
    });

    // 2. Skenario Positif (Password Benar)
    test('Verifikasi password yang benar harus berhasil', () => {
        const password = "KamarKos123!_Aman";
        const result = hashPassword(password);
        
        expect(result).toHaveProperty('hash');
        expect(result).toHaveProperty('salt');
        
        const isValid = verifyPassword(password, result.hash, result.salt);
        expect(isValid).toBe(true);
    });

    // 3. Skenario Negatif (Password Salah)
    test('Verifikasi password yang salah harus ditolak', () => {
        const result = hashPassword("RahasiaPenyewa");
        
        // Memasukkan password yang salah
        const isValid = verifyPassword("PasswordSalah", result.hash, result.salt);
        expect(isValid).toBe(false);
    });

    // 4. Skenario Integritas (HMAC Valid)
    test('Verifikasi HMAC valid dari data reservasi', () => {
        const bookingData = "kamar:A01|harga:1500000|penyewa:Budi";
        const secretKey = "dummy_secret_key_app";
        
        const mac = generateBookingMac(bookingData, secretKey);
        const isValid = verifyBookingMac(bookingData, secretKey, mac);
        
        expect(isValid).toBe(true);
    });

    // 5. Skenario Negatif Integritas (Data Diubah Hacker)
    test('Verifikasi HMAC gagal jika data dimodifikasi (Tampering)', () => {
        const bookingDataAsli = "kamar:A01|harga:1500000";
        const bookingDataPalsu = "kamar:A01|harga:15000"; // Harga diedit
        const secretKey = "kunci_rahasia";
        
        const macAsli = generateBookingMac(bookingDataAsli, secretKey);
        
        // Mengecek data palsu dengan stempel (MAC) asli
        const isValid = verifyBookingMac(bookingDataPalsu, secretKey, macAsli);
        expect(isValid).toBe(false);
    });
    
    // 6. Skenario Batas (Hash Objek Kosisten)
    test('Urutan isi data (JSON) terbalik tetap menghasilkan hash yang sama', () => {
        const data1 = { kamar: "A01", harga: 1500000 };
        const data2 = { harga: 1500000, kamar: "A01" }; // Dibalik urutannya
        
        const hash1 = hashReservationData(data1);
        const hash2 = hashReservationData(data2);
        
        expect(hash1).toBe(hash2);
    });
});