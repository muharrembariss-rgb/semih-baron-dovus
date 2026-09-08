# Semih vs Baron Özcan — Neon Dövüş

Mobil tarayıcı için hazırlanmış dokunmatik kontrollü HTML5 Canvas dövüş oyunudur. Semih oyuncu tarafından yönetilir; Baron Özcan bilgisayar rakibidir.

## Yerel çalıştırma

Proje kökünde basit bir statik sunucu açın:

```bash
python -m http.server 8000 --directory dist
```

Ardından `http://localhost:8000` adresini açın.

## Render kurulumu

1. Bu klasörü GitHub deposuna yükleyin.
2. Render'da **New > Static Site** seçin.
3. Depoyu bağlayın.
4. **Build Command** alanını boş bırakın.
5. **Publish Directory** alanına `dist` yazın.

## Kontroller

- Mobil: ekrandaki yön, zıplama ve yumruk düğmeleri
- Klavye: A/D veya yön tuşları, W/↑ zıplama, F/Boşluk yumruk
